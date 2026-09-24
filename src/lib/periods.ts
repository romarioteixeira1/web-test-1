import type { ReportGranularity } from '../../shared/report'

/** Short axis label for a period key returned by the reports API. */
export function formatPeriodLabel(period: string, granularity: ReportGranularity) {
  if (granularity === 'day') {
    const [, month, day] = period.split('-')
    return day && month ? `${day}/${month}` : period
  }
  if (granularity === 'month') {
    const [year, month] = period.split('-')
    return month && year ? `${month}/${year.slice(2)}` : period
  }
  const [year, week] = period.split('-W')
  return week ? `S${Number(week)}/${year.slice(2)}` : period
}
