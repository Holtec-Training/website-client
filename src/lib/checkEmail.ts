import { getOrCreateSessionId } from './sessionId'

export type CheckEmailResult =
  | { status: 'available' }
  | { status: 'claimed'; program_title: string; claimed_at: string }

export async function checkEmail(email: string, src: string): Promise<CheckEmailResult> {
  try {
    const res = await fetch('/api/check-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, session_id: getOrCreateSessionId(), src }),
    })
    if (!res.ok) return { status: 'available' }
    return (await res.json()) as CheckEmailResult
  } catch {
    return { status: 'available' }
  }
}
