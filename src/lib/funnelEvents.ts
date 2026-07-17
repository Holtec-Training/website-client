import { getOrCreateSessionId } from './sessionId'

export interface FunnelEventExtras {
  src: string
  email?: string
  first_name?: string
  last_name?: string
  phone?: string
  program_id?: string
  stripe_checkout_session_id?: string
  amount_cents?: number
  extras?: Record<string, unknown>
}

export async function fireFunnelEvent(event: string, ex: FunnelEventExtras): Promise<void> {
  const body = {
    event,
    session_id: getOrCreateSessionId(),
    timestamp: new Date().toISOString(),
    user_agent: navigator.userAgent,
    ...ex,
  }
  try {
    await fetch('/api/funnel-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    // fire-and-forget
  }
}
