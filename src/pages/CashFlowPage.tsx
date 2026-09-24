import { useMemo, useState } from 'react'
import * as api from '../api/reports'
import { useLoader } from '../app/hooks'
import { PeriodBarChart } from '../components/reports/PeriodBarChart'
import { ChartCard, ReportFilters } from '../components/reports/ReportFilters'
import { seriesColors } from '../components/reports/seriesColors'
import { Hero } from '../components/ui/Hero'
import { EmptyState, ErrorBox, ListCard, Loading } from '../components/ui/ListCard'
import type { CashFlowReport, ReportGranularity } from '../../shared/report'
import { brl, daysAgoIso, share, todayIso } from '../lib/format'
import { formatPeriodLabel } from '../lib/periods'

const emptyReport: CashFlowReport = { opening_balance: 0, rows: [] }

export function CashFlowPage() {
  const [from, setFrom] = useState(daysAgoIso(29))
  const [to, setTo] = useState(todayIso())
  const [granularity, setGranularity] = useState<ReportGranularity>('day')

  const { data, loading, error, reload } = useLoader(
    () => api.getCashFlow({ from, to }, granularity),
    [from, to, granularity],
    'Falha ao carregar o fluxo de caixa',
  )
  const report = data ?? emptyReport

  const periodRows = report.rows.map((row) => ({
    period: row.period,
    label: formatPeriodLabel(row.period, granularity),
    buy: row.entradas,
    sell: row.saidas,
  }))

  const withBalance = useMemo(() => {
    const rows: (CashFlowReport['rows'][number] & { saldoPeriodo: number; saldoAcumulado: number })[] = []
    for (const row of report.rows) {
      const saldoPeriodo = row.entradas - row.saidas
      const previous = rows.at(-1)?.saldoAcumulado ?? report.opening_balance
      rows.push({ ...row, saldoPeriodo, saldoAcumulado: previous + saldoPeriodo })
    }
    return rows
  }, [report])

  const totals = report.rows.reduce(
    (acc, row) => ({ entradas: acc.entradas + row.entradas, saidas: acc.saidas + row.saidas }),
    { entradas: 0, saidas: 0 },
  )
  const closingBalance = report.opening_balance + totals.entradas - totals.saidas
  const moved = totals.entradas + totals.saidas

  return (
    <div className="page">
      <Hero
        chip="ECOCONTROL · ANÁLISES"
        title="Fluxo de caixa"
        subtitle={`Dinheiro que entrou e saiu, só com transações marcadas como "Pago". Saldo inicial: ${brl(report.opening_balance)}.`}
        stats={[
          { label: 'Entradas (vendas)', value: brl(totals.entradas), share: share(totals.entradas, moved) },
          { label: 'Saídas (compras)', value: brl(totals.saidas), share: share(totals.saidas, moved) },
          { label: 'Saldo final', value: brl(closingBalance), share: 60, negative: closingBalance < 0 },
        ]}
      />

      <ReportFilters
        from={from}
        to={to}
        granularity={granularity}
        onFromChange={setFrom}
        onToChange={setTo}
        onGranularityChange={setGranularity}
      />

      {error && <ErrorBox message={error} onRetry={() => reload()} />}
      {loading && !data && <Loading />}

      {data && !error && (
        <>
          <ChartCard title="Entradas x saídas por período">
            <PeriodBarChart
              rows={periodRows}
              formatValue={brl}
              buyLabel="Entrada"
              sellLabel="Saída"
              buyColor={seriesColors.dark}
              sellColor={seriesColors.light}
              emptyMessage="Nenhuma transação paga no período selecionado."
            />
          </ChartCard>

          <ListCard title="Detalhamento" count={withBalance.length} className="list-auto">
            <table>
              <thead>
                <tr>
                  <th>Período</th>
                  <th className="right">Entradas</th>
                  <th className="right">Saídas</th>
                  <th className="right">Saldo do período</th>
                  <th className="right">Saldo acumulado</th>
                </tr>
              </thead>
              <tbody>
                {withBalance.map((row) => (
                  <tr key={row.period}>
                    <td className="mono font-semibold">{formatPeriodLabel(row.period, granularity)}</td>
                    <td className="mono right pos">{brl(row.entradas)}</td>
                    <td className="mono right">{brl(row.saidas)}</td>
                    <td className={`mono right ${row.saldoPeriodo >= 0 ? 'pos' : 'neg'}`}>{brl(row.saldoPeriodo)}</td>
                    <td className={`mono right ${row.saldoAcumulado >= 0 ? 'pos' : 'neg'}`}>
                      {brl(row.saldoAcumulado)}
                    </td>
                  </tr>
                ))}
              </tbody>
              {withBalance.length > 0 && (
                <tfoot>
                  <tr>
                    <td>Total</td>
                    <td className="mono right pos">{brl(totals.entradas)}</td>
                    <td className="mono right">{brl(totals.saidas)}</td>
                    <td className={`mono right ${totals.entradas - totals.saidas >= 0 ? 'pos' : 'neg'}`}>
                      {brl(totals.entradas - totals.saidas)}
                    </td>
                    <td className={`mono right ${closingBalance >= 0 ? 'pos' : 'neg'}`}>{brl(closingBalance)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
            {withBalance.length === 0 && (
              <EmptyState title="Sem movimento" message="Nenhuma transação paga no período selecionado." />
            )}
          </ListCard>
        </>
      )}
    </div>
  )
}
