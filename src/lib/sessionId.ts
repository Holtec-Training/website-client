export function getOrCreateSessionId(): string {
  const existing = sessionStorage.getItem('session_id')
  if (existing) return existing
  const id = crypto.randomUUID()
  sessionStorage.setItem('session_id', id)
  return id
}
