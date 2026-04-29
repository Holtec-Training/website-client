import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer
      className="flex items-center justify-between px-12 py-8 max-[768px]:flex-col max-[768px]:gap-3 max-[768px]:text-center max-[768px]:px-5"
      style={{ borderTop: '1px solid var(--border)' }}
    >
      <Link to="/" className="no-underline">
        <img
          src="/holtec-logo.svg"
          alt="Holtec"
          style={{
            height: '58px',
            width: 'auto',
            mixBlendMode: 'multiply',
          }}
        />
      </Link>
      <p className="text-[13px] m-0" style={{ color: 'var(--muted)' }}>
        © 2026 Holtec Personal Training Agency. All rights reserved.
      </p>
    </footer>
  )
}
