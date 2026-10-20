/** EcoControl wordmark: moss "e" tile plus "EcoControl" text. `compact` drops the text size for the footer. */
export function BrandLogo({ compact }: { compact?: boolean }) {
  return (
    <span className={`brand-logo ${compact ? 'compact' : ''}`} role="img" aria-label="EcoControl">
      <span className="brand-mark" aria-hidden="true">
        e
      </span>
      <span className="brand-text" aria-hidden="true">
        Eco<span>Control</span>
      </span>
    </span>
  )
}
