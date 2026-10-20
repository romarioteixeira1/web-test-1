import { useState } from 'react'
import { seriesColors } from './seriesColors'

type Row = { period: string; label: string; buy: number; sell: number }

type Props = {
  rows: Row[]
  formatValue: (value: number) => string
  emptyMessage?: string
  buyLabel?: string
  sellLabel?: string
  buyColor?: string
  sellColor?: string
}

/** Paired columns per period; hovering a period dims the others and shows its values below. */
export function PeriodBarChart({
  rows,
  formatValue,
  emptyMessage = 'Sem dados para o período selecionado.',
  buyLabel = 'Compra',
  sellLabel = 'Venda',
  buyColor = seriesColors.dark,
  sellColor = seriesColors.light,
}: Props) {
  const [hover, setHover] = useState<string | null>(null)

  if (rows.length === 0) {
    return <div className="empty">{emptyMessage}</div>
  }

  const max = Math.max(1, ...rows.flatMap((r) => [r.buy, r.sell]))
  const active = rows.find((r) => r.period === hover)
  const height = (value: number) => `${Math.max((value / max) * 100, value > 0 ? 2 : 0)}%`

  return (
    <div className="flex flex-col gap-3">
      <div className="legend-inline">
        <span>
          <i style={{ background: buyColor }} />
          {buyLabel}
        </span>
        <span>
          <i style={{ background: sellColor }} />
          {sellLabel}
        </span>
      </div>
      <div className="pchart">
        <div className={`pchart-plot ${active ? 'hovering' : ''}`} onMouseLeave={() => setHover(null)}>
          {rows.map((row) => (
            <div
              key={row.period}
              className={`pchart-group ${hover === row.period ? 'on' : ''}`}
              onMouseEnter={() => setHover(row.period)}
              aria-label={`${row.label}: ${buyLabel} ${formatValue(row.buy)}, ${sellLabel} ${formatValue(row.sell)}`}
            >
              <span style={{ height: height(row.buy), background: buyColor }} />
              <span style={{ height: height(row.sell), background: sellColor }} />
            </div>
          ))}
        </div>
        <div className="pchart-labels">
          {rows.map((row) => (
            <span key={row.period}>{row.label}</span>
          ))}
        </div>
      </div>
      <div className={`tip ${active ? 'on' : ''}`}>
        {active
          ? `${active.label} · ${buyLabel.toLowerCase()} ${formatValue(active.buy)} · ${sellLabel.toLowerCase()} ${formatValue(active.sell)}`
          : 'Passe o mouse numa coluna para ver os valores.'}
      </div>
    </div>
  )
}
