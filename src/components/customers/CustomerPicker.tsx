import { useState } from 'react'
import { customerLabel, findCustomerByCode, type Customer } from '../../../shared/customer'
import { Field } from '../ui/Modal'

type Props = {
  /** id of the <select>; the field label points at it and forms focus it when the customer is missing. */
  id: string
  customers: Customer[]
  value: number | null
  invalid?: boolean
  disabled?: boolean
  onChange: (customerId: number | null) => void
}

/** "Cliente" field for transactions and collections: type the customer's code or pick from the list. */
export function CustomerPicker({ id, customers, value, invalid, disabled, onChange }: Props) {
  const [codeText, setCodeText] = useState(() => customers.find((c) => c.id === value)?.code ?? '')
  const typedMatch = findCustomerByCode(customers, codeText)

  function handleCode(text: string) {
    setCodeText(text)
    const match = findCustomerByCode(customers, text)
    // Only clear the pick once something was typed that matches no one; an empty box keeps the list choice.
    if (match) onChange(match.id)
    else if (text.trim()) onChange(null)
  }

  function handleSelect(customerId: number | null) {
    setCodeText(customers.find((c) => c.id === customerId)?.code ?? '')
    onChange(customerId)
  }

  return (
    <Field
      label="Cliente *"
      htmlFor={id}
      hint={codeText.trim() && !typedMatch ? `Nenhum cliente com o código "${codeText.trim()}".` : undefined}
    >
      <div className="flex gap-2">
        <input
          className={`inp mono w-28 shrink-0 ${invalid ? 'invalid' : ''}`}
          aria-label="Código do cliente"
          placeholder="Código"
          autoComplete="off"
          spellCheck={false}
          disabled={disabled}
          value={codeText}
          onChange={(e) => handleCode(e.target.value)}
          // Enter confirms the code instead of submitting the whole form.
          onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
        />
        <select
          id={id}
          className={`inp min-w-0 flex-1 ${invalid ? 'invalid' : ''}`}
          value={value ?? ''}
          disabled={disabled}
          onChange={(e) => handleSelect(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">Selecione um cliente</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {customerLabel(c)}
            </option>
          ))}
        </select>
      </div>
    </Field>
  )
}
