export type ReportGranularity = 'day' | 'week' | 'month'

export interface MaterialReportRow {
  material_id: number
  material_name: string
  unit: string
  buy_weight: number
  buy_total: number
  sell_weight: number
  sell_total: number
}

export interface PeriodReportRow {
  period: string
  buy_weight: number
  buy_total: number
  sell_weight: number
  sell_total: number
}

export interface CustomerReportRow {
  customer_id: number
  customer_name: string
  buy_weight: number
  buy_total: number
  sell_weight: number
  sell_total: number
}

export interface CashFlowRow {
  period: string
  entradas: number
  saidas: number
}

export interface CashFlowReport {
  opening_balance: number
  rows: CashFlowRow[]
}
