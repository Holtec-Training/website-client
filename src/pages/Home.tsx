import { Link } from 'react-router-dom'
import { User, CheckCircle, ArrowRight } from 'lucide-react'

export default function Home() {
  return (
    <>
      {/* ── Hero ── */}
      <section
        className="hero-glow relative flex flex-col items-center justify-center text-center px-6 py-20 overflow-hidden"
        style={{ minHeight: 'calc(100vh - 72px)' }}
      >
        {/* Badge */}
        <span
          className="inline-block font-barlow-condensed font-semibold text-[13px] uppercase tracking-[0.12em] rounded-full px-4 py-1.5 mb-7"
          style={{
            color: 'var(--blue)',
            border: '1px solid rgba(21,101,216,0.25)',
          }}
        >
          Personal Training Agency
        </span>

        {/* H1 */}
        <h1
          className="font-barlow-condensed font-black italic uppercase leading-none tracking-[-0.01em] mb-6"
          style={{ fontSize: 'clamp(52px, 8vw, 96px)' }}
        >
          Find Your{' '}
          <span style={{ color: 'var(--blue-light)' }}>Perfect</span>
          <br />
          Trainer.
        </h1>

        {/* Subtext */}
        <p
          className="text-[18px] font-light leading-[1.7] mb-11 max-w-[520px]"
          style={{ color: 'var(--muted)' }}
        >
          Holtec connects ambitious clients with talented new personal trainers
          — fresh energy, real results, and the right fit for you.
        </p>

        {/* CTA buttons */}
        <div className="flex gap-4 flex-wrap justify-center">
          <Link
            to="/trainers"
            className="font-barlow-condensed font-bold text-[17px] uppercase tracking-[0.05em] text-white no-underline inline-block px-8 py-3.5 rounded-[var(--radius)] transition-all duration-200 hover:-translate-y-px"
            style={{ background: 'var(--blue)' }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLElement).style.background = '#1a75f0'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLElement).style.background = 'var(--blue)'
            }}
          >
            Browse Trainers
          </Link>
          <Link
            to="/about"
            className="font-barlow-condensed font-bold text-[17px] uppercase tracking-[0.05em] no-underline inline-block px-8 py-3.5 rounded-[var(--radius)] transition-all duration-200 hover:-translate-y-px"
            style={{
              color: 'var(--text)',
              background: 'transparent',
              border: '1px solid var(--border)',
            }}
          >
            About Holtec
          </Link>
        </div>
      </section>

      {/* ── Stats row ── */}
      <div
        className="flex justify-center flex-wrap"
        style={{
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        {[
          { number: '20+', label: 'Certified Trainers' },
          { number: '100%', label: 'Qualified & Vetted' },
          { number: 'Free', label: 'Initial Match' },
          { number: 'All', label: 'Goals & Levels' },
        ].map((stat, i, arr) => (
          <div
            key={stat.label}
            className="flex-1 max-w-[220px] text-center px-5 py-10 max-[560px]:border-b max-[560px]:border-r-0"
            style={{
              borderRight:
                i < arr.length - 1 ? '1px solid var(--border)' : 'none',
            }}
          >
            <span
              className="font-barlow-condensed font-black italic text-[48px] leading-none block"
              style={{ color: 'var(--blue-light)' }}
            >
              {stat.number}
            </span>
            <span
              className="text-[13px] font-medium uppercase tracking-[0.08em] mt-1.5 block"
              style={{ color: 'var(--muted)' }}
            >
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {/* ── Two-path section ── */}
      <div className="grid grid-cols-2 gap-6 max-w-[1100px] mx-auto px-12 py-[100px] max-[768px]:grid-cols-1 max-[768px]:px-5 max-[768px]:py-[60px]">
        {/* Card 1 */}
        <PathCard
          to="/trainers"
          icon={<User size={26} stroke="#5bc8f5" strokeWidth={2} />}
          title="I'm Looking for a Trainer"
          description="Browse our roster of passionate, newly qualified PTs. Every trainer is vetted by Holtec — energetic, committed, and ready to work with you."
          linkLabel="View Trainers"
        />

        {/* Card 2 */}
        <PathCard
          to="/contact"
          icon={<CheckCircle size={26} stroke="#5bc8f5" strokeWidth={2} />}
          title="I'm a Personal Trainer"
          description="New to the industry and looking to build your client base? Holtec helps emerging PTs get in front of the right people — fast."
          linkLabel="Get in Touch"
        />
      </div>
    </>
  )
}

interface PathCardProps {
  to: string
  icon: React.ReactNode
  title: string
  description: string
  linkLabel: string
}

function PathCard({ to, icon, title, description, linkLabel }: PathCardProps) {
  return (
    <Link
      to={to}
      className="block no-underline rounded-2xl p-[48px_40px] transition-all duration-200 hover:-translate-y-1 group"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLElement).style.borderColor =
          'rgba(91,200,245,0.3)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
      }}
    >
      {/* Icon container */}
      <div
        className="w-[52px] h-[52px] rounded-xl flex items-center justify-center mb-6"
        style={{ background: 'rgba(21,101,216,0.2)' }}
      >
        {icon}
      </div>

      <h3
        className="font-barlow-condensed font-black italic uppercase text-[28px] mb-3"
        style={{ color: 'var(--text)' }}
      >
        {title}
      </h3>

      <p className="text-[15px] leading-[1.65]" style={{ color: 'var(--muted)' }}>
        {description}
      </p>

      <span
        className="inline-flex items-center gap-1.5 mt-6 font-barlow-condensed font-bold text-[15px] uppercase tracking-[0.06em] hover:opacity-80 transition-opacity"
        style={{ color: 'var(--blue-light)' }}
      >
        {linkLabel}
        <ArrowRight size={14} strokeWidth={2.5} />
      </span>
    </Link>
  )
}
