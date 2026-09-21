import { useState, type FormEvent } from 'react'
import { emptyMaterialPriceInput, type MaterialPriceInput } from '../../../shared/material'

type Props = {
  title?: string
  initialValue?: Partial<MaterialPriceInput>
  unit: string
  submitting?: boolean
  error?: string | null
  onSubmit: (input: MaterialPriceInput) => void
  onCancel: () => void
}

const fieldClass =
  'w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-strong outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20'
const labelClass = 'flex flex-col gap-1 text-left text-sm'

export function PriceFormModal({ title = 'Novo preço', initialValue, unit, submitting, error, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<MaterialPriceInput>({ ...emptyMaterialPriceInput, ...initialValue })

  function set<K extends keyof MaterialPriceInput>(key: K, value: MaterialPriceInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <div className="animate-fade-in fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4">
      <div className="animate-scale-in w-full max-w-md rounded-lg border border-border bg-bg p-6 text-left shadow-xl">
        <h2 className="mb-4 text-xl font-medium text-text-strong">{title}</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              Preço de compra (R$/{unit})
              <input
                type="number"
                step="0.01"
                min="0"
                className={fieldClass}
                value={form.buy_price}
                onChange={(e) => set('buy_price', Number(e.target.value))}
                required
                autoFocus
              />
            </label>
            <label className={labelClass}>
              Preço de venda (R$/{unit})
              <input
                type="number"
                step="0.01"
                min="0"
                className={fieldClass}
                value={form.sell_price}
                onChange={(e) => set('sell_price', Number(e.target.value))}
                required
              />
            </label>
          </div>

          <label className={labelClass}>
            Data de vigência
            <input
              type="date"
              className={fieldClass}
              value={form.effective_at}
              onChange={(e) => set('effective_at', e.target.value)}
              required
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
