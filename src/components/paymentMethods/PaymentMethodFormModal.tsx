import { useState } from 'react'
import {
  emptyPaymentMethodInput,
  paymentKindLabels,
  type PaymentKind,
  type PaymentMethodInput,
} from '../../../shared/payment-method'
import { ChoiceGroup, Field, Modal } from '../ui/Modal'

const kindOptions = Object.entries(paymentKindLabels) as [PaymentKind, string][]

type Props = {
  mode: 'create' | 'edit'
  initialValue?: PaymentMethodInput
  submitting?: boolean
  error?: string | null
  onSubmit: (input: PaymentMethodInput) => void
  onCancel: () => void
}

export function PaymentMethodFormModal({ mode, initialValue, submitting, error, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<PaymentMethodInput>(initialValue ?? emptyPaymentMethodInput)
  const [daysText, setDaysText] = useState(String(form.term_days || ''))
  const [nameMissing, setNameMissing] = useState(false)

  function set<K extends keyof PaymentMethodInput>(key: K, value: PaymentMethodInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleSubmit() {
    if (!form.name.trim()) {
      setNameMissing(true)
      document.getElementById('payment-name')?.focus()
      return
    }
    const days = Number.parseInt(daysText, 10)
    onSubmit({ ...form, term_days: form.kind === 'a_prazo' && days > 0 ? days : 0 })
  }

  return (
    <Modal
      title={mode === 'edit' ? 'Editar forma de pagamento' : 'Nova forma de pagamento'}
      submitLabel={mode === 'edit' ? 'Salvar alterações' : 'Cadastrar'}
      submitting={submitting}
      error={nameMissing ? 'Preencha o nome antes de salvar.' : error}
      onSubmit={handleSubmit}
      onClose={onCancel}
    >
      <Field label="Nome *" htmlFor="payment-name">
        <input
          id="payment-name"
          className={`inp ${nameMissing ? 'invalid' : ''}`}
          value={form.name}
          placeholder="Ex.: Boleto, Cheque…"
          onChange={(e) => {
            set('name', e.target.value)
            setNameMissing(false)
          }}
        />
      </Field>

      <div className="field">
        <span className="lbl">Pagamento</span>
        <ChoiceGroup label="Pagamento" value={form.kind} options={kindOptions} onChange={(v) => set('kind', v)} />
      </div>

      {form.kind === 'a_prazo' && (
        <Field label="Prazo (dias)" htmlFor="payment-days">
          <input
            id="payment-days"
            className="inp mono"
            inputMode="numeric"
            placeholder="30"
            value={daysText}
            onChange={(e) => setDaysText(e.target.value.replace(/\D/g, ''))}
          />
        </Field>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="check">
          <input
            type="checkbox"
            checked={form.use_purchases}
            onChange={(e) => set('use_purchases', e.target.checked)}
          />
          Usar em compras
        </label>
        <label className="check">
          <input type="checkbox" checked={form.use_sales} onChange={(e) => set('use_sales', e.target.checked)} />
          Usar em vendas
        </label>
      </div>
    </Modal>
  )
}
