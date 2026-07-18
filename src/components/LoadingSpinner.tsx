interface Props {
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function LoadingSpinner({ label, size = 'md' }: Props) {
  return (
    <div className={`spinner spinner-${size}`} role="status" aria-live="polite">
      <div className="spinner-ring" aria-hidden="true" />
      {label && <div className="spinner-label">{label}</div>}
      {!label && <span className="sr-only">Loading…</span>}
    </div>
  )
}
