import { useEffect, useMemo, useState } from 'react'
import * as api from '../api/reports'
import { ChartLegend } from '../components/reports/ChartLegend'
import { HorizontalGroupedBars } from '../components/reports/HorizontalGroupedBars'
import { MarginBarChart } from '../components/reports/MarginBarChart'
import { PeriodBarChart } from '../components/reports/PeriodBarChart'
import type { CustomerReportRow, MaterialReportRow, PeriodReportRow, ReportGranularity } from '../../shared/report'

type Metric = 'weight' | 'amount'

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatWeight(value: number) {
  return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kg`
}

function formatPeriodLabel(period: string, granularity: ReportGranularity) {
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

function defaultFrom() {
  const d = new Date()
  d.setDate(d.getDate() - 89)
  return d.toISOString().slice(0, 10)
}

function defaultTo() {
  return new Date().toISOString().slice(0, 10)
}

export function ReportsPage() {
  const [from, setFrom] = useState(defaultFrom())
  const [to, setTo] = useState(defaultTo())
  const [granularity, setGranularity] = useState<ReportGranularity>('day')
  const [metric, setMetric] = useState<Metric>('amount')

  const [byMaterial, setByMaterial] = useState<MaterialReportRow[]>([])
  const [byPeriod, setByPeriod] = useState<PeriodReportRow[]>([])
  const [byCustomer, setByCustomer] = useState<CustomerReportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError(null)
    Promise.all([
      api.getByMaterial({ from, to }),
      api.getByPeriod({ from, to }, granularity),
      api.getByCustomer({ from, to }),
    ])
      .then(([materialData, periodData, customerData]) => {
        if (cancelled) return
        setByMaterial(materialData)
        setByPeriod(periodData)
        setByCustomer(customerData)
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Falha ao carregar relatórios')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [from, to, granularity])

  const formatValue = metric === 'weight' ? formatWeight : formatCurrency

  const periodRows = useMemo(
    () =>
      byPeriod.map((row) => ({
        period: row.period,
        label: formatPeriodLabel(row.period, granularity),
        buy: metric === 'weight' ? row.buy_weight : row.buy_total,
        sell: metric === 'weight' ? row.sell_weight : row.sell_total,
      })),
    [byPeriod, granularity, metric],
  )

  const materialRows = useMemo(
    () =>
      byMaterial.map((row) => ({
        label: row.material_name,
        buy: metric === 'weight' ? row.buy_weight : row.buy_total,
        sell: metric === 'weight' ? row.sell_weight : row.sell_total,
      })),
    [byMaterial, metric],
  )

  const marginRows = useMemo(
    () =>
      byMaterial
        .filter((row) => row.buy_weight > 0 || row.sell_weight > 0)
        .map((row) => ({
          label: row.material_name,
          margin: row.sell_total - row.buy_total,
        })),
    [byMaterial],
  )

  const customerRows = useMemo(
    () =>
      byCustomer.map((row) => ({
        label: row.customer_name,
        buy: metric === 'weight' ? row.buy_weight : row.buy_total,
        sell: metric === 'weight' ? row.sell_weight : row.sell_total,
      })),
    [byCustomer, metric],
  )

  const totals = useMemo(
    () =>
      byMaterial.reduce(
        (acc, row) => ({
          buyWeight: acc.buyWeight + row.buy_weight,
          buyTotal: acc.buyTotal + row.buy_total,
          sellWeight: acc.sellWeight + row.sell_weight,
          sellTotal: acc.sellTotal + row.sell_total,
        }),
        { buyWeight: 0, buyTotal: 0, sellWeight: 0, sellTotal: 0 },
      ),
    [byMaterial],
  )

  const fieldClass =
    'rounded-md border border-border bg-bg px-3 py-2 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20'

  return (
    <section className="flex w-full flex-1 flex-col gap-8 px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h2 className="text-2xl font-medium text-text-strong">Relatórios</h2>
        <p className="text-sm">Volume, período, ranking de clientes e margem de material</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs">
          De
          <input type="date" className={fieldClass} value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          Até
          <input type="date" className={fieldClass} value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          Agrupar por
          <select
            className={fieldClass}
            value={granularity}
            onChange={(e) => setGranularity(e.target.value as ReportGranularity)}
          >
            <option value="day">Dia</option>
            <option value="week">Semana</option>
            <option value="month">Mês</option>
          </select>
        </label>
        <div className="ml-auto flex rounded-md border border-border p-1 text-sm">
          <button
            type="button"
            onClick={() => setMetric('amount')}
            className={`rounded px-3 py-1.5 transition-colors ${metric === 'amount' ? 'bg-accent text-white' : 'text-text hover:text-text-strong'}`}
          >
            Valor (R$)
          </button>
          <button
            type="button"
            onClick={() => setMetric('weight')}
            className={`rounded px-3 py-1.5 transition-colors ${metric === 'weight' ? 'bg-accent text-white' : 'text-text hover:text-text-strong'}`}
          >
            Peso
          </button>
        </div>
      </div>

      {loading && <p className="text-sm">Carregando...</p>}
      {loadError && <p className="text-sm text-red-500">{loadError}</p>}

      {!loading && !loadError && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="rounded-lg border border-border bg-surface p-5">
              <p className="text-sm">Comprado (peso)</p>
              <p className="mt-1 text-2xl font-semibold text-report-compra">{formatWeight(totals.buyWeight)}</p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-5">
              <p className="text-sm">Vendido (peso)</p>
              <p className="mt-1 text-2xl font-semibold text-report-venda">{formatWeight(totals.sellWeight)}</p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-5">
              <p className="text-sm">Valor comprado</p>
              <p className="mt-1 text-2xl font-semibold text-report-compra">{formatCurrency(totals.buyTotal)}</p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-5">
              <p className="text-sm">Margem total</p>
              <p
                className={`mt-1 text-2xl font-semibold ${totals.sellTotal - totals.buyTotal >= 0 ? 'text-report-positive' : 'text-report-negative'}`}
              >
                {formatCurrency(totals.sellTotal - totals.buyTotal)}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-medium text-text-strong">Volume por período</h3>
            {metric === 'weight' && (
              <p className="-mt-2 text-xs text-text">Peso somado entre materiais, independente da unidade.</p>
            )}
            <PeriodBarChart rows={periodRows} formatValue={formatValue} />
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-medium text-text-strong">Volume por material</h3>
              <HorizontalGroupedBars rows={materialRows} formatValue={formatValue} />
            </div>

            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-medium text-text-strong">Ranking de clientes por volume</h3>
              <HorizontalGroupedBars rows={customerRows} formatValue={formatValue} />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-medium text-text-strong">Margem por material (venda − compra)</h3>
            <MarginBarChart rows={marginRows} formatValue={formatCurrency} />
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-medium text-text-strong">Detalhamento por material</h3>
            {byMaterial.length === 0 ? (
              <p className="py-6 text-center text-sm">Nenhuma transação no período selecionado.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="bg-surface text-text-strong">
                    <tr>
                      <th className="px-4 py-3 font-medium">Material</th>
                      <th className="px-4 py-3 font-medium">Peso comprado</th>
                      <th className="px-4 py-3 font-medium">Preço médio compra</th>
                      <th className="px-4 py-3 font-medium">Peso vendido</th>
                      <th className="px-4 py-3 font-medium">Preço médio venda</th>
                      <th className="px-4 py-3 font-medium">Margem/unid.</th>
                      <th className="px-4 py-3 font-medium">Margem total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byMaterial.map((row) => {
                      const avgBuy = row.buy_weight > 0 ? row.buy_total / row.buy_weight : null
                      const avgSell = row.sell_weight > 0 ? row.sell_total / row.sell_weight : null
                      const marginUnit = avgBuy != null && avgSell != null ? avgSell - avgBuy : null
                      const marginTotal = row.sell_total - row.buy_total
                      return (
                        <tr key={row.material_id} className="border-t border-border transition-colors hover:bg-surface">
                          <td className="px-4 py-3 text-text-strong">{row.material_name}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {row.buy_weight.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} {row.unit}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {avgBuy != null ? `${formatCurrency(avgBuy)}/${row.unit}` : '—'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {row.sell_weight.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} {row.unit}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {avgSell != null ? `${formatCurrency(avgSell)}/${row.unit}` : '—'}
                          </td>
                          <td
                            className={`px-4 py-3 whitespace-nowrap font-medium ${marginUnit == null ? '' : marginUnit >= 0 ? 'text-report-positive' : 'text-report-negative'}`}
                          >
                            {marginUnit != null ? `${formatCurrency(marginUnit)}/${row.unit}` : '—'}
                          </td>
                          <td
                            className={`px-4 py-3 whitespace-nowrap font-medium ${marginTotal >= 0 ? 'text-report-positive' : 'text-report-negative'}`}
                          >
                            {formatCurrency(marginTotal)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-medium text-text-strong">Detalhamento por cliente</h3>
            <ChartLegend
              items={[
                { label: 'Compra', className: 'bg-report-compra' },
                { label: 'Venda', className: 'bg-report-venda' },
              ]}
            />
            {byCustomer.length === 0 ? (
              <p className="py-6 text-center text-sm">Nenhuma transação no período selecionado.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[820px] text-left text-sm">
                  <thead className="bg-surface text-text-strong">
                    <tr>
                      <th className="px-4 py-3 font-medium">Cliente</th>
                      <th className="px-4 py-3 font-medium">Peso comprado</th>
                      <th className="px-4 py-3 font-medium">Valor comprado</th>
                      <th className="px-4 py-3 font-medium">Peso vendido</th>
                      <th className="px-4 py-3 font-medium">Valor vendido</th>
                      <th className="px-4 py-3 font-medium">Peso total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byCustomer.map((row) => (
                      <tr key={row.customer_id} className="border-t border-border transition-colors hover:bg-surface">
                        <td className="px-4 py-3 text-text-strong">{row.customer_name}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{formatWeight(row.buy_weight)}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{formatCurrency(row.buy_total)}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{formatWeight(row.sell_weight)}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{formatCurrency(row.sell_total)}</td>
                        <td className="px-4 py-3 font-medium whitespace-nowrap text-text-strong">
                          {formatWeight(row.buy_weight + row.sell_weight)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  )
}
