import type {
  CashFlowReport,
  CustomerReportRow,
  MaterialReportRow,
  PeriodReportRow,
  ReportGranularity,
} from '../../shared/report'

async function request<T>(path: string): Promise<T> {
  const res = await fetch(path, { headers: { 'Content-Type': 'application/json' } })

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error ?? `Erro ${res.status}`)
  }

  return res.json() as Promise<T>
}

export type ReportFilters = { from?: string; to?: string }

function buildQuery(filters: ReportFilters, extra?: Record<string, string>) {
  const params = new URLSearchParams()
  if (filters.from) params.set('from', filters.from)
  if (filters.to) params.set('to', filters.to)
  if (extra) for (const [key, value] of Object.entries(extra)) params.set(key, value)
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export function getByMaterial(filters: ReportFilters) {
  return request<MaterialReportRow[]>(`/api/reports/by-material${buildQuery(filters)}`)
}

export function getByPeriod(filters: ReportFilters, granularity: ReportGranularity) {
  return request<PeriodReportRow[]>(`/api/reports/by-period${buildQuery(filters, { granularity })}`)
}

export function getByCustomer(filters: ReportFilters) {
  return request<CustomerReportRow[]>(`/api/reports/customers${buildQuery(filters)}`)
}

export function getCashFlow(filters: ReportFilters, granularity: ReportGranularity) {
  return request<CashFlowReport>(`/api/reports/cash-flow${buildQuery(filters, { granularity })}`)
}
