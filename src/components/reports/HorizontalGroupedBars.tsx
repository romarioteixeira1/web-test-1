import { ChartLegend } from './ChartLegend'

type Row = { label: string; buy: number; sell: number }

type Props = {
  rows: Row[]
  formatValue: (value: number) => string
  buyLabel?: string
  sellLabel?: string
  emptyMessage?: string
}

function Bar({
  value,
  max,
  className,
  label,
}: {
  value: number
  max: number
  className: string
  label: string
}) {
  const pct = max > 0 ? Math.max((value / max) * 100, value > 0 ? 2 : 0) : 0
  return (
    <div className="group flex items-center gap-2" title={label}>
      <div className="h-2 flex-1 rounded-full bg-surface">
        <div
          className={`h-2 rounded-full transition-all ${className}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-24 shrink-0 text-right text-xs tabular-nums text-text">{label}</span>
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
    return <p className="py-8 text-center text-sm">{emptyMessage}</p>
  }

  const max = Math.max(1, ...rows.flatMap((r) => [r.buy, r.sell]))

  return (
    <div className="flex flex-col gap-4">
      <ChartLegend
        items={[
          { label: buyLabel, className: 'bg-report-compra' },
          { label: sellLabel, className: 'bg-report-venda' },
        ]}
      />
      <div className="flex flex-col gap-3">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-col gap-1.5">
            <p className="truncate text-sm font-medium text-text-strong">{row.label}</p>
            <Bar value={row.buy} max={max} className="bg-report-compra" label={formatValue(row.buy)} />
            <Bar value={row.sell} max={max} className="bg-report-venda" label={formatValue(row.sell)} />
          </div>
        ))}
      </div>
    </div>
  )
}
