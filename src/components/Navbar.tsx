import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  // Close menu on route change / scroll
  useEffect(() => {
    if (menuOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    [
      'font-barlow-condensed font-semibold text-[15px] uppercase tracking-[0.06em] no-underline transition-colors duration-200',
      isActive ? 'text-[var(--text)]' : 'text-[var(--muted)] hover:text-[var(--text)]',
    ].join(' ')

  const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      'font-barlow-condensed font-semibold text-[20px] uppercase tracking-[0.06em] no-underline transition-colors duration-200 py-3 border-b block',
      isActive ? 'text-[var(--text)]' : 'text-[var(--muted)]',
    ].join(' ')

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-12 max-[768px]:px-5"
        style={{
          height: '88px',
          background: 'rgba(244,245,247,0.95)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2.5 no-underline" onClick={() => setMenuOpen(false)}>
          <img
            src="/holtec-logo.svg"
            alt="Holtec"
            style={{ height: '80px', width: 'auto', mixBlendMode: 'multiply' }}
          />
        </NavLink>

        {/* Desktop nav */}
        <ul className="flex items-center gap-9 list-none m-0 p-0 max-[768px]:hidden">
          <li><NavLink to="/" end className={linkClass}>Home</NavLink></li>
          <li><NavLink to="/trainers" className={linkClass}>Our Trainers</NavLink></li>
          <li>
            <NavLink
              to="/contact"
              className="font-barlow-condensed font-semibold text-[15px] uppercase tracking-[0.06em] no-underline text-white px-[22px] py-2 rounded-[var(--radius)] transition-colors duration-200"
              style={{ background: 'var(--blue)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#1a75f0' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--blue)' }}
            >
              Connect
            </NavLink>
          </li>
        </ul>

        {/* Mobile hamburger */}
        <button
          className="hidden max-[768px]:flex items-center justify-center w-10 h-10 rounded-lg cursor-pointer"
          style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)' }}
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={20} strokeWidth={2} /> : <Menu size={20} strokeWidth={2} />}
        </button>
      </nav>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-[99]"
          style={{ paddingTop: '88px', background: 'rgba(244,245,247,0.98)', backdropFilter: 'blur(14px)' }}
          onClick={() => setMenuOpen(false)}
        >
          <div className="px-5 pt-6 flex flex-col gap-0" onClick={e => e.stopPropagation()}>
            <NavLink to="/" end className={mobileLinkClass} style={{ borderColor: 'var(--border)' }} onClick={() => setMenuOpen(false)}>
              Home
            </NavLink>
            <NavLink to="/trainers" className={mobileLinkClass} style={{ borderColor: 'var(--border)' }} onClick={() => setMenuOpen(false)}>
              Our Trainers
            </NavLink>
            <div className="pt-6">
              <NavLink
                to="/contact"
                className="font-barlow-condensed font-bold text-[18px] uppercase tracking-[0.06em] no-underline text-white px-6 py-3.5 rounded-[var(--radius)] block text-center"
                style={{ background: 'var(--blue)' }}
                onClick={() => setMenuOpen(false)}
              >
                Connect
              </NavLink>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
