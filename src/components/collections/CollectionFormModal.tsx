import { useState, type FormEvent } from 'react'
import { emptyCollectionInput, materialTypes, type CollectionInput } from '../../../shared/collection'
import type { Customer } from '../../../shared/customer'

type Props = {
  title?: string
  initialValue?: CollectionInput
  customers?: Customer[]
  lockCustomerId?: number
  submitting?: boolean
  error?: string | null
  onSubmit: (input: CollectionInput) => void
  onCancel: () => void
}

const fieldClass =
  'w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-strong outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20'
const labelClass = 'flex flex-col gap-1 text-left text-sm'

export function CollectionFormModal({
  title,
  initialValue,
  customers,
  lockCustomerId,
  submitting,
  error,
  onSubmit,
  onCancel,
}: Props) {
  const [form, setForm] = useState<CollectionInput>(
    initialValue ?? { ...emptyCollectionInput, customer_id: lockCustomerId ?? null },
  )
  const [amountText, setAmountText] = useState(
    initialValue ? initialValue.amount.toString().replace('.', ',') : '',
  )
  const [weightText, setWeightText] = useState(
    initialValue?.weight_kg != null ? initialValue.weight_kg.toString().replace('.', ',') : '',
  )

  function set<K extends keyof CollectionInput>(key: K, value: CollectionInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit({
      ...form,
      amount: Number(amountText.replace(',', '.')) || 0,
      weight_kg: form.type === 'material' ? Number(weightText.replace(',', '.')) || null : null,
    })
  }

  const isMaterial = form.type === 'material'

  return (
    <div className="animate-fade-in fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4">
      <div className="animate-scale-in w-full max-w-md rounded-lg border border-border bg-bg p-6 text-left shadow-xl">
        <h2 className="mb-4 text-xl font-medium text-text-strong">{title ?? 'Nova coleta'}</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {customers && (
            <label className={labelClass}>
              Cliente *
              <select
                className={fieldClass}
                value={form.customer_id ?? ''}
                onChange={(e) => set('customer_id', e.target.value ? Number(e.target.value) : null)}
                required
                disabled={Boolean(lockCustomerId)}
              >
                <option value="">Selecione um cliente</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className={labelClass}>
            Tipo
            <select
              className={fieldClass}
              value={form.type}
              onChange={(e) => set('type', e.target.value as CollectionInput['type'])}
            >
              <option value="material">Compra de material reciclável</option>
              <option value="servico">Serviço de coleta</option>
            </select>
          </label>

          <label className={labelClass}>
            Descrição *
            <input
              className={fieldClass}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder={isMaterial ? 'Ex: Papelão misturado' : 'Ex: Coleta de entulho residencial'}
              required
              autoFocus
            />
          </label>

          {isMaterial && (
            <div className="grid grid-cols-2 gap-4">
              <label className={labelClass}>
                Tipo de material
                <select
                  className={fieldClass}
                  value={form.material_type ?? ''}
                  onChange={(e) => set('material_type', e.target.value)}
                >
                  <option value="">Selecione</option>
                  {materialTypes.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
              <label className={labelClass}>
                Peso (kg)
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  className={fieldClass}
                  value={weightText}
                  onChange={(e) => setWeightText(e.target.value)}
                />
              </label>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <label className={labelClass}>
              {isMaterial ? 'Valor pago (R$) *' : 'Valor cobrado (R$) *'}
              <input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                className={fieldClass}
                value={amountText}
                onChange={(e) => setAmountText(e.target.value)}
                required
              />
            </label>
            <label className={labelClass}>
              Data da coleta
              <input
                type="date"
                className={fieldClass}
                value={form.collected_at}
                onChange={(e) => set('collected_at', e.target.value)}
              />
            </label>
          </div>

          <label className={labelClass}>
            Agendamento de coleta
            <input
              type="datetime-local"
              className={fieldClass}
              value={form.scheduled_at ?? ''}
              onChange={(e) => set('scheduled_at', e.target.value)}
            />
          </label>

          <label className={labelClass}>
            Observações
            <textarea
              className={fieldClass}
              rows={3}
              value={form.notes ?? ''}
              onChange={(e) => set('notes', e.target.value)}
            />
          </label>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="mt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md border border-border px-4 py-2 text-sm transition-all hover:bg-surface active:scale-95"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-accent-strong hover:shadow-md active:scale-95 disabled:opacity-60 disabled:active:scale-100"
            >
              {submitting ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
