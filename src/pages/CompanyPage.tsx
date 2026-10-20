import { useState, type FormEvent } from 'react'
import * as api from '../api/company'
import { useApp } from '../app/context'
import { Hero } from '../components/ui/Hero'
import { Loading } from '../components/ui/ListCard'
import { Field } from '../components/ui/Modal'
import { emptyCompanyInput, type Company, type CompanyInput } from '../../shared/company'
import { dateOnly, errorMessage, share, todayIso } from '../lib/format'

const DAY_MS = 24 * 60 * 60 * 1000

export function CompanyPage() {
  const { company } = useApp()
  if (company === undefined) return <Loading />
  // Keyed so the form restarts from the saved data when the company is first registered.
  return <CompanyForm key={company ? 'saved' : 'new'} company={company} />
}

function CompanyForm({ company }: { company: Company | null }) {
  const { setCompany, toast } = useApp()
  const [form, setForm] = useState<CompanyInput>(() => toInput(company))
  const [nameMissing, setNameMissing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof CompanyInput>(key: K, value: CompanyInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.trade_name.trim()) {
      setNameMissing(true)
      document.getElementById('company-name')?.focus()
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const saved = await api.saveCompany(form)
      setCompany(saved)
      setForm(toInput(saved))
      toast(company ? 'Dados da empresa salvos' : 'Empresa cadastrada')
    } catch (err) {
      setError(errorMessage(err, 'Falha ao salvar empresa'))
    } finally {
      setSubmitting(false)
    }
  }

  const fields = Object.keys(emptyCompanyInput) as (keyof CompanyInput)[]
  const filled = fields.filter((key) => company?.[key]).length
  const percent = Math.round((filled / fields.length) * 100)
  const license = licenseStatus(company?.license_expires_at ?? null)

  return (
    <div className="page">
      <Hero
        chip="ECOCONTROL · CADASTROS"
        title={company?.trade_name ?? 'Cadastre sua empresa'}
        subtitle={
          company
            ? 'Dados da sua empresa de reciclagem. Mantenha-os atualizados.'
            : 'Informe os dados da sua empresa de reciclagem para começar a usar o EcoControl.'
        }
        stats={[
          { label: 'Cadastro preenchido', value: `${percent}%`, share: share(filled, fields.length) },
          { label: 'Licença ambiental', value: license.label, share: license.share, negative: license.expired },
        ]}
      />

      <form className="card" onSubmit={handleSubmit} noValidate>
        <div className="card-head">
          <div className="card-title">
            <h2>Dados da empresa</h2>
          </div>
          <span className="hint">Campos com * são obrigatórios.</span>
        </div>

        <div className="card-body flex flex-col gap-4">
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
        </div>

        {(nameMissing || error) && (
          <p className="form-error" role="alert">
            {nameMissing ? 'Preencha o nome fantasia antes de salvar.' : error}
          </p>
        )}
        <div className="modal-foot">
          <button type="submit" className="btn" disabled={submitting}>
            {submitting ? 'Salvando…' : company ? 'Salvar alterações' : 'Cadastrar empresa'}
          </button>
        </div>
      </form>
    </div>
  )
}

function toInput(company: Company | null): CompanyInput {
  if (!company) return emptyCompanyInput
  const input = { ...emptyCompanyInput }
  for (const key of Object.keys(input) as (keyof CompanyInput)[]) input[key] = company[key] ?? ''
  return input
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

function licenseStatus(expiresAt: string | null) {
  if (!expiresAt) return { label: '—', share: 0, expired: false }
  const days = Math.round((Date.parse(expiresAt) - Date.parse(todayIso())) / DAY_MS)
  if (days < 0) return { label: 'Vencida', share: 100, expired: true }
  if (days <= 60) return { label: `${days} dias`, share: share(days, 60), expired: false }
  return { label: `até ${dateOnly(expiresAt)}`, share: 100, expired: false }
}
