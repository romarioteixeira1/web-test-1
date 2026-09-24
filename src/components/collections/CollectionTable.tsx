import { Link } from 'react-router'
import type { CollectionWithCustomer } from '../../../shared/collection'
import { brl, dateOnly, dateTime, weight } from '../../lib/format'
import { EmptyState } from '../ui/ListCard'
import { RowActions } from '../ui/RowActions'

type Props = {
  collections: CollectionWithCustomer[]
  onEdit: (collection: CollectionWithCustomer) => void
  onDelete: (collection: CollectionWithCustomer) => void
}

export function CollectionTable({ collections, onEdit, onDelete }: Props) {
  return (
    <>
      <table>
        <colgroup>
          <col style={{ width: '24%' }} />
          <col style={{ width: '18%' }} />
          <col style={{ width: '11%' }} />
          <col style={{ width: '16%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '13%' }} />
          <col style={{ width: 104 }} />
        </colgroup>
        <thead>
          <tr>
            <th>Coleta</th>
            <th>Cliente</th>
            <th>Tipo</th>
            <th>Material</th>
            <th className="right">Valor</th>
            <th>Data</th>
            <th>Agendamento</th>
            <th className="center">Ações</th>
          </tr>
        </thead>
        <tbody>
          {collections.map((item) => (
            <tr key={item.id}>
              <td>
                <div className="cell-main">
                  <div className="stack">
                    <strong>{item.description}</strong>
                    {item.notes && <span title={item.notes}>{item.notes}</span>}
                  </div>
                </div>
              </td>
              <td>
                <Link to={`/clientes/${item.customer_id}`} className="link">
                  {item.customer_name}
                </Link>
              </td>
              <td>
                <span className={`tag ${item.type === 'material' ? 'tone-green' : 'tone-light'}`}>
                  {item.type === 'material' ? 'Material' : 'Serviço'}
                </span>
              </td>
              <td>
                {item.type === 'material'
                  ? [item.material_type, item.weight_kg != null ? weight(item.weight_kg) : null]
                      .filter(Boolean)
                      .join(' · ') || '—'
                  : '—'}
              </td>
              <td className="mono right">{brl(item.amount)}</td>
              <td className="mono">{dateOnly(item.collected_at)}</td>
              <td className="mono">{dateTime(item.scheduled_at)}</td>
              <RowActions name={item.description} onEdit={() => onEdit(item)} onDelete={() => onDelete(item)} />
            </tr>
          ))}
        </tbody>
      </table>
      {collections.length === 0 && <EmptyState />}
    </>
  )
}
