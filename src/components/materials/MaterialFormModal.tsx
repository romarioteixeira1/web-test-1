import { useState, type FormEvent } from 'react'
import {
  commonUnits,
  emptyMaterialTypeInput,
  type MaterialPriceInput,
  type MaterialTypeInput,
  type MaterialWithPrice,
} from '../../../shared/material'

type Props = {
  title: string
  initialValue?: MaterialWithPrice
  submitting?: boolean
  error?: string | null
  onSubmit: (input: MaterialTypeInput, price: MaterialPriceInput | null) => void
  onCancel: () => void
}

const fieldClass =
  'w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-strong outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20'
const labelClass = 'flex flex-col gap-1 text-left text-sm'

export function MaterialFormModal({ title, initialValue, submitting, error, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<MaterialTypeInput>(initialValue ?? emptyMaterialTypeInput)
  const [customUnit, setCustomUnit] = useState(!commonUnits.includes(form.unit))
  const [buyPriceText, setBuyPriceText] = useState(initialValue?.buy_price?.toString() ?? '')
  const [sellPriceText, setSellPriceText] = useState(initialValue?.sell_price?.toString() ?? '')
  const [priceError, setPriceError] = useState<string | null>(null)

  function set<K extends keyof MaterialTypeInput>(key: K, value: MaterialTypeInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setPriceError(null)

    const hasBuy = buyPriceText.trim() !== ''
    const hasSell = sellPriceText.trim() !== ''
    if (hasBuy !== hasSell) {
      setPriceError('Preencha os dois preços (compra e venda) ou deixe ambos em branco.')
      return
    }

    const price: MaterialPriceInput | null = hasBuy
      ? {
          buy_price: Number(buyPriceText),
          sell_price: Number(sellPriceText),
          effective_at: new Date().toISOString().slice(0, 10),
        }
      : null

    onSubmit(form, price)
  }

  return (
    <div className="animate-fade-in fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4">
      <div className="animate-scale-in max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-bg p-6 text-left shadow-xl">
        <h2 className="mb-4 text-xl font-medium text-text-strong">{title}</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className={labelClass}>
            Nome *
            <input
              className={fieldClass}
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              required
              autoFocus
              placeholder="Ex: Papelão, PET, Alumínio..."
            />
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              Unidade de medida
              {customUnit ? (
                <input
                  className={fieldClass}
                  value={form.unit}
                  onChange={(e) => set('unit', e.target.value)}
                  placeholder="kg"
                />
              ) : (
                <select
                  className={fieldClass}
                  value={form.unit}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setCustomUnit(true)
                      return
                    }
                    set('unit', e.target.value)
                  }}
                >
                  {commonUnits.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                  <option value="__custom__">Outra...</option>
                </select>
              )}
            </label>
            <label className={labelClass}>
              Status
              <select
                className={fieldClass}
                value={form.status}
                onChange={(e) => set('status', e.target.value as MaterialTypeInput['status'])}
              >
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              Preço de compra (R$/{form.unit})
              <input
                type="number"
                step="0.01"
                min="0"
                className={fieldClass}
                value={buyPriceText}
                onChange={(e) => setBuyPriceText(e.target.value)}
                placeholder="0,00"
              />
            </label>
            <label className={labelClass}>
              Preço de venda (R$/{form.unit})
              <input
                type="number"
                step="0.01"
                min="0"
                className={fieldClass}
                value={sellPriceText}
                onChange={(e) => setSellPriceText(e.target.value)}
                placeholder="0,00"
              />
            </label>
          </div>
          <span className="-mt-2 text-xs">Preencha para registrar o preço vigente a partir de hoje.</span>

          {priceError && <p className="text-sm text-red-500">{priceError}</p>}
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
