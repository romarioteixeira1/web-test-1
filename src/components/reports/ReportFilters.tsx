import type { ReactNode } from 'react'
import type { ReportGranularity } from '../../../shared/report'
import { Segmented } from '../ui/ListCard'

const granularityOptions = [
  ['day', 'Dia'],
  ['week', 'Semana'],
  ['month', 'Mês'],
] as const

type Props = {
  from: string
  to: string
  granularity: ReportGranularity
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
  onGranularityChange: (value: ReportGranularity) => void
  children?: ReactNode
}

export function ReportFilters({ from, to, granularity, onFromChange, onToChange, onGranularityChange, children }: Props) {
  return (
    <section className="card card-body flex flex-wrap items-end gap-4 print:hidden" aria-label="Filtros do relatório">
      <div className="field w-40">
        <label className="lbl" htmlFor="report-from">
          De
        </label>
        <input id="report-from" type="date" className="inp" value={from} onChange={(e) => onFromChange(e.target.value)} />
      </div>
      <div className="field w-40">
        <label className="lbl" htmlFor="report-to">
          Até
        </label>
        <input id="report-to" type="date" className="inp" value={to} onChange={(e) => onToChange(e.target.value)} />
      </div>
      <div className="field">
        <span className="lbl">Agrupar por</span>
        <Segmented label="Agrupar por" value={granularity} options={granularityOptions} onChange={onGranularityChange} />
      </div>
      {children}
    </section>
  )
}

export function ChartCard({ title, subtitle, children, className = '' }: { title: string; subtitle?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`card chart ${className}`}>
      <div className="chart-head">
        <div>
          <h2>{title}</h2>
          {subtitle && <span>{subtitle}</span>}
        </div>
      </div>
      {children}
    </section>
  )
}
