import { Link } from 'react-router-dom'
import { LayoutGrid } from 'lucide-react'

export default function About() {
  return (
    <div className="max-w-[1100px] mx-auto px-12 pt-[72px] pb-[100px] max-[768px]:px-5 max-[768px]:pt-10 max-[768px]:pb-[60px]">
      {/* ── Lead section ── */}
      <div className="grid grid-cols-2 gap-[80px] items-center mb-20 max-[768px]:grid-cols-1 max-[768px]:gap-10">
        {/* Left */}
        <div>
          <h2
            className="font-barlow-condensed font-black italic uppercase leading-[1.05] mb-5"
            style={{ fontSize: 'clamp(36px, 5vw, 58px)' }}
          >
            Training,
            <br />
            <span style={{ color: 'var(--blue-light)' }}>Done Right</span>
            <br />
            From Day One.
          </h2>
          <p className="text-[16px] leading-[1.75] mb-4" style={{ color: 'var(--muted)' }}>
            Holtec was built on a simple idea: there are brilliant new personal
            trainers entering the industry every year, and there are people who
            need exactly what they offer — fresh perspective, full commitment,
            and competitive rates.
          </p>
          <p className="text-[16px] leading-[1.75] mb-6" style={{ color: 'var(--muted)' }}>
            We bridge that gap. As an agency, we hand-pick newly qualified PTs,
            support their onboarding, and connect them directly with clients who
            are ready to make a change.
          </p>
          <Link
            to="/contact"
            className="font-barlow-condensed font-bold text-[17px] uppercase tracking-[0.05em] text-white no-underline inline-block px-8 py-3.5 rounded-[var(--radius)] transition-all duration-200 hover:-translate-y-px mt-2"
            style={{ background: 'var(--blue)' }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLElement).style.background = '#1a75f0'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLElement).style.background = 'var(--blue)'
            }}
          >
            Get In Touch
          </Link>
        </div>

        {/* Right — placeholder */}
        <div
          className="striped-bg rounded-2xl flex flex-col items-center justify-center gap-2.5 font-mono text-[12px]"
          style={{
            aspectRatio: '1',
            border: '1px solid var(--border)',
            color: 'var(--muted)',
          }}
        >
          <LayoutGrid size={48} strokeWidth={1.5} style={{ opacity: 0.3 }} />
          <span>agency / brand photo</span>
        </div>
      </div>

      {/* ── Values grid ── */}
      <div className="grid grid-cols-3 gap-6 mt-[60px] max-[768px]:grid-cols-1">
        {[
          {
            number: '01',
            title: 'Quality First',
            body: 'Every trainer on our platform is fully certified and personally reviewed by Holtec before they go live.',
          },
          {
            number: '02',
            title: 'Real Connections',
            body: "We don't just list names. We match clients and trainers based on goals, personality, and location.",
          },
          {
            number: '03',
            title: 'Support New Talent',
            body: 'New PTs deserve a platform to shine. Holtec is where their careers start strong.',
          },
        ].map((v) => (
          <div
            key={v.number}
            className="rounded-2xl px-7 py-8"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            <div
              className="font-barlow-condensed font-bold text-[13px] uppercase tracking-[0.1em] mb-4"
              style={{ color: 'var(--blue-light)', opacity: 0.7 }}
            >
              {v.number}
            </div>
            <h4 className="font-barlow-condensed font-black italic uppercase text-[22px] mb-2.5">
              {v.title}
            </h4>
            <p className="text-[14px] leading-[1.65] m-0" style={{ color: 'var(--muted)' }}>
              {v.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
