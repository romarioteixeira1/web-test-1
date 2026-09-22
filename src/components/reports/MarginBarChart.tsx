type Row = { label: string; margin: number }

type Props = {
  rows: Row[]
  formatValue: (value: number) => string
  emptyMessage?: string
}

export function MarginBarChart({ rows, formatValue, emptyMessage = 'Sem dados para o período selecionado.' }: Props) {
  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm">{emptyMessage}</p>
  }

  const max = Math.max(1, ...rows.map((r) => Math.abs(r.margin)))

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-4 text-xs text-text">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-report-positive" />
          Margem positiva
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-report-negative" />
          Margem negativa
        </span>
      </div>
      {rows.map((row) => {
        const pct = Math.max((Math.abs(row.margin) / max) * 50, row.margin !== 0 ? 1.5 : 0)
        const positive = row.margin >= 0
        return (
          <div key={row.label} className="flex items-center gap-3" title={`${row.label}: ${formatValue(row.margin)}`}>
            <span className="w-28 shrink-0 truncate text-right text-sm text-text-strong">{row.label}</span>
            <div className="relative h-2 flex-1 rounded-full bg-surface">
              <div className="absolute top-0 left-1/2 h-2 w-px bg-border" />
              <div
                className={`absolute top-0 h-2 rounded-full ${positive ? 'bg-report-positive' : 'bg-report-negative'}`}
                style={
                  positive
                    ? { left: '50%', width: `${pct}%` }
                    : { right: '50%', width: `${pct}%` }
                }
              />
            </div>
            <span className="w-28 shrink-0 text-xs tabular-nums text-text">{formatValue(row.margin)}</span>
          </div>
        )
      })}
    </div>
  )
}
