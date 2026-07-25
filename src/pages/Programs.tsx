import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { fireFunnelEvent } from '../lib/funnelEvents'
import { getPrograms, getQuestions, getSiteConfig } from '../lib/programs'
import { scoreRecommendations } from '../lib/scoreRecommendations'
import { checkEmail } from '../lib/checkEmail'
import type { Program } from '../types/program'
import type { Question, AttributeTag } from '../types/question'
import type { SiteConfig } from '../types/siteConfig'
import Landing from '../components/quiz/Landing'
import ContactStep from '../components/quiz/ContactStep'
import QuizStep from '../components/quiz/QuizStep'
import ResultsStep from '../components/quiz/ResultsStep'
import SuccessStep from '../components/quiz/SuccessStep'
import EmbeddedCheckoutStep from '../components/quiz/EmbeddedCheckoutStep'
import LoadingSpinner from '../components/LoadingSpinner'

type Step = 'landing' | 'quiz' | 'contact' | 'checking-email' | 'results' | 'submitting' | 'embedded-checkout' | 'success'

// Feature flag — set VITE_CHECK_EMAIL_ENABLED=false in .env to skip the pre-check
// (useful while Stripe/n8n side is still being wired up). Defaults to enabled.
// Read at call time so tests can override via vi.stubEnv.
const isCheckEmailEnabled = () => import.meta.env.VITE_CHECK_EMAIL_ENABLED !== 'false'

interface Contact {
  first_name: string
  last_name: string
  email: string
  phone: string
}

interface PriorClaim {
  program_title: string
  claimed_at: string
}

interface State {
  step: Step
  contact: Contact
  answers: AttributeTag[]
  selectedIds: string[]
  priorClaim: PriorClaim | null
  matched: Program[]
  checkoutClientSecret: string | null
}

const emptyContact: Contact = { first_name: '', last_name: '', email: '', phone: '' }

