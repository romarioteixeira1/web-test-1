import { useState, type FormEvent } from 'react'
import { orderMaterialHierarchy, type MaterialWithPrice } from '../../../shared/material'
import { emptyTransactionInput, type TransactionInput, type TransactionType } from '../../../shared/transaction'
import type { Customer, PaymentMethod } from '../../../shared/customer'

type Props = {
  title: string
  initialValue?: TransactionInput
  customers: Customer[]
  materials: MaterialWithPrice[]
  lockCustomerId?: number
  submitting?: boolean
  error?: string | null
  onSubmit: (input: TransactionInput) => void
  onCancel: () => void
}

const fieldClass =
  'w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-strong outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20'
const labelClass = 'flex flex-col gap-1 text-left text-sm'

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function TransactionFormModal({
  title,
  initialValue,
  customers,
  materials,
  lockCustomerId,
  submitting,
  error,
  onSubmit,
  onCancel,
}: Props) {
  const [form, setForm] = useState<TransactionInput>(
    initialValue ?? { ...emptyTransactionInput, customer_id: lockCustomerId ?? null },
  )

  function set<K extends keyof TransactionInput>(key: K, value: TransactionInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function priceFor(materialId: number, type: TransactionType) {
    const material = materials.find((m) => m.id === materialId)
    return type === 'compra' ? material?.buy_price : material?.sell_price
  }

  function handleMaterialChange(materialId: number) {
    const price = priceFor(materialId, form.transaction_type)
    setForm((f) => ({ ...f, material_type_id: materialId, unit_price: price ?? f.unit_price }))
  }

  function handleTypeChange(type: TransactionType) {
    const price = priceFor(form.material_type_id, type)
    setForm((f) => ({ ...f, transaction_type: type, unit_price: price ?? f.unit_price }))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit(form)
  }

  const materialRows = orderMaterialHierarchy(materials)
  const selectedMaterial = materials.find((m) => m.id === form.material_type_id)
  const total = form.weight * form.unit_price

  return (
    <div className="animate-fade-in fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4">
      <div className="animate-scale-in max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-bg p-6 text-left shadow-xl">
        <h2 className="mb-4 text-xl font-medium text-text-strong">{title}</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr]">
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
            <label className={labelClass}>
              Tipo *
              <select
                className={fieldClass}
                value={form.transaction_type}
                onChange={(e) => handleTypeChange(e.target.value as TransactionType)}
              >
                <option value="compra">Compra</option>
                <option value="venda">Venda</option>
              </select>
            </label>
          </div>

          <label className={labelClass}>
            Material *
            <select
              className={fieldClass}
              value={form.material_type_id || ''}
              onChange={(e) => handleMaterialChange(Number(e.target.value))}
              required
            >
              <option value="">Selecione um material</option>
              {materialRows.map(({ item, depth }) => (
                <option key={item.id} value={item.id}>
                  {'—'.repeat(depth)} {item.name}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className={labelClass}>
              Peso {selectedMaterial ? `(${selectedMaterial.unit})` : ''} *
              <input
                type="number"
                step="0.01"
                min="0"
                className={fieldClass}
                value={form.weight}
                onChange={(e) => set('weight', Number(e.target.value))}
                required
              />
            </label>
            <label className={labelClass}>
              Preço no momento (R$) *
              <input
                type="number"
                step="0.01"
                min="0"
                className={fieldClass}
                value={form.unit_price}
                onChange={(e) => set('unit_price', Number(e.target.value))}
                required
              />
            </label>
            <label className={labelClass}>
              Valor total
              <input className={fieldClass} value={formatCurrency(total || 0)} disabled />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className={labelClass}>
              Forma de pagamento
              <select
                className={fieldClass}
                value={form.payment_method ?? ''}
                onChange={(e) => set('payment_method', (e.target.value || null) as PaymentMethod | null)}
              >
                <option value="">Não informado</option>
                <option value="pix">Pix</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="transferencia">Transferência</option>
              </select>
            </label>
            <label className={labelClass}>
              Status de pagamento
              <select
                className={fieldClass}
                value={form.payment_status}
                onChange={(e) => set('payment_status', e.target.value as TransactionInput['payment_status'])}
              >
                <option value="a_pagar">A pagar</option>
                <option value="pago">Pago</option>
                <option value="parcelado">Parcelado</option>
              </select>
            </label>
            <label className={labelClass}>
              Data da transação *
              <input
                type="date"
                className={fieldClass}
                value={form.transacted_at}
                onChange={(e) => set('transacted_at', e.target.value)}
                required
              />
            </label>
          </div>

          {form.payment_status === 'parcelado' && (
            <label className={labelClass}>
              Número de parcelas
              <input
                type="number"
                min="2"
                step="1"
                className={`${fieldClass} sm:max-w-40`}
                value={form.installments ?? ''}
                onChange={(e) => set('installments', e.target.value ? Number(e.target.value) : null)}
              />
            </label>
          )}

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
