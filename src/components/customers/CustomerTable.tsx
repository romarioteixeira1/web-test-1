import { Link } from 'react-router'
import { paymentMethodLabels, relationshipTypeLabels, type Customer } from '../../../shared/customer'

type Props = {
  customers: Customer[]
  onEdit: (customer: Customer) => void
  onDelete: (customer: Customer) => void
}

function formatDate(value: string) {
  const date = new Date(value.includes(' ') ? value.replace(' ', 'T') + 'Z' : value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('pt-BR')
}

export function CustomerTable({ customers, onEdit, onDelete }: Props) {
  if (customers.length === 0) {
    return <p className="py-12 text-center text-sm">Nenhum cliente cadastrado ainda.</p>
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[1080px] text-left text-sm">
        <thead className="bg-surface text-text-strong">
          <tr>
            <th className="px-4 py-3 font-medium">Nome</th>
            <th className="px-4 py-3 font-medium">Contato</th>
            <th className="px-4 py-3 font-medium">Documento</th>
            <th className="px-4 py-3 font-medium">Relação</th>
            <th className="px-4 py-3 font-medium">Pagamento</th>
            <th className="px-4 py-3 font-medium">Cidade/UF</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Cadastro</th>
            <th className="px-4 py-3 font-medium" />
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id} className="border-t border-border transition-colors hover:bg-surface">
              <td className="px-4 py-3 text-text-strong">
                <Link to={`/clientes/${customer.id}`} className="transition-colors hover:text-accent hover:underline">
                  {customer.name}
                </Link>
              </td>
              <td className="px-4 py-3">
                <div>{customer.email || '—'}</div>
                <div>{customer.phone || ''}</div>
              </td>
              <td className="px-4 py-3">{customer.document || '—'}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="rounded-full bg-surface px-2 py-1 text-xs font-medium text-text-strong">
                  {relationshipTypeLabels[customer.relationship_type]}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {customer.payment_method ? paymentMethodLabels[customer.payment_method] : '—'}
              </td>
              <td className="px-4 py-3">
                {customer.city ? `${customer.city}${customer.state ? `/${customer.state}` : ''}` : '—'}
              </td>
              <td className="px-4 py-3">
                <span
                  className={
                    customer.status === 'active'
                      ? 'rounded-full bg-accent-soft px-2 py-1 text-xs font-medium text-accent'
                      : 'rounded-full bg-red-500/15 px-2 py-1 text-xs font-medium text-red-500'
                  }
                >
                  {customer.status === 'active' ? 'Ativo' : 'Inativo'}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">{formatDate(customer.created_at)}</td>
              <td className="px-4 py-3 text-right whitespace-nowrap">
                <Link to={`/clientes/${customer.id}`} className="mr-3 font-medium transition-colors hover:text-accent">
                  Detalhes
                </Link>
                <button
                  type="button"
                  onClick={() => onEdit(customer)}
                  className="mr-3 font-medium transition-colors hover:text-accent"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(customer)}
                  className="font-medium transition-colors hover:text-red-500"
                >
                  Excluir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
