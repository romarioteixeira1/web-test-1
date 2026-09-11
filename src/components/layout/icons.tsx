type IconProps = {
  className?: string
}

export function IconDashboard({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13" y="3" width="8" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13" y="10" width="8" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

export function IconUsers({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="9" cy="8" r="3.25" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M3 20c0-3.31 2.69-6 6-6s6 2.69 6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M15.5 6.5c1.52.34 2.65 1.7 2.65 3.32 0 1.62-1.13 2.98-2.65 3.32M18 20c0-2.4-1.34-4.49-3.31-5.56"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function IconMenu({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 6h16M4 12h16M4 18h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function IconClose({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function IconSearch({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
