import { Link } from 'react-router'
import type { CollectionWithCustomer } from '../../../shared/collection'

type Props = {
  collections: CollectionWithCustomer[]
  showCustomer?: boolean
  onEdit: (collection: CollectionWithCustomer) => void
  onDelete: (collection: CollectionWithCustomer) => void
}

function formatDateOnly(value: string) {
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
}

function formatDateTime(value: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatWeight(value: number) {
  return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} kg`
}

export function CollectionTable({ collections, showCustomer = true, onEdit, onDelete }: Props) {
  if (collections.length === 0) {
    return <p className="py-12 text-center text-sm">Nenhuma coleta registrada ainda.</p>
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[980px] text-left text-sm">
        <thead className="bg-surface text-text-strong">
          <tr>
            <th className="px-4 py-3 font-medium">Descrição</th>
            {showCustomer && <th className="px-4 py-3 font-medium">Cliente</th>}
            <th className="px-4 py-3 font-medium">Tipo</th>
            <th className="px-4 py-3 font-medium">Material</th>
            <th className="px-4 py-3 font-medium">Valor</th>
            <th className="px-4 py-3 font-medium">Data</th>
            <th className="px-4 py-3 font-medium">Agendamento</th>
            <th className="px-4 py-3 font-medium">Observações</th>
            <th className="px-4 py-3 font-medium" />
          </tr>
        </thead>
        <tbody>
          {collections.map((item) => (
            <tr key={item.id} className="border-t border-border transition-colors hover:bg-surface">
              <td className="px-4 py-3 text-text-strong">{item.description}</td>
              {showCustomer && (
                <td className="px-4 py-3 whitespace-nowrap">
                  <Link
                    to={`/clientes/${item.customer_id}`}
                    className="transition-colors hover:text-accent hover:underline"
                  >
                    {item.customer_name}
                  </Link>
                </td>
              )}
              <td className="px-4 py-3 whitespace-nowrap">
                <span
                  className={
                    item.type === 'material'
                      ? 'rounded-full bg-accent-soft px-2 py-1 text-xs font-medium text-accent'
                      : 'rounded-full bg-surface px-2 py-1 text-xs font-medium text-text-strong'
                  }
                >
                  {item.type === 'material' ? 'Material' : 'Serviço'}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {item.type === 'material'
                  ? [item.material_type, item.weight_kg != null ? formatWeight(item.weight_kg) : null]
                      .filter(Boolean)
                      .join(' · ') || '—'
                  : '—'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap font-medium text-accent">{formatCurrency(item.amount)}</td>
              <td className="px-4 py-3 whitespace-nowrap">{formatDateOnly(item.collected_at)}</td>
              <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(item.scheduled_at)}</td>
              <td className="px-4 py-3">{item.notes || '—'}</td>
              <td className="px-4 py-3 text-right whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => onEdit(item)}
                  className="mr-3 font-medium transition-colors hover:text-accent"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(item)}
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
