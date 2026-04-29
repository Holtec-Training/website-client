import { NavLink } from 'react-router-dom'

export default function Navbar() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    [
      'font-barlow-condensed font-semibold text-[15px] uppercase tracking-[0.06em] no-underline transition-colors duration-200',
      isActive ? 'text-[var(--text)]' : 'text-[var(--muted)] hover:text-[var(--text)]',
    ].join(' ')

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-12 max-[768px]:px-5"
      style={{
        height: '88px',
        background: 'rgba(244,245,247,0.90)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* Logo */}
      <NavLink to="/" className="flex items-center gap-2.5 no-underline">
        <img
          src="/holtec-logo.svg"
          alt="Holtec"
          style={{
            height: '80px',
            width: 'auto',
            mixBlendMode: 'multiply',
          }}
        />
      </NavLink>

      {/* Nav links */}
      <ul className="flex items-center gap-9 max-[768px]:gap-[18px] list-none m-0 p-0">
        <li>
          <NavLink to="/" end className={linkClass}>
            Home
          </NavLink>
        </li>
        <li>
          <NavLink to="/trainers" className={linkClass}>
            Our Trainers
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/contact"
            className="font-barlow-condensed font-semibold text-[15px] uppercase tracking-[0.06em] no-underline text-white px-[22px] py-2 rounded-[var(--radius)] transition-colors duration-200"
            style={{ background: 'var(--blue)' }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLElement).style.background = '#1a75f0'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLElement).style.background = 'var(--blue)'
            }}
          >
            Connect
          </NavLink>
        </li>
      </ul>
    </nav>
  )
}
