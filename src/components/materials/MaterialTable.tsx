import { Link } from 'react-router'
import { orderMaterialHierarchy, type MaterialWithPrice } from '../../../shared/material'

type Props = {
  materials: MaterialWithPrice[]
  onEdit: (material: MaterialWithPrice) => void
  onSetPrice: (material: MaterialWithPrice) => void
  onDelete: (material: MaterialWithPrice) => void
}

function formatCurrency(value: number | null) {
  if (value == null) return '—'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function MaterialTable({ materials, onEdit, onSetPrice, onDelete }: Props) {
  if (materials.length === 0) {
    return <p className="py-12 text-center text-sm">Nenhum material cadastrado ainda.</p>
  }

  const rows = orderMaterialHierarchy(materials).map(({ item, depth }) => ({ material: item, depth }))

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead className="bg-surface text-text-strong">
          <tr>
            <th className="px-4 py-3 font-medium">Material</th>
            <th className="px-4 py-3 font-medium">Unidade</th>
            <th className="px-4 py-3 font-medium">Preço de compra</th>
            <th className="px-4 py-3 font-medium">Preço de venda</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium" />
          </tr>
        </thead>
        <tbody>
          {rows.map(({ material, depth }) => (
            <tr key={material.id} className="border-t border-border transition-colors hover:bg-surface">
              <td className="px-4 py-3 text-text-strong">
                <span style={{ paddingLeft: `${depth * 1.25}rem` }} className="inline-flex items-center gap-1.5">
                  {depth > 0 && <span className="text-text">↳</span>}
                  <Link to={`/materiais/${material.id}`} className="transition-colors hover:text-accent hover:underline">
                    {material.name}
                  </Link>
                </span>
              </td>
              <td className="px-4 py-3">{material.unit}</td>
              <td className="px-4 py-3 whitespace-nowrap">{formatCurrency(material.buy_price)}</td>
              <td className="px-4 py-3 whitespace-nowrap font-medium text-accent">
                {formatCurrency(material.sell_price)}
              </td>
              <td className="px-4 py-3">
                <span
                  className={
                    material.status === 'active'
                      ? 'rounded-full bg-accent-soft px-2 py-1 text-xs font-medium text-accent'
                      : 'rounded-full bg-red-500/15 px-2 py-1 text-xs font-medium text-red-500'
                  }
                >
                  {material.status === 'active' ? 'Ativo' : 'Inativo'}
                </span>
              </td>
              <td className="px-4 py-3 text-right whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => onSetPrice(material)}
                  className="mr-3 font-medium text-accent transition-colors hover:underline"
                >
                  {material.buy_price == null ? 'Definir preço' : 'Novo preço'}
                </button>
                <Link to={`/materiais/${material.id}`} className="mr-3 font-medium transition-colors hover:text-accent">
                  Histórico
                </Link>
                <button
                  type="button"
                  onClick={() => onEdit(material)}
                  className="mr-3 font-medium transition-colors hover:text-accent"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(material)}
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
