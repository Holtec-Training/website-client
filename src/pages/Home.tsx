import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

const HERO_IMG    = '/hero_image.jpg'
const CLIENT_IMG  = '/client_card.jpg'
const TRAINER_IMG = '/trainer_card.jpg'

export default function Home() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="home-hero">
        <div className="home-hero__text">
          <span className="home-eyebrow">Personal Training Agency</span>
          <h1 className="home-hero__h1">
            Find <span>Your</span> Perfect<br />Trainer.
          </h1>
          <p className="home-hero__sub">
            Holtec connects ambitious clients with talented new personal trainers
            — fresh energy, real results, and the right fit for you.
          </p>
          <div className="home-btns">
            <Link to="/trainers" className="btn-primary">Browse Trainers</Link>
            <Link to="/contact" className="btn-secondary">Connect</Link>
          </div>
        </div>
        <div className="home-hero__img-col">
          <div className="home-hero__img-wrap">
            <img src={HERO_IMG} alt="Personal trainer" />
          </div>
        </div>
      </section>

      {/* ── Gap ── */}
      <div className="section-gap" />

      {/* ── About ── */}
      <section className="home-about">
        <div>
          <span className="home-eyebrow">About Holtec</span>
          <h2 className="home-section-h2">
            Built for <span>real people,</span> real goals.
          </h2>
        </div>
        <div>
          <p className="home-body-text">
            Holtec was built to solve a simple problem: finding a personal trainer
            is harder than it should be. Too many options, not enough context, and
            no easy way to know if someone is the right fit before you commit.
          </p>
          <p className="home-body-text" style={{ marginBottom: 0 }}>
            We connect clients with newly qualified PTs who are hungry to prove
            themselves — trainers with fresh knowledge, genuine enthusiasm, and a
            real interest in helping you succeed.
          </p>
        </div>
      </section>

      {/* ── Stats ── */}
      <div className="home-stats-wrap">
        <div className="home-stats-strip">
          {[
            { number: '10+',  label: 'Free Programs' },
            { number: '100%', label: 'Qualified & Vetted' },
            { number: 'Free', label: 'Initial Match' },
            { number: 'All',  label: 'Goals & Levels' },
          ].map((stat, i, arr) => (
            <div
              key={stat.label}
              className="home-stat"
              style={{ borderRight: i < arr.length - 1 ? '1px solid rgba(0,0,0,0.07)' : 'none' }}
            >
              <span className="home-stat__num">{stat.number}</span>
              <span className="home-stat__lbl">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── How It Works ── */}
      <section className="home-hiw">
        <div className="home-hiw__header">
          <span className="home-eyebrow">The Process</span>
          <h2 className="home-section-h2">
            Three steps to <span>your</span> perfect match
          </h2>
        </div>
        <div className="home-hiw__steps">
          <div className="home-hiw__connector" />
          {[
            { n: '1', h: 'Browse', p: 'Explore profiles of qualified PTs. Filter by goal, location, or training style.' },
            { n: '2', h: 'Match',  p: 'We connect you with the right trainer — no cost, no commitment required.' },
            { n: '3', h: 'Train',  p: 'Book your first session and start working toward your goals straight away.' },
          ].map((step) => (
            <div key={step.n} className="home-hiw__step">
              <div className="home-hiw__step-num">{step.n}</div>
              <h3 className="home-hiw__step-h">{step.h}</h3>
              <p className="home-hiw__step-p">{step.p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Gap ── */}
      <div className="section-gap" />

      {/* ── Path cards ── */}
      <div className="home-paths">
        <ThumbCard
          to="/trainers"
          img={CLIENT_IMG}
          eyebrow="For Clients"
          title={<>I'm Looking for a <span>Trainer</span></>}
          description="Browse our roster of passionate, newly qualified PTs — vetted, energetic, and ready to help you reach your goals."
          linkLabel="View Trainers"
        />
        <ThumbCard
          to="/contact"
          img={TRAINER_IMG}
          eyebrow="For Trainers"
          title={<>I'm a Personal <span>Trainer</span></>}
          description="New to the industry? Holtec helps emerging PTs get in front of the right people — fast and free."
          linkLabel="Get in Touch"
        />
      </div>

      {/* ── Gap ── */}
      <div className="section-gap" />

      {/* ── CTA ── */}
      <section className="home-cta">
        <h2 className="home-cta__h2">
          Ready to get <span>started?</span>
        </h2>
        <p className="home-cta__sub">
          Whether you're chasing a goal or building a career, Holtec is the
          connection you've been looking for.
        </p>
        <div className="home-btns home-btns--center">
          <Link to="/trainers" className="btn-primary">Browse Trainers</Link>
          <Link to="/contact" className="btn-secondary">Connect with Us</Link>
        </div>
      </section>
    </>
  )
}

interface ThumbCardProps {
  to: string
  img: string
  eyebrow: string
  title: React.ReactNode
  description: string
  linkLabel: string
}

function ThumbCard({ to, img, eyebrow, title, description, linkLabel }: ThumbCardProps) {
  return (
    <Link to={to} className="thumb-card">
      <div className="thumb-card__img">
        <img src={img} alt="" />
      </div>
      <div className="thumb-card__body">
        <span className="home-eyebrow">{eyebrow}</span>
        <h3 className="thumb-card__h3">{title}</h3>
        <p className="thumb-card__p">{description}</p>
        <span className="thumb-card__link">
          {linkLabel}
          <ArrowRight size={14} strokeWidth={2.5} />
        </span>
      </div>
    </Link>
  )
}
