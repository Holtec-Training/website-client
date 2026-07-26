import { getOrCreateSessionId } from './sessionId'

export type CheckEmailResult =
  | { status: 'available' }
  | { status: 'claimed'; program_title: string; claimed_at: string }
  | { status: 'error'; message: string }

/**
 * Prior-claim pre-check. Called synchronously from ContactStep.
 *
 * Failure policy (per check-email-claim spec § Error handling):
 *   - **Production**: fail open — any non-200 or network error is treated as
 *     `available` so a Sheets outage doesn't hard-block signups. Layer 2
 *     (program-fulfilment server-side block on Path A) catches slippage.
 *   - **Dev** (Vite's `import.meta.env.DEV`): fail loud — return `error` so
 *     wiring bugs surface immediately during testing. ContactStep keeps the
 *     customer on the form and shows the message.
 */
export async function checkEmail(email: string, src: string): Promise<CheckEmailResult> {
  const failMode: 'open' | 'loud' = import.meta.env.DEV ? 'loud' : 'open'
  try {
    const res = await fetch('/api/check-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, session_id: getOrCreateSessionId(), src }),
    })
    if (!res.ok) {
      if (failMode === 'loud') {
        const body = await res.text().catch(() => '')
        return { status: 'error', message: `check-email returned ${res.status}: ${body || '(empty body)'}` }
      }
      return { status: 'available' }
    }
    return (await res.json()) as CheckEmailResult
  } catch (e) {
    if (failMode === 'loud') {
      const message = e instanceof Error ? e.message : String(e)
      return { status: 'error', message: `check-email network error: ${message}` }
    }
    return { status: 'available' }
  }
}
