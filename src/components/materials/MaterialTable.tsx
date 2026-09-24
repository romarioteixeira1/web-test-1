import { Link } from 'react-router'
import type { MaterialWithPrice } from '../../../shared/material'
import { abbreviation, brl, signedBrl } from '../../lib/format'
import { marginOf } from '../../lib/metrics'
import { IconHistory } from '../layout/icons'
import { EmptyState } from '../ui/ListCard'
import { RowActions } from '../ui/RowActions'

type Props = {
  rows: { item: MaterialWithPrice; depth: number }[]
  onEdit: (material: MaterialWithPrice) => void
  onDelete: (material: MaterialWithPrice) => void
}

function price(value: number | null, unit: string) {
  if (value == null) return '—'
  return (
    <>
      {brl(value)}
      {unit !== 'kg' && <span className="text-muted">/{unit}</span>}
    </>
  )
}

export function MaterialTable({ rows, onEdit, onDelete }: Props) {
  return (
    <>
      <table>
        <colgroup>
          <col style={{ width: '30%' }} />
          <col style={{ width: '16%' }} />
          <col style={{ width: '16%' }} />
          <col style={{ width: '16%' }} />
          <col style={{ width: '16%' }} />
          <col style={{ width: 140 }} />
        </colgroup>
        <thead>
          <tr>
            <th>Material</th>
            <th>Categoria</th>
            <th className="right">Compra / kg</th>
            <th className="right">Venda / kg</th>
            <th className="right">Margem / kg</th>
            <th className="center">Ações</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ item: m, depth }) => {
            const margin = marginOf(m)
            const inactive = m.status === 'inactive'
            return (
              <tr key={m.id}>
                <td>
                  <div className="cell-main" style={{ paddingLeft: depth * 20 }}>
                    <div className={`badge ${inactive ? 'tone-gray' : 'tone-green'}`}>{abbreviation(m.name)}</div>
                    <div className="stack">
                      <strong>
                        <Link to={`/materiais/${m.id}`} className="link">
                          {m.name}
                        </Link>
                      </strong>
                      {(depth > 0 || inactive || m.unit !== 'kg') && (
                        <span>
                          {[depth > 0 && 'Subtipo', m.unit !== 'kg' && `por ${m.unit}`, inactive && 'Inativo']
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td>
                  {m.category ? (
                    <span className="tag tone-green">{m.category}</span>
                  ) : (
                    <span className="tag neutral">Sem categoria</span>
                  )}
                </td>
                <td className="mono right">{price(m.buy_price, m.unit)}</td>
                <td className="mono right">{price(m.sell_price, m.unit)}</td>
                <td className={`mono right ${margin == null ? '' : margin >= 0 ? 'pos' : 'neg'}`}>
                  {margin == null ? '—' : signedBrl(margin)}
                </td>
                <RowActions name={m.name} onEdit={() => onEdit(m)} onDelete={() => onDelete(m)}>
                  <Link
                    to={`/materiais/${m.id}`}
                    className="icon"
                    aria-label={`Histórico de preços de ${m.name}`}
                    title="Histórico de preços"
                  >
                    <IconHistory size={16} />
                  </Link>
                </RowActions>
              </tr>
            )
          })}
        </tbody>
      </table>
      {rows.length === 0 && <EmptyState />}
    </>
  )
}
