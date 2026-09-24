import { Link } from 'react-router'
import { relationshipTypeLabels, type Customer, type RelationshipType } from '../../../shared/customer'
import { initials } from '../../lib/format'
import { EmptyState } from '../ui/ListCard'
import { RowActions } from '../ui/RowActions'

type Props = {
  customers: Customer[]
  onEdit: (customer: Customer) => void
  onDelete: (customer: Customer) => void
}

const relationshipTone: Record<RelationshipType, string> = {
  fornecedor: 'tone-green',
  comprador: 'tone-light',
  ambos: 'tone-dark',
}

export function CustomerTable({ customers, onEdit, onDelete }: Props) {
  return (
    <>
      <table>
        <colgroup>
          <col style={{ width: '30%' }} />
          <col style={{ width: '19%' }} />
          <col style={{ width: '16%' }} />
          <col style={{ width: '16%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: 104 }} />
        </colgroup>
        <thead>
          <tr>
            <th>Cliente</th>
            <th>CPF / CNPJ</th>
            <th>Telefone</th>
            <th>Cidade / UF</th>
            <th>Tipo</th>
            <th className="center">Ações</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => {
            const tone = relationshipTone[c.relationship_type]
            return (
              <tr key={c.id}>
                <td>
                  <div className="cell-main">
                    <div className={`avatar ${tone}`}>{initials(c.name)}</div>
                    <div className="stack">
                      <strong>
                        <Link to={`/clientes/${c.id}`} className="link">
                          {c.name}
                        </Link>
                      </strong>
                      <span>
                        {c.email || 'sem e-mail'}
                        {c.status === 'inactive' && ' · Inativo'}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="mono">{c.document || '—'}</td>
                <td className="mono">{c.phone || '—'}</td>
                <td>
                  {c.city || '—'}
                  {c.state ? ` / ${c.state.toUpperCase()}` : ''}
                </td>
                <td>
                  <span className={`tag ${tone}`}>{relationshipTypeLabels[c.relationship_type]}</span>
                </td>
                <RowActions name={c.name} onEdit={() => onEdit(c)} onDelete={() => onDelete(c)} />
              </tr>
            )
          })}
        </tbody>
      </table>
      {customers.length === 0 && <EmptyState />}
    </>
  )
}
