import type { ReactNode } from 'react'

type IconProps = {
  className?: string
  size?: number
}

function Svg({ className, size = 18, strokeWidth = 1.8, children }: IconProps & { strokeWidth?: number; children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export function IconHome(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M10 21v-6h4v6" />
    </Svg>
  )
}

export function IconUsers(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Svg>
  )
}

export function IconBox(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M21 8l-9-5-9 5 9 5 9-5z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </Svg>
  )
}

export function IconCard(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </Svg>
  )
}

export function IconTruck(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 6.5h10v9H3v-9ZM13 10.5h4.5l3 3v2H13v-5Z" />
      <circle cx="7" cy="17.5" r="1.8" />
      <circle cx="17" cy="17.5" r="1.8" />
    </Svg>
  )
}

export function IconReceipt(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 3.5h12v17l-2.25-1.5L13.5 20.5l-1.5-1.5-1.5 1.5-2.25-1.5L6 20.5v-17Z" />
      <path d="M9 8h6M9 11.5h6M9 15h3.5" />
    </Svg>
  )
}

export function IconChart(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 20V10M11 20V4M18 20v-7" />
      <path d="M3.5 20.5h17" />
    </Svg>
  )
}

export function IconWallet(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-9Z" />
      <path d="M4 10h16" />
      <circle cx="16.5" cy="14" r="1.1" fill="currentColor" />
    </Svg>
  )
}

export function IconTrend(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M14 7h7v7" />
    </Svg>
  )
}

export function IconSearch(props: IconProps) {
  return (
    <Svg strokeWidth={2} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </Svg>
  )
}

export function IconChevron(props: IconProps) {
  return (
    <Svg strokeWidth={2} {...props}>
      <path d="m9 6 6 6-6 6" />
    </Svg>
  )
}

export function IconPlus(props: IconProps) {
  return (
    <Svg strokeWidth={2.6} {...props}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  )
}

export function IconClose(props: IconProps) {
  return (
    <Svg strokeWidth={2} {...props}>
      <path d="M18 6 6 18M6 6l12 12" />
    </Svg>
  )
}

export function IconEdit(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </Svg>
  )
}

export function IconTrash(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
    </Svg>
  )
}

export function IconCheck(props: IconProps) {
  return (
    <Svg strokeWidth={2.4} {...props}>
      <path d="M20 6 9 17l-5-5" />
    </Svg>
  )
}

export function IconPrinter(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 9V3h12v6" />
      <rect x="3" y="9" width="18" height="8" rx="2" />
      <path d="M6 14h12v7H6z" />
    </Svg>
  )
}

export function IconHistory(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l3 2" />
    </Svg>
  )
}
