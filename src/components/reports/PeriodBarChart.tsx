import { ChartLegend } from './ChartLegend'

type Row = { period: string; label: string; buy: number; sell: number }

type Props = {
  rows: Row[]
  formatValue: (value: number) => string
  emptyMessage?: string
}

const PLOT_HEIGHT = 180

export function PeriodBarChart({ rows, formatValue, emptyMessage = 'Sem dados para o período selecionado.' }: Props) {
  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm">{emptyMessage}</p>
  }

  const max = Math.max(1, ...rows.flatMap((r) => [r.buy, r.sell]))

  return (
    <div className="flex flex-col gap-4">
      <ChartLegend
        items={[
          { label: 'Compra', className: 'bg-report-compra' },
          { label: 'Venda', className: 'bg-report-venda' },
        ]}
      />
      <div className="overflow-x-auto">
        <div className="flex items-end gap-4 border-b border-border pb-2" style={{ height: PLOT_HEIGHT + 16 }}>
          {rows.map((row) => (
            <div key={row.period} className="flex shrink-0 items-end gap-1" style={{ height: PLOT_HEIGHT }}>
              <div
                title={`${row.label} · Compra: ${formatValue(row.buy)}`}
                className="w-3 rounded-t-sm bg-report-compra transition-all"
                style={{ height: `${Math.max((row.buy / max) * 100, row.buy > 0 ? 2 : 0)}%` }}
              />
              <div
                title={`${row.label} · Venda: ${formatValue(row.sell)}`}
                className="w-3 rounded-t-sm bg-report-venda transition-all"
                style={{ height: `${Math.max((row.sell / max) * 100, row.sell > 0 ? 2 : 0)}%` }}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-4">
          {rows.map((row) => (
            <span key={row.period} className="w-7 shrink-0 text-center text-[10px] whitespace-nowrap text-text">
              {row.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
