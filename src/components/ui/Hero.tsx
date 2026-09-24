import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { IconPlus } from '../layout/icons'

export type HeroStat = {
  label: string
  value: ReactNode
  /** Bar width, 0–100. */
  share?: number
  negative?: boolean
}

type Props = {
  chip?: string
  back?: { to: string; label: string }
  title: ReactNode
  subtitle?: ReactNode
  children?: ReactNode
  stats?: HeroStat[]
  /** Rendered to the right of the text instead of stats (e.g. quick actions). */
  aside?: ReactNode
}

export function Hero({ chip, back, title, subtitle, children, stats, aside }: Props) {
  return (
    <section className="hero print:hidden">
      <div className="hero-ring r1" aria-hidden="true" />
      <div className="hero-ring r2" aria-hidden="true" />
      <div className="hero-logo-wrap">
        <img src="/eco-icon.png" alt="" className="hero-logo" />
      </div>
      <div className="hero-text">
        {back && (
          <Link to={back.to} className="hero-back">
            ← {back.label}
          </Link>
        )}
        {chip && <span className="hero-chip">{chip}</span>}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
        {children}
      </div>
      {stats && (
        <div className="hero-stats">
          {stats.map((stat) => (
            <div key={stat.label} className="hero-stat">
              <span className="l">{stat.label}</span>
              <span className={`v mono ${stat.negative ? 'neg' : ''}`}>{stat.value}</span>
              <span className="track">
                <span className="fill" style={{ width: `${stat.share ?? 100}%` }} />
              </span>
            </div>
          ))}
        </div>
      )}
      {aside}
    </section>
  )
}

export function HeroButton({
  label,
  onClick,
  disabled,
  title,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  title?: string
}) {
  return (
    <div>
      <button type="button" className="cta" onClick={onClick} disabled={disabled} title={title}>
        <IconPlus size={16} />
        {label}
      </button>
    </div>
  )
}
