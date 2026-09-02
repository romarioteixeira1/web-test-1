import type { Customer } from '../../../shared/customer'

type Props = {
  customers: Customer[]
  onEdit: (customer: Customer) => void
  onDelete: (customer: Customer) => void
}

export function CustomerTable({ customers, onEdit, onDelete }: Props) {
  if (customers.length === 0) {
    return <p className="py-12 text-center text-sm">Nenhum cliente cadastrado ainda.</p>
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-surface text-text-strong">
          <tr>
            <th className="px-4 py-3 font-medium">Nome</th>
            <th className="px-4 py-3 font-medium">Contato</th>
            <th className="px-4 py-3 font-medium">Documento</th>
            <th className="px-4 py-3 font-medium">Cidade/UF</th>
            <th className="px-4 py-3 font-medium" />
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id} className="border-t border-border">
              <td className="px-4 py-3 text-text-strong">{customer.name}</td>
              <td className="px-4 py-3">
                <div>{customer.email || '—'}</div>
                <div>{customer.phone || ''}</div>
              </td>
              <td className="px-4 py-3">{customer.document || '—'}</td>
              <td className="px-4 py-3">
                {customer.city ? `${customer.city}${customer.state ? `/${customer.state}` : ''}` : '—'}
              </td>
              <td className="px-4 py-3 text-right whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => onEdit(customer)}
                  className="mr-3 hover:text-accent"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(customer)}
                  className="hover:text-red-500"
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
