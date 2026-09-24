import { seriesColors } from './seriesColors'

type Row = { label: string; margin: number }

type Props = {
  rows: Row[]
  formatValue: (value: number) => string
  emptyMessage?: string
}

/** Diverging bars around a zero line: green to the right for profit, red to the left for loss. */
export function MarginBarChart({ rows, formatValue, emptyMessage = 'Sem dados para o período selecionado.' }: Props) {
  if (rows.length === 0) {
    return <div className="empty">{emptyMessage}</div>
  }

  const max = Math.max(1, ...rows.map((r) => Math.abs(r.margin)))

  return (
    <div className="flex flex-col gap-3">
      <div className="legend-inline">
        <span>
          <i style={{ background: seriesColors.bar }} />
          Margem positiva
        </span>
        <span>
          <i style={{ background: seriesColors.negative }} />
          Margem negativa
        </span>
      </div>
      {rows.map((row) => {
        const pct = Math.max((Math.abs(row.margin) / max) * 50, row.margin !== 0 ? 1.5 : 0)
        const positive = row.margin >= 0
        return (
          <div key={row.label} className="flex items-center gap-3" title={`${row.label}: ${formatValue(row.margin)}`}>
            <span className="w-28 shrink-0 truncate text-right text-sm font-medium text-ink-2">{row.label}</span>
            <div className="relative h-3 flex-1 rounded bg-bg">
              <div className="absolute top-0 left-1/2 h-3 w-px bg-border" />
              <div
                className="absolute top-0 h-3 rounded"
                style={{
                  background: positive ? seriesColors.bar : seriesColors.negative,
                  ...(positive ? { left: '50%', width: `${pct}%` } : { right: '50%', width: `${pct}%` }),
                }}
              />
            </div>
            <span className={`mono w-28 shrink-0 text-xs ${positive ? 'pos' : 'neg'}`}>{formatValue(row.margin)}</span>
          </div>
        )
      })}
    </div>
  )
}
