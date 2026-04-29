import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapPin, User, ArrowLeft, Award } from 'lucide-react'
import { sanityClient } from '../lib/sanity'
import type { Trainer } from '../types/trainer'

const TAG_LABELS: Record<string, string> = {
  strength: 'Strength',
  'weight-loss': 'Weight Loss',
  cardio: 'Cardio',
  nutrition: 'Nutrition',
  rehab: 'Rehab',
}

const TRAINER_QUERY = `
  *[_type == "trainer" && slug.current == $slug][0] {
    _id, name, slug, location, specialties, spec, isNew,
    photo { asset -> { url } },
    bio,
    certifications,
    email,
    bookingUrl,
    instagramHandle
  }
`

export default function TrainerProfile() {
  const { slug } = useParams<{ slug: string }>()
  const [trainer, setTrainer] = useState<Trainer | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return
    sanityClient
      .fetch<Trainer | null>(TRAINER_QUERY, { slug })
      .then((data) => {
        if (!data) {
          setNotFound(true)
        } else {
          setTrainer(data)
        }
      })
      .catch((err) => {
        console.error('Failed to fetch trainer:', err)
        setNotFound(true)
      })
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div
        className="max-w-[1100px] mx-auto px-12 py-24 flex items-center justify-center max-[768px]:px-5"
        style={{ color: 'var(--muted)' }}
      >
        <span className="font-barlow-condensed font-semibold text-[16px] uppercase tracking-[0.05em] opacity-60">
          Loading...
        </span>
      </div>
    )
  }

  if (notFound || !trainer) {
    return (
      <div className="max-w-[1100px] mx-auto px-12 py-24 max-[768px]:px-5">
        <p
          className="font-barlow-condensed font-semibold text-[18px] mb-6"
          style={{ color: 'var(--muted)' }}
        >
          Trainer not found.
        </p>
        <Link
          to="/trainers"
          className="font-barlow-condensed font-bold text-[14px] uppercase tracking-[0.06em]"
          style={{ color: 'var(--blue-light)', textDecoration: 'none' }}
        >
          ← Back to Trainers
        </Link>
      </div>
    )
  }

  const bioBlocks: any[] = trainer.bio ?? []

  return (
    <div className="max-w-[1100px] mx-auto px-12 pt-[60px] pb-[100px] max-[768px]:px-5 max-[768px]:pt-8 max-[768px]:pb-[60px]">
      {/* Back link */}
      <Link
        to="/trainers"
        className="inline-flex items-center gap-2 font-barlow-condensed font-semibold text-[14px] uppercase tracking-[0.05em] mb-10 transition-opacity duration-200 hover:opacity-70"
        style={{ color: 'var(--muted)', textDecoration: 'none' }}
      >
        <ArrowLeft size={15} strokeWidth={2} />
        Back to Trainers
      </Link>

      {/* Two-column layout */}
      <div className="flex gap-12 items-start max-[768px]:flex-col max-[768px]:gap-8">

        {/* Left: Photo */}
        <div className="flex-shrink-0 w-[340px] max-[768px]:w-full">
          <div
            className="rounded-2xl overflow-hidden"
            style={{ aspectRatio: '3/4', width: '100%', border: '1px solid var(--border)' }}
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
                  <User size={56} strokeWidth={1.5} style={{ opacity: 0.3 }} />
                  <span className="text-[11px] font-mono" style={{ opacity: 0.5 }}>
                    trainer photo
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Info */}
        <div className="flex-1 min-w-0">
          {/* Badge */}
          <span
            className="inline-block font-barlow-condensed font-semibold text-[12px] uppercase tracking-[0.08em] px-3 py-1 rounded-full mb-4"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--blue-light)',
            }}
          >
            {trainer.isNew ? 'New' : 'Verified'}
          </span>

          {/* Name */}
          <h1
            className="font-barlow-condensed font-black italic uppercase leading-none mb-3"
            style={{ fontSize: 'clamp(36px, 5vw, 56px)', color: 'var(--text)' }}
          >
            {trainer.name}
          </h1>

          {/* Location */}
          <div
            className="flex items-center gap-1.5 text-[14px] mb-2"
            style={{ color: 'var(--muted)' }}
          >
            <MapPin size={14} strokeWidth={2} />
            {trainer.location}
          </div>

          {/* Spec */}
          {trainer.spec && (
            <p
              className="text-[15px] mb-5"
              style={{ color: 'var(--muted)' }}
            >
              {trainer.spec}
            </p>
          )}

          {/* Specialties tags */}
          {trainer.specialties && trainer.specialties.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-7">
              {trainer.specialties.map((tag) => (
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
          )}

          {/* Bio */}
          {bioBlocks.length > 0 && (
            <div className="mb-7">
              {bioBlocks.map((block: any, i: number) => {
                if (block._type !== 'block') return null
                const text = (block.children ?? [])
                  .map((child: any) => child.text ?? '')
                  .join('')
                return (
                  <p
                    key={i}
                    className="text-[15px] leading-relaxed mb-3 last:mb-0"
                    style={{ color: 'var(--text)' }}
                  >
                    {text}
                  </p>
                )
              })}
            </div>
          )}

          {/* Certifications */}
          {trainer.certifications && trainer.certifications.length > 0 && (
            <div className="mb-8">
              <h3
                className="font-barlow-condensed font-bold text-[13px] uppercase tracking-[0.08em] mb-3"
                style={{ color: 'var(--muted)' }}
              >
                Certifications
              </h3>
              <ul className="flex flex-col gap-2">
                {trainer.certifications.map((cert, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-[14px]"
                    style={{ color: 'var(--text)' }}
                  >
                    <Award size={14} strokeWidth={2} style={{ color: 'var(--blue-light)', flexShrink: 0 }} />
                    {cert}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Booking button */}
          {trainer.bookingUrl ? (
            <a
              href={trainer.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block font-barlow-condensed font-bold text-[15px] uppercase tracking-[0.06em] px-8 py-3 rounded-lg transition-all duration-200"
              style={{
                background: 'var(--blue)',
                color: '#fff',
                textDecoration: 'none',
                border: '1px solid var(--blue)',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLAnchorElement
                el.style.opacity = '0.85'
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLAnchorElement
                el.style.opacity = '1'
              }}
            >
              Book a Session
            </a>
          ) : (
            <Link
              to="/contact"
              state={{ trainer: trainer.name }}
              className="inline-block font-barlow-condensed font-bold text-[15px] uppercase tracking-[0.06em] px-8 py-3 rounded-lg transition-all duration-200"
              style={{
                background: 'var(--blue)',
                color: '#fff',
                textDecoration: 'none',
                border: '1px solid var(--blue)',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLAnchorElement
                el.style.opacity = '0.85'
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLAnchorElement
                el.style.opacity = '1'
              }}
            >
              Get in Touch
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
