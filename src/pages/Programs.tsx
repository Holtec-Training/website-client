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
    fireFunnelEvent('page_viewed', { src })
    Promise.all([getSiteConfig(), getPrograms(), getQuestions()]).then(([cfg, ps, qs]) => {
      setSiteConfig(cfg)
      setPrograms(ps)
      setQuestions(qs)
    })
  }, [src])

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

  const wrap = (child: React.ReactNode) => (
    <>
      {meta}
      <div className="qp-page">{child}</div>
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
          fireFunnelEvent('quiz_started', { src })
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
            fireFunnelEvent('contact_captured', {
              src, first_name: c.first_name, last_name: c.last_name, email: c.email, phone: c.phone,
            })
            fireFunnelEvent('recommendations_shown', {
              src, email: c.email,
              extras: { matched: state.matched.map(p => p.slug.current) },
            })
            setState(s => ({ ...s, contact: c, step: 'results' }))
            return
          }
          setState(s => ({ ...s, contact: c, step: 'checking-email' }))
          const result = await checkEmail(c.email, src)
          if (result.status === 'claimed') {
            fireFunnelEvent('email_pre_check_hit', {
              src, email: c.email, first_name: c.first_name, last_name: c.last_name,
              extras: { program_title: result.program_title, claimed_at: result.claimed_at },
            })
            fireFunnelEvent('recommendations_shown', {
              src, email: c.email,
              extras: { matched: state.matched.map(p => p.slug.current) },
            })
            setState(s => ({
              ...s,
              step: 'results',
              priorClaim: { program_title: result.program_title, claimed_at: result.claimed_at },
            }))
            return
          }
          fireFunnelEvent('contact_captured', {
            src, first_name: c.first_name, last_name: c.last_name, email: c.email, phone: c.phone,
          })
          fireFunnelEvent('recommendations_shown', {
            src, email: c.email,
            extras: { matched: state.matched.map(p => p.slug.current) },
          })
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
            fireFunnelEvent('checkout_initiated', {
              src, email: state.contact.email, extras: { program_ids },
            })
            sessionStorage.setItem('program_portal_email', state.contact.email)
            const body = {
              first_name: state.contact.first_name,
              last_name: state.contact.last_name,
              email: state.contact.email,
              phone: state.contact.phone,
              program_ids,
              session_id: sessionStorage.getItem('session_id') ?? '',
              src,
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
            fireFunnelEvent('free_selected', { src, email: state.contact.email, program_id })
            setState(s => ({ ...s, selectedIds: program_ids, step: 'submitting' }))
            await fetch('/api/free-selection', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                first_name: state.contact.first_name,
                last_name: state.contact.last_name,
                email: state.contact.email,
                program_id,
                session_id: sessionStorage.getItem('session_id') ?? '',
                src,
                timestamp: new Date().toISOString(),
              }),
            })
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
    return wrap(<SuccessStep variant="free" email={state.contact.email} />)
  }

  return wrap(null)
}
