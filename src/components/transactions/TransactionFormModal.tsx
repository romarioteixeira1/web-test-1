import { useState } from 'react'
import { orderMaterialHierarchy, type MaterialWithPrice } from '../../../shared/material'
import type { PaymentMethodRecord } from '../../../shared/payment-method'
import { emptyTransactionInput, type TransactionInput, type TransactionType } from '../../../shared/transaction'
import type { Customer } from '../../../shared/customer'
import { brl, parseDecimal, todayIso, toDecimalInput } from '../../lib/format'
import { ChoiceGroup, Field, Modal } from '../ui/Modal'

const typeOptions = [
  ['compra', 'Compra'],
  ['venda', 'Venda'],
] as const

type Props = {
  mode: 'create' | 'edit'
  initialValue?: TransactionInput
  customers: Customer[]
  materials: MaterialWithPrice[]
  paymentMethods: PaymentMethodRecord[]
  lockCustomerId?: number
  submitting?: boolean
  error?: string | null
  onSubmit: (input: TransactionInput) => void
  onCancel: () => void
}

type Invalid = 'customer' | 'material' | 'weight' | 'price' | null

export function TransactionFormModal({
  mode,
  initialValue,
  customers,
  materials,
  paymentMethods,
  lockCustomerId,
  submitting,
  error,
  onSubmit,
  onCancel,
}: Props) {
  const [form, setForm] = useState<TransactionInput>(
    initialValue ?? { ...emptyTransactionInput, customer_id: lockCustomerId ?? null, transacted_at: todayIso() },
  )
  const [weightText, setWeightText] = useState(initialValue ? String(initialValue.weight).replace('.', ',') : '')
  const [priceText, setPriceText] = useState(initialValue ? toDecimalInput(initialValue.unit_price) : '')
  const [invalid, setInvalid] = useState<Invalid>(null)

  function set<K extends keyof TransactionInput>(key: K, value: TransactionInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    setInvalid(null)
  }

  function priceFor(materialId: number, type: TransactionType) {
    const material = materials.find((m) => m.id === materialId)
    return type === 'compra' ? material?.buy_price : material?.sell_price
  }

  function handleMaterialChange(materialId: number) {
    set('material_type_id', materialId)
    const price = priceFor(materialId, form.transaction_type)
    if (price != null) setPriceText(toDecimalInput(price))
  }

  function handleTypeChange(type: TransactionType) {
    set('transaction_type', type)
    const price = priceFor(form.material_type_id, type)
    if (price != null) setPriceText(toDecimalInput(price))
  }

  const weight = parseDecimal(weightText)
  const unitPrice = parseDecimal(priceText)
  const total = (weight ?? 0) * (unitPrice ?? 0)
  const selectedMaterial = materials.find((m) => m.id === form.material_type_id)
  const materialRows = orderMaterialHierarchy(materials)
  const usableMethods = paymentMethods.filter(
    (m) =>
      m.code === form.payment_method ||
      (m.active && (form.transaction_type === 'compra' ? m.use_purchases : m.use_sales)),
  )
  // Same rule the worker uses to keep the installment count.
  const showInstallments =
    form.payment_status === 'parcelado' ||
    form.payment_method === 'cartao_credito' ||
    form.payment_method === 'cartao_debito'

  function handleSubmit() {
    const check: [Invalid, boolean, string][] = [
      ['customer', !form.customer_id, 'transaction-customer'],
      ['material', !form.material_type_id, 'transaction-material'],
      ['weight', weight == null || weight <= 0, 'transaction-weight'],
      ['price', unitPrice == null || unitPrice < 0, 'transaction-price'],
    ]
    const failed = check.find(([, bad]) => bad)
    if (failed) {
      setInvalid(failed[0])
      document.getElementById(failed[2])?.focus()
      return
    }
    onSubmit({ ...form, weight: weight!, unit_price: unitPrice! })
  }

  const invalidMessage: Record<Exclude<Invalid, null>, string> = {
    customer: 'Escolha o cliente antes de salvar.',
    material: 'Escolha o material antes de salvar.',
    weight: 'Informe um peso maior que zero (ex.: 12,5).',
    price: 'Informe um preço válido (ex.: 1,50).',
  }

  return (
    <Modal
      title={mode === 'edit' ? 'Editar transação' : 'Nova transação'}
      submitLabel={mode === 'edit' ? 'Salvar alterações' : 'Cadastrar'}
      submitting={submitting}
      error={invalid ? invalidMessage[invalid] : error}
      wide
      onSubmit={handleSubmit}
      onClose={onCancel}
    >
      <ChoiceGroup label="Tipo de transação" value={form.transaction_type} options={typeOptions} onChange={handleTypeChange} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Cliente *" htmlFor="transaction-customer">
          <select
            id="transaction-customer"
            className={`inp ${invalid === 'customer' ? 'invalid' : ''}`}
            value={form.customer_id ?? ''}
            disabled={Boolean(lockCustomerId)}
            onChange={(e) => set('customer_id', e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Selecione um cliente</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Material *" htmlFor="transaction-material">
          <select
            id="transaction-material"
            className={`inp ${invalid === 'material' ? 'invalid' : ''}`}
            value={form.material_type_id || ''}
            onChange={(e) => handleMaterialChange(Number(e.target.value))}
          >
            <option value="">Selecione um material</option>
            {materialRows.map(({ item, depth }) => (
              <option key={item.id} value={item.id}>
                {'— '.repeat(depth)}
                {item.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label={`Peso (${selectedMaterial?.unit ?? 'kg'}) *`} htmlFor="transaction-weight">
          <input
            id="transaction-weight"
            className={`inp mono ${invalid === 'weight' ? 'invalid' : ''}`}
            inputMode="decimal"
            placeholder="0,0"
            value={weightText}
            onChange={(e) => {
              setWeightText(e.target.value)
              setInvalid(null)
            }}
          />
        </Field>
        <Field label={`Preço (R$/${selectedMaterial?.unit ?? 'kg'}) *`} htmlFor="transaction-price">
          <input
            id="transaction-price"
            className={`inp mono ${invalid === 'price' ? 'invalid' : ''}`}
            inputMode="decimal"
            placeholder="0,00"
            value={priceText}
            onChange={(e) => {
              setPriceText(e.target.value)
              setInvalid(null)
            }}
          />
        </Field>
        <Field label="Data *" htmlFor="transaction-date">
          <input
            id="transaction-date"
            type="date"
            className="inp"
            value={form.transacted_at}
            onChange={(e) => set('transacted_at', e.target.value)}
          />
        </Field>
      </div>

      <div className="margin-box">
        <span className="lbl">Valor total</span>
        <strong className="mono pos">{brl(total || 0)}</strong>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Forma de pagamento" htmlFor="transaction-method">
          <select
            id="transaction-method"
            className="inp"
            value={form.payment_method ?? ''}
            onChange={(e) => set('payment_method', e.target.value || null)}
          >
            <option value="">Não informado</option>
            {usableMethods.map((m) => (
              <option key={m.code} value={m.code}>
                {m.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Status do pagamento" htmlFor="transaction-status">
          <select
            id="transaction-status"
            className="inp"
            value={form.payment_status}
            onChange={(e) => set('payment_status', e.target.value as TransactionInput['payment_status'])}
          >
            <option value="a_pagar">A pagar</option>
            <option value="pago">Pago</option>
            <option value="parcelado">Parcelado</option>
          </select>
        </Field>
        {showInstallments ? (
          <Field label="Parcelas" htmlFor="transaction-installments">
            <input
              id="transaction-installments"
              className="inp mono"
              inputMode="numeric"
              placeholder="1"
              value={form.installments ?? ''}
              onChange={(e) => {
                const n = Number.parseInt(e.target.value.replace(/\D/g, ''), 10)
                set('installments', Number.isFinite(n) && n > 0 ? n : null)
              }}
            />
          </Field>
        ) : (
          <div />
        )}
      </div>

      <Field label="Observações" htmlFor="transaction-notes">
        <textarea
          id="transaction-notes"
          className="inp"
          rows={2}
          value={form.notes ?? ''}
          onChange={(e) => set('notes', e.target.value)}
        />
      </Field>
    </Modal>
  )
}
