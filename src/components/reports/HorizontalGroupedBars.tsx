import { seriesColors } from './seriesColors'

type Row = { label: string; buy: number; sell: number }

type Props = {
  rows: Row[]
  formatValue: (value: number) => string
  buyLabel?: string
  sellLabel?: string
  emptyMessage?: string
}

function Bar({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const pct = max > 0 ? Math.max((value / max) * 100, value > 0 ? 2 : 0) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="h-2.5 flex-1 overflow-hidden rounded bg-bg">
        <div className="h-full rounded" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="mono w-28 shrink-0 text-right text-xs font-semibold text-ink-2">{label}</span>
    </div>
  )
}

export function HorizontalGroupedBars({
  rows,
  formatValue,
  buyLabel = 'Compra',
  sellLabel = 'Venda',
  emptyMessage = 'Sem dados para o período selecionado.',
}: Props) {
  if (rows.length === 0) {
    return <div className="empty">{emptyMessage}</div>
  }

  const max = Math.max(1, ...rows.flatMap((r) => [r.buy, r.sell]))

  return (
    <div className="flex flex-col gap-4">
      <div className="legend-inline">
        <span>
          <i style={{ background: seriesColors.dark }} />
          {buyLabel}
        </span>
        <span>
          <i style={{ background: seriesColors.light }} />
          {sellLabel}
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-col gap-1.5">
            <p className="truncate text-sm font-semibold text-ink">{row.label}</p>
            <Bar value={row.buy} max={max} color={seriesColors.dark} label={formatValue(row.buy)} />
            <Bar value={row.sell} max={max} color={seriesColors.light} label={formatValue(row.sell)} />
          </div>
        ))}
      </div>
    </div>
  )
}
