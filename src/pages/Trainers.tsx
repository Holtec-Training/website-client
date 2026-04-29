import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, User } from 'lucide-react'
import { sanityClient } from '../lib/sanity'
import type { Trainer } from '../types/trainer'

const TAG_LABELS: Record<string, string> = {
  strength: 'Strength',
  'weight-loss': 'Weight Loss',
  cardio: 'Cardio',
  nutrition: 'Nutrition',
  rehab: 'Rehab',
}

const FILTER_OPTIONS = [
  { value: 'all',         label: 'All' },
  { value: 'strength',    label: 'Strength' },
  { value: 'weight-loss', label: 'Weight Loss' },
  { value: 'cardio',      label: 'Cardio & Endurance' },
  { value: 'nutrition',   label: 'Nutrition' },
  { value: 'rehab',       label: 'Rehab & Mobility' },
]

const TRAINERS_QUERY = `
  *[_type == "trainer"] | order(name asc) {
    _id, name, slug, location, specialties, spec, isNew,
    photo { asset -> { url } }
  }
`

export default function Trainers() {
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    sanityClient
      .fetch<Trainer[]>(TRAINERS_QUERY)
      .then((data) => setTrainers(data))
      .catch((err) => console.error('Failed to fetch trainers:', err))
      .finally(() => setLoading(false))
  }, [])

  const filtered =
    activeFilter === 'all'
      ? trainers
      : trainers.filter((t) => t.specialties?.includes(activeFilter))

  return (
    <>
      {/* ── Page header ── */}
      <div className="max-w-[1100px] mx-auto px-12 pt-[72px] pb-12 max-[768px]:px-5 max-[768px]:pt-10 max-[768px]:pb-7">
        <h2
          className="font-barlow-condensed font-black italic uppercase leading-none mb-3"
          style={{ fontSize: 'clamp(40px, 6vw, 64px)' }}
        >
          Our <span style={{ color: 'var(--blue-light)' }}>Trainers</span>
        </h2>
        <p className="text-[17px] max-w-[520px] m-0" style={{ color: 'var(--muted)' }}>
          Every trainer on Holtec is qualified, vetted, and ready to help you reach your goals.
        </p>
      </div>

      {/* ── Filter bar ── */}
      <div className="max-w-[1100px] mx-auto px-12 pb-10 flex gap-2.5 flex-wrap max-[768px]:px-5 max-[768px]:pb-7">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setActiveFilter(opt.value)}
            className="font-barlow-condensed font-semibold text-[14px] uppercase tracking-[0.05em] px-[18px] py-2 rounded-full cursor-pointer transition-all duration-200 border"
            style={{
              background: activeFilter === opt.value ? 'var(--blue)' : 'var(--surface)',
              borderColor: activeFilter === opt.value ? 'var(--blue)' : 'var(--border)',
              color: activeFilter === opt.value ? '#fff' : 'var(--muted)',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* ── Trainer grid ── */}
      <div className="max-w-[1100px] mx-auto px-12 pb-[100px] max-[768px]:px-5 max-[768px]:pb-[60px]">
        {loading ? (
          <div
            className="flex items-center justify-center py-24"
            style={{ color: 'var(--muted)' }}
          >
            <span className="font-barlow-condensed font-semibold text-[16px] uppercase tracking-[0.05em] opacity-60">
              Loading trainers...
            </span>
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="flex items-center justify-center py-24"
            style={{ color: 'var(--muted)' }}
          >
            <span className="font-barlow-condensed font-semibold text-[16px] uppercase tracking-[0.05em] opacity-60">
              {trainers.length === 0
                ? 'No trainers listed yet — check back soon.'
                : 'No trainers match this filter.'}
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6 max-[768px]:grid-cols-2 max-[560px]:grid-cols-1">
            {filtered.map((trainer) => (
              <TrainerCard key={trainer._id} trainer={trainer} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

interface TrainerCardProps {
  trainer: Trainer
}

function TrainerCard({ trainer }: TrainerCardProps) {
  const firstName = trainer.name.split(' ')[0]

  return (
    <article
      className="rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-1 group"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(91,200,245,0.3)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
      }}
    >
      {/* Photo area */}
      <div
        className="relative flex items-center justify-center overflow-hidden"
        style={{ aspectRatio: '4/3', width: '100%' }}
      >
        {trainer.photo?.asset?.url ? (
          <img
            src={trainer.photo.asset.url}
            alt={trainer.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="striped-bg w-full h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-2" style={{ color: 'var(--muted)' }}>
              <User size={40} strokeWidth={1.5} style={{ opacity: 0.3 }} />
              <span className="text-[11px] font-mono" style={{ opacity: 0.5 }}>
                trainer photo
              </span>
            </div>
          </div>
        )}

        {/* Badge */}
        <span
          className="absolute top-3 left-3 font-barlow-condensed font-semibold text-[12px] uppercase tracking-[0.08em] px-3 py-1 rounded-full"
          style={{
            background: 'rgba(9,9,12,0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid var(--border)',
            color: 'var(--blue-light)',
          }}
        >
          {trainer.isNew ? 'New' : 'Verified'}
        </span>
      </div>

      {/* Info */}
      <div className="p-6">
        <h4
          className="font-barlow-condensed font-black italic uppercase text-[22px] mb-1"
          style={{ color: 'var(--text)' }}
        >
          {trainer.name}
        </h4>

        <div
          className="flex items-center gap-1.5 text-[13px] mb-4"
          style={{ color: 'var(--muted)' }}
        >
          <MapPin size={13} strokeWidth={2} />
          {trainer.location}
        </div>

        <div className="flex flex-wrap gap-1.5 mb-5">
          {(trainer.specialties ?? []).map((tag) => (
            <span
              key={tag}
              className="font-barlow-condensed font-semibold text-[12px] uppercase tracking-[0.05em] px-2.5 py-0.5 rounded-md"
              style={{
                color: 'var(--muted)',
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
              }}
            >
              {TAG_LABELS[tag] ?? tag}
            </span>
          ))}
        </div>

        <Link
          to={`/trainers/${trainer.slug.current}`}
          className="block w-full font-barlow-condensed font-bold text-[14px] uppercase tracking-[0.06em] py-2.5 rounded-lg text-center transition-all duration-200"
          style={{
            background: 'transparent',
            border: '1px solid var(--blue)',
            color: 'var(--blue-light)',
            textDecoration: 'none',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLAnchorElement
            el.style.background = 'var(--blue)'
            el.style.color = '#fff'
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLAnchorElement
            el.style.background = 'transparent'
            el.style.color = 'var(--blue-light)'
          }}
        >
          Connect with {firstName}
        </Link>
      </div>
    </article>
  )
}
