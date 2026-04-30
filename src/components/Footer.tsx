import { Link } from 'react-router-dom'
import { Mail, MapPin } from 'lucide-react'

const FOOTER_BG     = '#2060b5'
const FOOTER_TEXT   = '#94a3b8'
const FOOTER_HEAD   = '#e2e8f0'
const FOOTER_LINK   = '#93c5fd'
const FOOTER_BORDER = 'rgba(255,255,255,0.08)'

export default function Footer() {
  return (
    <footer style={{ background: FOOTER_BG, color: FOOTER_TEXT }}>
      <div className="max-w-[1100px] mx-auto px-12 py-14 max-[768px]:px-5">

        {/* ── Three columns ── */}
        <div className="grid grid-cols-3 gap-10 max-[768px]:grid-cols-1">

          {/* Brand */}
          <div className="flex flex-col gap-4">
            <Link to="/" className="no-underline self-start">
              <img
                src="/holtec-logo.svg"
                alt="Holtec"
                style={{ height: '90px', width: 'auto', display: 'block', filter: 'brightness(0) invert(1)' }}
              />
            </Link>
            <p className="text-[14px] leading-relaxed m-0">
              Connecting ambitious clients with newly qualified personal trainers across New Zealand.
            </p>
            <div className="flex items-center gap-2 text-[13px]">
              <MapPin size={13} className="shrink-0" />
              <span>Auckland, New Zealand</span>
            </div>
            <div className="flex items-center gap-2 text-[13px]">
              <Mail size={13} className="shrink-0" />
              <a
                href="mailto:hello@holtec.co.nz"
                className="no-underline transition-colors"
                style={{ color: FOOTER_TEXT }}
                onMouseEnter={e => (e.currentTarget.style.color = FOOTER_LINK)}
                onMouseLeave={e => (e.currentTarget.style.color = FOOTER_TEXT)}
              >
                hello@holtec.co.nz
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3
              className="text-[13px] font-semibold uppercase tracking-[0.08em] mb-4 m-0"
              style={{ color: FOOTER_HEAD }}
            >
              Navigation
            </h3>
            <ul className="flex flex-col gap-2.5 text-[14px] list-none m-0 p-0">
              {[
                { to: '/',         label: 'Home' },
                { to: '/trainers', label: 'Our Trainers' },
                { to: '/contact',  label: 'Contact' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="no-underline transition-colors"
                    style={{ color: FOOTER_TEXT }}
                    onMouseEnter={e => (e.currentTarget.style.color = FOOTER_LINK)}
                    onMouseLeave={e => (e.currentTarget.style.color = FOOTER_TEXT)}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Trainers */}
          <div>
            <h3
              className="text-[13px] font-semibold uppercase tracking-[0.08em] mb-4 m-0"
              style={{ color: FOOTER_HEAD }}
            >
              For Trainers
            </h3>
            <ul className="flex flex-col gap-2.5 text-[14px] list-none m-0 p-0">
              {[
                { to: '/contact', label: 'Apply to join' },
                { to: '/about',   label: 'How it works' },
                { to: '/contact', label: 'Get in touch' },
              ].map(({ to, label }) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="no-underline transition-colors"
                    style={{ color: FOOTER_TEXT }}
                    onMouseEnter={e => (e.currentTarget.style.color = FOOTER_LINK)}
                    onMouseLeave={e => (e.currentTarget.style.color = FOOTER_TEXT)}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div
          className="mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-[12px]"
          style={{ borderTop: `1px solid ${FOOTER_BORDER}` }}
        >
          <span>© {new Date().getFullYear()} Holtec Personal Training Agency. All rights reserved.</span>
          <span>Auckland, New Zealand</span>
        </div>

      </div>
    </footer>
  )
}
