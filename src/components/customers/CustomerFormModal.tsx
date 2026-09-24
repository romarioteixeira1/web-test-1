import { useState } from 'react'
import { emptyCustomerInput, type CustomerInput, type RelationshipType } from '../../../shared/customer'
import type { PaymentMethodRecord } from '../../../shared/payment-method'
import { ChoiceGroup, Field, Modal } from '../ui/Modal'

const relationshipOptions = [
  ['fornecedor', 'Fornecedor'],
  ['comprador', 'Comprador'],
  ['ambos', 'Ambos'],
] as const satisfies readonly (readonly [RelationshipType, string])[]

const personOptions = [
  ['fisica', 'Pessoa física'],
  ['juridica', 'Pessoa jurídica'],
] as const

type Props = {
  mode: 'create' | 'edit'
  initialValue?: CustomerInput
  paymentMethods: PaymentMethodRecord[]
  submitting?: boolean
  error?: string | null
  onSubmit: (input: CustomerInput) => void
  onCancel: () => void
}

export function CustomerFormModal({ mode, initialValue, paymentMethods, submitting, error, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<CustomerInput>(initialValue ?? { ...emptyCustomerInput, relationship_type: 'fornecedor' })
  const [nameMissing, setNameMissing] = useState(false)

  function set<K extends keyof CustomerInput>(key: K, value: CustomerInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleSubmit() {
    if (!form.name.trim()) {
      setNameMissing(true)
      document.getElementById('customer-name')?.focus()
      return
    }
    onSubmit({ ...form, state: form.state?.trim().toUpperCase().slice(0, 2) ?? '' })
  }

  const isJuridica = form.person_type === 'juridica'
  // Active methods, plus the customer's current one even if it was deactivated later.
  const methodOptions = paymentMethods.filter((m) => m.active || m.code === form.payment_method)

  return (
    <Modal
      title={mode === 'edit' ? 'Editar cliente' : 'Novo cliente'}
      submitLabel={mode === 'edit' ? 'Salvar alterações' : 'Cadastrar'}
      submitting={submitting}
      error={nameMissing ? 'Preencha o nome antes de salvar.' : error}
      wide
      onSubmit={handleSubmit}
      onClose={onCancel}
    >
      <ChoiceGroup
        label="Tipo de cliente"
        value={form.relationship_type}
        options={relationshipOptions}
        onChange={(v) => set('relationship_type', v)}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[2fr_1fr]">
        <Field label="Nome ou razão social *" htmlFor="customer-name">
          <input
            id="customer-name"
            className={`inp ${nameMissing ? 'invalid' : ''}`}
            value={form.name}
            aria-invalid={nameMissing}
            onChange={(e) => {
              set('name', e.target.value)
              setNameMissing(false)
            }}
          />
        </Field>
        <Field label="Status" htmlFor="customer-status">
          <select
            id="customer-status"
            className="inp"
            value={form.status}
            onChange={(e) => set('status', e.target.value as CustomerInput['status'])}
          >
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
          </select>
        </Field>
      </div>

      <ChoiceGroup
        label="Tipo de pessoa"
        value={form.person_type}
        options={personOptions}
        onChange={(v) => set('person_type', v)}
      />

      {isJuridica && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[2fr_1fr]">
          <Field label="Nome fantasia / razão social" htmlFor="customer-company">
            <input
              id="customer-company"
              className="inp"
              value={form.company_name ?? ''}
              onChange={(e) => set('company_name', e.target.value)}
            />
          </Field>
          <Field label="Inscrição estadual" htmlFor="customer-ie">
            <input
              id="customer-ie"
              className="inp mono"
              value={form.state_registration ?? ''}
              onChange={(e) => set('state_registration', e.target.value)}
            />
          </Field>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label={isJuridica ? 'CNPJ' : 'CPF'} htmlFor="customer-doc">
          <input
            id="customer-doc"
            className="inp mono"
            value={form.document ?? ''}
            onChange={(e) => set('document', e.target.value)}
          />
        </Field>
        <Field label="Telefone / WhatsApp" htmlFor="customer-phone">
          <input
            id="customer-phone"
            className="inp mono"
            inputMode="tel"
            value={form.phone ?? ''}
            onChange={(e) => set('phone', e.target.value)}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="E-mail" htmlFor="customer-email">
          <input
            id="customer-email"
            type="email"
            className="inp"
            value={form.email ?? ''}
            onChange={(e) => set('email', e.target.value)}
          />
        </Field>
        <Field label="Forma de pagamento preferida" htmlFor="customer-payment">
          <select
            id="customer-payment"
            className="inp"
            value={form.payment_method ?? ''}
            onChange={(e) => set('payment_method', e.target.value || null)}
          >
            <option value="">Não informado</option>
            {methodOptions.map((m) => (
              <option key={m.code} value={m.code}>
                {m.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <span className="form-section">Endereço</span>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[2fr_1fr_1fr]">
        <Field label="Rua" htmlFor="customer-street">
          <input
            id="customer-street"
            className="inp"
            value={form.street ?? ''}
            onChange={(e) => set('street', e.target.value)}
          />
        </Field>
        <Field label="Número" htmlFor="customer-number">
          <input
            id="customer-number"
            className="inp"
            value={form.number ?? ''}
            onChange={(e) => set('number', e.target.value)}
          />
        </Field>
        <Field label="Complemento" htmlFor="customer-complement">
          <input
            id="customer-complement"
            className="inp"
            value={form.complement ?? ''}
            onChange={(e) => set('complement', e.target.value)}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_140px_80px]">
        <Field label="Bairro" htmlFor="customer-neighborhood">
          <input
            id="customer-neighborhood"
            className="inp"
            value={form.neighborhood ?? ''}
            onChange={(e) => set('neighborhood', e.target.value)}
          />
        </Field>
        <Field label="Cidade" htmlFor="customer-city">
          <input
            id="customer-city"
            className="inp"
            value={form.city ?? ''}
            onChange={(e) => set('city', e.target.value)}
          />
        </Field>
        <Field label="CEP" htmlFor="customer-zip">
          <input
            id="customer-zip"
            className="inp mono"
            inputMode="numeric"
            value={form.zip_code ?? ''}
            onChange={(e) => set('zip_code', e.target.value)}
          />
        </Field>
        <Field label="UF" htmlFor="customer-uf">
          <input
            id="customer-uf"
            className="inp uppercase"
            maxLength={2}
            value={form.state ?? ''}
            onChange={(e) => set('state', e.target.value)}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_2fr]">
        <Field label="Data de nascimento" htmlFor="customer-birth">
          <input
            id="customer-birth"
            type="date"
            className="inp"
            value={form.birth_date ?? ''}
            onChange={(e) => set('birth_date', e.target.value)}
          />
        </Field>
        <Field label="Observações" htmlFor="customer-notes">
          <input
            id="customer-notes"
            className="inp"
            value={form.notes ?? ''}
            onChange={(e) => set('notes', e.target.value)}
          />
        </Field>
      </div>
    </Modal>
  )
}
