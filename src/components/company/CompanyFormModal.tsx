import { useState } from 'react'
import { emptyCompanyInput, type CompanyInput } from '../../../shared/company'
import { Field, Modal } from '../ui/Modal'

type Props = {
  mode: 'create' | 'edit'
  initialValue?: CompanyInput
  submitting?: boolean
  error?: string | null
  onSubmit: (input: CompanyInput) => void
  onCancel: () => void
}

export function CompanyFormModal({ mode, initialValue, submitting, error, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<CompanyInput>(initialValue ?? emptyCompanyInput)
  const [nameMissing, setNameMissing] = useState(false)

  function set<K extends keyof CompanyInput>(key: K, value: CompanyInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleSubmit() {
    if (!form.trade_name.trim()) {
      setNameMissing(true)
      document.getElementById('company-name')?.focus()
      return
    }
    onSubmit(form)
  }

  return (
    <Modal
      title={mode === 'edit' ? 'Editar cadastro da empresa' : 'Cadastrar empresa'}
      submitLabel={mode === 'edit' ? 'Salvar alterações' : 'Cadastrar empresa'}
      submitting={submitting}
      error={nameMissing ? 'Preencha o nome fantasia antes de salvar.' : error}
      wide
      onSubmit={handleSubmit}
      onClose={onCancel}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Nome fantasia *" htmlFor="company-name">
          <input
            id="company-name"
            className={`inp ${nameMissing ? 'invalid' : ''}`}
            value={form.trade_name}
            aria-invalid={nameMissing}
            placeholder="Ex.: Recicla Mais"
            onChange={(e) => {
              set('trade_name', e.target.value)
              setNameMissing(false)
            }}
          />
        </Field>
        <Field label="Razão social" htmlFor="company-legal">
          <input
            id="company-legal"
            className="inp"
            value={form.legal_name ?? ''}
            onChange={(e) => set('legal_name', e.target.value)}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="CNPJ" htmlFor="company-cnpj">
          <input
            id="company-cnpj"
            className="inp mono"
            inputMode="numeric"
            placeholder="00.000.000/0000-00"
            value={form.cnpj ?? ''}
            onChange={(e) => set('cnpj', formatCnpj(e.target.value))}
          />
        </Field>
        <Field label="Inscrição estadual" htmlFor="company-ie">
          <input
            id="company-ie"
            className="inp mono"
            value={form.state_registration ?? ''}
            onChange={(e) => set('state_registration', e.target.value)}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Telefone / WhatsApp" htmlFor="company-phone">
          <input
            id="company-phone"
            className="inp mono"
            inputMode="tel"
            value={form.phone ?? ''}
            onChange={(e) => set('phone', e.target.value)}
          />
        </Field>
        <Field label="E-mail" htmlFor="company-email">
          <input
            id="company-email"
            type="email"
            className="inp"
            value={form.email ?? ''}
            onChange={(e) => set('email', e.target.value)}
          />
        </Field>
      </div>

      <span className="form-section">Endereço</span>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[2fr_1fr_1fr]">
        <Field label="Rua" htmlFor="company-street">
          <input
            id="company-street"
            className="inp"
            value={form.street ?? ''}
            onChange={(e) => set('street', e.target.value)}
          />
        </Field>
        <Field label="Número" htmlFor="company-number">
          <input
            id="company-number"
            className="inp"
            value={form.number ?? ''}
            onChange={(e) => set('number', e.target.value)}
          />
        </Field>
        <Field label="Complemento" htmlFor="company-complement">
          <input
            id="company-complement"
            className="inp"
            value={form.complement ?? ''}
            onChange={(e) => set('complement', e.target.value)}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_140px_80px]">
        <Field label="Bairro" htmlFor="company-neighborhood">
          <input
            id="company-neighborhood"
            className="inp"
            value={form.neighborhood ?? ''}
            onChange={(e) => set('neighborhood', e.target.value)}
          />
        </Field>
        <Field label="Cidade" htmlFor="company-city">
          <input
            id="company-city"
            className="inp"
            value={form.city ?? ''}
            onChange={(e) => set('city', e.target.value)}
          />
        </Field>
        <Field label="CEP" htmlFor="company-zip">
          <input
            id="company-zip"
            className="inp mono"
            inputMode="numeric"
            value={form.zip_code ?? ''}
            onChange={(e) => set('zip_code', e.target.value)}
          />
        </Field>
        <Field label="UF" htmlFor="company-uf">
          <input
            id="company-uf"
            className="inp uppercase"
            maxLength={2}
            value={form.state ?? ''}
            onChange={(e) => set('state', e.target.value)}
          />
        </Field>
      </div>

      <span className="form-section">Licença ambiental</span>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Nº da licença de operação" htmlFor="company-license">
          <input
            id="company-license"
            className="inp mono"
            value={form.license_number ?? ''}
            onChange={(e) => set('license_number', e.target.value)}
          />
        </Field>
        <Field label="Órgão emissor" htmlFor="company-agency">
          <input
            id="company-agency"
            className="inp"
            placeholder="Ex.: CETESB, IBAMA"
            value={form.license_agency ?? ''}
            onChange={(e) => set('license_agency', e.target.value)}
          />
        </Field>
        <Field label="Validade" htmlFor="company-license-expires">
          <input
            id="company-license-expires"
            type="date"
            className="inp"
            value={form.license_expires_at ?? ''}
            onChange={(e) => set('license_expires_at', e.target.value)}
          />
        </Field>
      </div>

      <Field label="Observações" htmlFor="company-notes">
        <input
          id="company-notes"
          className="inp"
          value={form.notes ?? ''}
          onChange={(e) => set('notes', e.target.value)}
        />
      </Field>
    </Modal>
  )
}

/** 00.000.000/0000-00 while typing. */
function formatCnpj(value: string) {
  const d = value.replace(/\D/g, '').slice(0, 14)
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}
