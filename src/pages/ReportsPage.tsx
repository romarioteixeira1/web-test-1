import { useMemo, useState } from 'react'
import * as api from '../api/reports'
import { useLoader } from '../app/hooks'
import { HorizontalGroupedBars } from '../components/reports/HorizontalGroupedBars'
import { MarginBarChart } from '../components/reports/MarginBarChart'
import { PeriodBarChart } from '../components/reports/PeriodBarChart'
import { ChartCard, ReportFilters } from '../components/reports/ReportFilters'
import { Hero } from '../components/ui/Hero'
import { EmptyState, ErrorBox, ListCard, Loading, Segmented } from '../components/ui/ListCard'
import type { ReportGranularity } from '../../shared/report'
import { brl, daysAgoIso, decimal, share, todayIso, weight } from '../lib/format'
import { formatPeriodLabel } from '../lib/periods'

type Metric = 'amount' | 'weight'

const metricOptions = [
  ['amount', 'Valor (R$)'],
  ['weight', 'Peso'],
] as const

export function ReportsPage() {
  const [from, setFrom] = useState(daysAgoIso(89))
  const [to, setTo] = useState(todayIso())
  const [granularity, setGranularity] = useState<ReportGranularity>('day')
  const [metric, setMetric] = useState<Metric>('amount')

  const { data, loading, error, reload } = useLoader(
    () =>
      Promise.all([
        api.getByMaterial({ from, to }),
        api.getByPeriod({ from, to }, granularity),
        api.getByCustomer({ from, to }),
      ]),
    [from, to, granularity],
    'Falha ao carregar relatórios',
  )
  const [byMaterial, byPeriod, byCustomer] = data ?? [[], [], []]

  const formatValue = metric === 'weight' ? (v: number) => weight(v) : brl
  const pick = (row: { buy_weight: number; buy_total: number; sell_weight: number; sell_total: number }) =>
    metric === 'weight' ? { buy: row.buy_weight, sell: row.sell_weight } : { buy: row.buy_total, sell: row.sell_total }

  const periodRows = byPeriod.map((row) => ({
    period: row.period,
    label: formatPeriodLabel(row.period, granularity),
    ...pick(row),
  }))
  const materialRows = byMaterial.map((row) => ({ label: row.material_name, ...pick(row) }))
  const customerRows = byCustomer.map((row) => ({ label: row.customer_name, ...pick(row) }))
  const marginRows = byMaterial
    .filter((row) => row.buy_weight > 0 || row.sell_weight > 0)
    .map((row) => ({ label: row.material_name, margin: row.sell_total - row.buy_total }))

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
  const margin = totals.sellTotal - totals.buyTotal
  const volume = totals.buyTotal + totals.sellTotal

  return (
    <div className="page">
      <Hero
        chip="ECOCONTROL · ANÁLISES"
        title="Relatórios"
        subtitle="Volume por período, ranking de clientes e margem por material."
        stats={[
          {
            label: `Comprado · ${weight(totals.buyWeight)}`,
            value: brl(totals.buyTotal),
            share: share(totals.buyTotal, volume),
          },
          {
            label: `Vendido · ${weight(totals.sellWeight)}`,
            value: brl(totals.sellTotal),
            share: share(totals.sellTotal, volume),
          },
          { label: 'Margem no período', value: brl(margin), share: 60, negative: margin < 0 },
        ]}
      />

      <ReportFilters
        from={from}
        to={to}
        granularity={granularity}
        onFromChange={setFrom}
        onToChange={setTo}
        onGranularityChange={setGranularity}
      >
        <div className="field sm:ml-auto">
          <span className="lbl">Mostrar</span>
          <Segmented label="Métrica" value={metric} options={metricOptions} onChange={setMetric} />
        </div>
      </ReportFilters>

      {error && <ErrorBox message={error} onRetry={() => reload()} />}
      {loading && !data && <Loading />}

      {data && !error && (
        <>
          <ChartCard
            title="Volume por período"
            subtitle={metric === 'weight' ? 'Peso somado entre materiais, independente da unidade' : 'Valor comprado e vendido'}
          >
            <PeriodBarChart rows={periodRows} formatValue={formatValue} />
          </ChartCard>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <ChartCard title="Volume por material">
              <HorizontalGroupedBars rows={materialRows} formatValue={formatValue} />
            </ChartCard>
            <ChartCard title="Ranking de clientes por volume">
              <HorizontalGroupedBars rows={customerRows} formatValue={formatValue} />
            </ChartCard>
          </div>

          <ChartCard title="Margem por material" subtitle="Valor vendido menos valor comprado no período">
            <MarginBarChart rows={marginRows} formatValue={brl} />
          </ChartCard>

          <ListCard title="Detalhamento por material" count={byMaterial.length} className="list-auto">
            <table>
              <colgroup>
                <col style={{ width: '22%' }} />
                <col span={6} style={{ width: '13%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Material</th>
                  <th className="right">Peso comprado</th>
                  <th className="right">Preço médio compra</th>
                  <th className="right">Peso vendido</th>
                  <th className="right">Preço médio venda</th>
                  <th className="right">Margem / unid.</th>
                  <th className="right">Margem total</th>
                </tr>
              </thead>
              <tbody>
                {byMaterial.map((row) => {
                  const avgBuy = row.buy_weight > 0 ? row.buy_total / row.buy_weight : null
                  const avgSell = row.sell_weight > 0 ? row.sell_total / row.sell_weight : null
                  const marginUnit = avgBuy != null && avgSell != null ? avgSell - avgBuy : null
                  const marginTotal = row.sell_total - row.buy_total
                  return (
                    <tr key={row.material_id}>
                      <td className="font-semibold">{row.material_name}</td>
                      <td className="mono right">
                        {decimal(row.buy_weight, 1)} {row.unit}
                      </td>
                      <td className="mono right">{avgBuy != null ? brl(avgBuy) : '—'}</td>
                      <td className="mono right">
                        {decimal(row.sell_weight, 1)} {row.unit}
                      </td>
                      <td className="mono right">{avgSell != null ? brl(avgSell) : '—'}</td>
                      <td className={`mono right ${marginUnit == null ? '' : marginUnit >= 0 ? 'pos' : 'neg'}`}>
                        {marginUnit != null ? brl(marginUnit) : '—'}
                      </td>
                      <td className={`mono right ${marginTotal >= 0 ? 'pos' : 'neg'}`}>{brl(marginTotal)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {byMaterial.length === 0 && (
              <EmptyState title="Sem transações" message="Nenhuma transação no período selecionado." />
            )}
          </ListCard>

          <ListCard title="Detalhamento por cliente" count={byCustomer.length} className="list-auto">
            <table>
              <colgroup>
                <col style={{ width: '25%' }} />
                <col span={5} style={{ width: '15%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th className="right">Peso comprado</th>
                  <th className="right">Valor comprado</th>
                  <th className="right">Peso vendido</th>
                  <th className="right">Valor vendido</th>
                  <th className="right">Peso total</th>
                </tr>
              </thead>
              <tbody>
                {byCustomer.map((row) => (
                  <tr key={row.customer_id}>
                    <td className="font-semibold">{row.customer_name}</td>
                    <td className="mono right">{weight(row.buy_weight)}</td>
                    <td className="mono right">{brl(row.buy_total)}</td>
                    <td className="mono right">{weight(row.sell_weight)}</td>
                    <td className="mono right">{brl(row.sell_total)}</td>
                    <td className="mono right font-semibold">{weight(row.buy_weight + row.sell_weight)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {byCustomer.length === 0 && (
              <EmptyState title="Sem transações" message="Nenhuma transação no período selecionado." />
            )}
          </ListCard>
        </>
      )}
    </div>
  )
}