export default function Programs() {
  const [params] = useSearchParams()
  const src = params.get('src') ?? 'direct'
  const location = params.get('location') ?? ''
  const autoStart = params.get('auto') === '1'

  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null)
  const [programs, setPrograms] = useState<Program[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [state, setState] = useState<State>({
    step: autoStart ? 'quiz' : 'landing',
    contact: emptyContact,
    answers: [],
    selectedIds: [],
    priorClaim: null,
    matched: [],
    checkoutClientSecret: null,
  })

  useEffect(() => {
    Promise.all([getSiteConfig(), getPrograms(), getQuestions()]).then(([cfg, ps, qs]) => {
      setSiteConfig(cfg)
      setPrograms(ps)
      setQuestions(qs)
    })
  }, [src])

  // Fire *_displayed events when a screen becomes visible. One firing per step-transition.
  // The quiz has BOTH quiz_displayed (arrival, from here) AND quiz_completed (finished all
  // questions, fired from QuizStep's onComplete). Gap between the two = mid-quiz drop-off.
  useEffect(() => {
    if (!siteConfig || !siteConfig.programPortalEnabled) return
    if (state.step === 'landing') {
      fireFunnelEvent('landing_displayed', { src, location })
    } else if (state.step === 'quiz') {
      fireFunnelEvent('quiz_displayed', { src, location })
    } else if (state.step === 'contact') {
      fireFunnelEvent('contact_displayed', { src, location })
    } else if (state.step === 'results') {
      fireFunnelEvent('results_displayed', {
        src,
        location,
        matched_program_ids: state.matched.map(p => p.slug.current),
      })
    } else if (state.step === 'success') {
      fireFunnelEvent('success_displayed', { src, location })
    }
    // Deliberately no _displayed events for 'checking-email', 'submitting', 'embedded-checkout'
    // — those are transient loading states, not screens the customer is meant to dwell on.
  }, [state.step, siteConfig, src, state.matched])

  const meta = (
    <Helmet>
      <title>Find your program — Holtec Training</title>
      <meta name="description" content="Answer a short quiz and get matched with a training program built for your goals." />
      <meta property="og:title" content="Find your program — Holtec Training" />
      <meta property="og:description" content="Answer a short quiz and get matched with a training program built for your goals." />
      <meta property="og:image" content="https://holtectraining.co.nz/holtec-logo.png" />
      <meta property="og:type" content="website" />
    </Helmet>
  )

  const wrap = (child: React.ReactNode, extraClass = '') => (
    <>
      {meta}
      <div className={`qp-page${extraClass ? ' ' + extraClass : ''}`}>{child}</div>
    </>
  )

  if (!siteConfig) {
    return wrap(
      <div className="qp-loading">
        <LoadingSpinner label="Loading Program Portal…" size="lg" />
      </div>,
    )
  }

  if (!siteConfig.programPortalEnabled) {
    return wrap(
      <section className="qp-container qp-landing">
        <div className="qp-eyebrow">Program Portal</div>
        <h1 className="qp-landing-title">Coming soon.</h1>
        <p className="qp-landing-sub">
          We're setting up the training programs. Check back shortly.
        </p>
      </section>,
    )
  }

  if (state.step === 'landing') {
    return wrap(
      <Landing
        headline={siteConfig.landingHeadline}
        subhead={siteConfig.landingSubhead}
        onStart={() => {
          fireFunnelEvent('quiz_started', { src, location })
          setState(s => ({ ...s, step: 'quiz' }))
        }}
      />,
    )
  }

  if (state.step === 'quiz') {
    return wrap(
      <QuizStep
        questions={questions}
        onComplete={(answers) => {
          fireFunnelEvent('quiz_completed', { src, location })
          const scored = scoreRecommendations(programs, answers)
          setState(s => ({ ...s, answers, matched: scored, step: 'contact' }))
        }}
      />,
    )
  }

  if (state.step === 'contact') {
    return wrap(
      <ContactStep
        onSubmit={async (c) => {
          if (!isCheckEmailEnabled()) {
            // Feature-flagged off — skip pre-check entirely, straight to results.
            // results_shown will fire from the state.step useEffect.
            fireFunnelEvent('contact_submitted', { src, location })
            setState(s => ({ ...s, contact: c, step: 'results' }))
            return
          }
          setState(s => ({ ...s, contact: c, step: 'checking-email' }))
          const result = await checkEmail(c.email, src)
          if (result.status === 'claimed') {
            fireFunnelEvent('email_pre_check_hit', {
              src,
              location,
              extras: { program_title: result.program_title, claimed_at: result.claimed_at },
            })
            setState(s => ({
              ...s,
              step: 'results',
              priorClaim: { program_title: result.program_title, claimed_at: result.claimed_at },
            }))
            return
          }
          if (result.status === 'error') {
            // Dev-mode fail-loud: block the flow so the wiring bug is visible.
            // Production fails open in checkEmail() itself and never returns 'error'.
            console.error('[check-email]', result.message)
            alert(`Pre-check failed (dev mode) — cannot proceed until this is fixed.\n\n${result.message}`)
            setState(s => ({ ...s, step: 'contact' }))
            return
          }
          fireFunnelEvent('contact_submitted', { src, location })
          setState(s => ({ ...s, step: 'results' }))
        }}
      />,
    )
  }

  if (state.step === 'checking-email') {
    return wrap(
      <div className="qp-loading">
        <LoadingSpinner label="Checking your email…" size="lg" />
      </div>,
    )
  }

  if (state.step === 'results') {
    return wrap(
      <ResultsStep
        matched={state.matched}
        priorClaim={state.priorClaim}
        onSubmit={async ({ program_ids, path }) => {
          if (path === 'subscription') {
            const hasPriorClaim = !!state.priorClaim
            fireFunnelEvent('checkout_initiated', {
              src,
              location,
              free_program_id: hasPriorClaim ? '' : (program_ids[0] ?? ''),
              paid_program_ids: hasPriorClaim ? program_ids : program_ids.slice(1),
            })
            sessionStorage.setItem('program_portal_email', state.contact.email)
            sessionStorage.setItem('program_portal_src', src)
            sessionStorage.setItem('program_portal_location', location)
            // Persist a receipt snapshot so the /programs/thanks return page can render
            // authoritative receipt data without needing to call Stripe.
            const chargedCount = hasPriorClaim ? program_ids.length : Math.max(0, program_ids.length - 1)
            const receipt = {
              program_titles: program_ids.map(id => {
                const p = state.matched.find(m => m.slug.current === id)
                return p?.title ?? id
              }),
              free_program_title: hasPriorClaim ? null : (
                state.matched.find(m => m.slug.current === program_ids[0])?.title ?? program_ids[0]
              ),
              monthly_amount_cents: chargedCount * 3000,
              charged_count: chargedCount,
              has_prior_claim: hasPriorClaim,
            }
            sessionStorage.setItem('program_portal_receipt', JSON.stringify(receipt))
            const body = {
              first_name: state.contact.first_name,
              last_name: state.contact.last_name,
              email: state.contact.email,
              phone: state.contact.phone,
              program_ids,
              session_id: sessionStorage.getItem('session_id') ?? '',
              src,
              location,
              has_prior_claim: !!state.priorClaim,
            }
            setState(s => ({ ...s, selectedIds: program_ids, step: 'submitting' }))
            const res = await fetch('/api/checkout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
            })
            if (!res.ok) {
              const errorText = await res.text()
              console.error(`[/api/checkout] ${res.status}: ${errorText}`)
              alert(`Sorry, checkout couldn't start.\n\nDetails: ${errorText}`)
              setState(s => ({ ...s, step: 'results' }))
              return
            }
            let payload: { client_secret?: string } = {}
            try { payload = await res.json() } catch {
              alert('Sorry, checkout returned an unexpected response. Check the console for details.')
              setState(s => ({ ...s, step: 'results' }))
              return
            }
            if (!payload.client_secret) {
              alert('Checkout succeeded but no client_secret was returned. Check the Function logs.')
              setState(s => ({ ...s, step: 'results' }))
              return
            }
            setState(s => ({
              ...s,
              checkoutClientSecret: payload.client_secret!,
              step: 'embedded-checkout',
            }))
          } else {
            const program_id = program_ids[0]
            const program = state.matched.find(m => m.slug.current === program_id)
            const freeReceipt = {
              program_title: program?.title ?? program_id,
            }
            sessionStorage.setItem('program_portal_free_receipt', JSON.stringify(freeReceipt))
            fireFunnelEvent('free_selected', { src, location, free_program_id: program_id })
            setState(s => ({ ...s, selectedIds: program_ids, step: 'submitting' }))
            const res = await fetch('/api/free-selection', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                first_name: state.contact.first_name,
                last_name: state.contact.last_name,
                email: state.contact.email,
                phone: state.contact.phone,
                program_id,
                session_id: sessionStorage.getItem('session_id') ?? '',
                src,
                location,
                timestamp: new Date().toISOString(),
              }),
            })
            if (!res.ok) {
              console.error(`[/api/free-selection] ${res.status}`)
              alert("Sorry, we couldn't send your program right now. Please try again in a moment.")
              setState(s => ({ ...s, step: 'results' }))
              return
            }
            let payload: { status?: string; program_title?: string; claimed_at?: string; message?: string } = {}
            try { payload = await res.json() } catch { /* fall through */ }
            if (payload.status === 'blocked' && payload.program_title && payload.claimed_at) {
              // Layer 2 caught a prior claim (Layer 1 didn't catch it OR was bypassed).
              // Reuse the same UX Layer 1 uses: bounce back to Results with priorClaim set,
              // which renders the .qp-prior-claim banner and switches every price to $30/mo.
              // The Layer 2 workflow already fired `free_selection_blocked_duplicate` server-side.
              setState(s => ({
                ...s,
                step: 'results',
                priorClaim: { program_title: payload.program_title!, claimed_at: payload.claimed_at! },
              }))
              return
            }
            setState(s => ({ ...s, step: 'success' }))
          }
        }}
      />,
    )
  }

  if (state.step === 'submitting') {
    return wrap(
      <div className="qp-loading">
        <LoadingSpinner label="Preparing your checkout…" size="lg" />
      </div>,
    )
  }

  if (state.step === 'embedded-checkout' && state.checkoutClientSecret) {
    return wrap(
      <EmbeddedCheckoutStep
        clientSecret={state.checkoutClientSecret}
        onBack={() => setState(s => ({ ...s, step: 'results', checkoutClientSecret: null }))}
      />,
    )
  }

  if (state.step === 'success') {
    return wrap(<SuccessStep email={state.contact.email} />, 'qp-page-thanks')
  }

  return wrap(null)
}
