import { useState, type FormEvent } from 'react'
import { emptyPurchaseInput, type PurchaseInput } from '../../../shared/purchase'

type Props = {
  submitting?: boolean
  error?: string | null
  onSubmit: (input: PurchaseInput) => void
  onCancel: () => void
}

const fieldClass =
  'w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-strong outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20'
const labelClass = 'flex flex-col gap-1 text-left text-sm'

export function PurchaseFormModal({ submitting, error, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<PurchaseInput>(emptyPurchaseInput)
  const [amountText, setAmountText] = useState('')

  function set<K extends keyof PurchaseInput>(key: K, value: PurchaseInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit({ ...form, amount: Number(amountText.replace(',', '.')) || 0 })
  }

  return (
    <div className="animate-fade-in fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4">
      <div className="animate-scale-in w-full max-w-md rounded-lg border border-border bg-bg p-6 text-left shadow-xl">
        <h2 className="mb-4 text-xl font-medium text-text-strong">Nova compra</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className={labelClass}>
            Descrição *
            <input
              className={fieldClass}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              required
              autoFocus
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className={labelClass}>
              Valor (R$) *
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
              Data da compra
              <input
                type="date"
                className={fieldClass}
                value={form.purchased_at}
                onChange={(e) => set('purchased_at', e.target.value)}
              />
            </label>
          </div>

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
