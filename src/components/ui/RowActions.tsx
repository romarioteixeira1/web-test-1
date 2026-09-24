import type { ReactNode } from 'react'
import { IconEdit, IconTrash } from '../layout/icons'

type Props = {
  name: string
  onEdit?: () => void
  onDelete?: () => void
  children?: ReactNode
}

/** Icon buttons for the "Ações" column. Extra actions go in `children`, before edit/delete. */
export function RowActions({ name, onEdit, onDelete, children }: Props) {
  return (
    <td className="actions">
      {children}
      {onEdit && (
        <button type="button" className="icon" onClick={onEdit} aria-label={`Editar ${name}`} title="Editar">
          <IconEdit size={16} />
        </button>
      )}
      {onDelete && (
        <button type="button" className="icon del" onClick={onDelete} aria-label={`Excluir ${name}`} title="Excluir">
          <IconTrash size={16} />
        </button>
      )}
    </td>
  )
}

export function Switch({
  checked,
  label,
  disabled,
  onChange,
}: {
  checked: boolean
  label: string
  disabled?: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <button
      type="button"
      className="switch"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
    >
      <span />
    </button>
  )
}
