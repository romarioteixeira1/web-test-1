import { useState } from 'react'
import { emptyCollectionInput, materialTypes, type CollectionInput } from '../../../shared/collection'
import type { Customer } from '../../../shared/customer'
import { parseDecimal, todayIso, toDecimalInput } from '../../lib/format'
import { ChoiceGroup, Field, Modal } from '../ui/Modal'

const typeOptions = [
  ['material', 'Compra de material'],
  ['servico', 'Serviço de coleta'],
] as const

type Props = {
  mode: 'create' | 'edit'
  initialValue?: CollectionInput
  customers: Customer[]
  submitting?: boolean
  error?: string | null
  onSubmit: (input: CollectionInput) => void
  onCancel: () => void
}

type Invalid = 'customer' | 'description' | 'amount' | null

export function CollectionFormModal({ mode, initialValue, customers, submitting, error, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<CollectionInput>(
    initialValue ?? { ...emptyCollectionInput, collected_at: todayIso() },
  )
  const [amountText, setAmountText] = useState(initialValue ? toDecimalInput(initialValue.amount) : '')
  const [weightText, setWeightText] = useState(
    initialValue?.weight_kg != null ? String(initialValue.weight_kg).replace('.', ',') : '',
  )
  const [invalid, setInvalid] = useState<Invalid>(null)

  function set<K extends keyof CollectionInput>(key: K, value: CollectionInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    setInvalid(null)
  }

  const isMaterial = form.type === 'material'

  function handleSubmit() {
    const amount = parseDecimal(amountText)
    const check: [Invalid, boolean, string][] = [
      ['customer', !form.customer_id, 'collection-customer'],
      ['description', !form.description.trim(), 'collection-description'],
      ['amount', amount == null || amount < 0, 'collection-amount'],
    ]
    const failed = check.find(([, bad]) => bad)
    if (failed) {
      setInvalid(failed[0])
      document.getElementById(failed[2])?.focus()
      return
    }
    onSubmit({
      ...form,
      amount: amount ?? 0,
      weight_kg: isMaterial ? parseDecimal(weightText) : null,
    })
  }

  const invalidMessage: Record<Exclude<Invalid, null>, string> = {
    customer: 'Escolha o cliente antes de salvar.',
    description: 'Preencha a descrição antes de salvar.',
    amount: 'Informe um valor válido (ex.: 150,00).',
  }

  return (
    <Modal
      title={mode === 'edit' ? 'Editar coleta' : 'Nova coleta'}
      submitLabel={mode === 'edit' ? 'Salvar alterações' : 'Cadastrar'}
      submitting={submitting}
      error={invalid ? invalidMessage[invalid] : error}
      onSubmit={handleSubmit}
      onClose={onCancel}
    >
      <ChoiceGroup label="Tipo de coleta" value={form.type} options={typeOptions} onChange={(v) => set('type', v)} />

      <Field label="Cliente *" htmlFor="collection-customer">
        <select
          id="collection-customer"
          className={`inp ${invalid === 'customer' ? 'invalid' : ''}`}
          value={form.customer_id ?? ''}
          disabled={mode === 'edit'}
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

      <Field label="Descrição *" htmlFor="collection-description">
        <input
          id="collection-description"
          className={`inp ${invalid === 'description' ? 'invalid' : ''}`}
          value={form.description}
          placeholder={isMaterial ? 'Ex.: Papelão misturado' : 'Ex.: Coleta de entulho residencial'}
          onChange={(e) => set('description', e.target.value)}
        />
      </Field>

      {isMaterial && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Tipo de material" htmlFor="collection-material">
            <select
              id="collection-material"
              className="inp"
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
          </Field>
          <Field label="Peso (kg)" htmlFor="collection-weight">
            <input
              id="collection-weight"
              className="inp mono"
              inputMode="decimal"
              placeholder="0,00"
              value={weightText}
              onChange={(e) => setWeightText(e.target.value)}
            />
          </Field>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label={isMaterial ? 'Valor pago (R$) *' : 'Valor cobrado (R$) *'} htmlFor="collection-amount">
          <input
            id="collection-amount"
            className={`inp mono ${invalid === 'amount' ? 'invalid' : ''}`}
            inputMode="decimal"
            placeholder="0,00"
            value={amountText}
            onChange={(e) => {
              setAmountText(e.target.value)
              setInvalid(null)
            }}
          />
        </Field>
        <Field label="Data da coleta" htmlFor="collection-date">
          <input
            id="collection-date"
            type="date"
            className="inp"
            value={form.collected_at}
            onChange={(e) => set('collected_at', e.target.value)}
          />
        </Field>
      </div>

      <Field label="Agendamento" htmlFor="collection-schedule">
        <input
          id="collection-schedule"
          type="datetime-local"
          className="inp"
          value={form.scheduled_at ?? ''}
          onChange={(e) => set('scheduled_at', e.target.value)}
        />
      </Field>

      <Field label="Observações" htmlFor="collection-notes">
        <textarea
          id="collection-notes"
          className="inp"
          rows={3}
          value={form.notes ?? ''}
          onChange={(e) => set('notes', e.target.value)}
        />
      </Field>
    </Modal>
  )
}
