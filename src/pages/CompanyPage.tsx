import { useState } from 'react'
import * as api from '../api/company'
import { useApp } from '../app/context'
import { CompanyFormModal } from '../components/company/CompanyFormModal'
import { IconBuilding, IconEdit, IconPlus } from '../components/layout/icons'
import { Hero } from '../components/ui/Hero'
import { Loading } from '../components/ui/ListCard'
import { emptyCompanyInput, type Company, type CompanyInput } from '../../shared/company'
import { dateOnly, errorMessage, share, todayIso } from '../lib/format'

const DAY_MS = 24 * 60 * 60 * 1000

export function CompanyPage() {
  const { company, setCompany, toast } = useApp()
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  if (company === undefined) return <Loading />

  async function handleSubmit(input: CompanyInput) {
    setSubmitting(true)
    setFormError(null)
    try {
      setCompany(await api.saveCompany(input))
      toast(company ? 'Cadastro da empresa atualizado' : 'Empresa cadastrada')
      setModalOpen(false)
    } catch (err) {
      setFormError(errorMessage(err, 'Falha ao salvar empresa'))
    } finally {
      setSubmitting(false)
    }
  }

  const fields = Object.keys(emptyCompanyInput) as (keyof CompanyInput)[]
  const filled = fields.filter((key) => company?.[key]).length
  const license = licenseStatus(company?.license_expires_at ?? null)

  return (
    <div className="page">
      <Hero
        chip="ECOCONTROL · CADASTROS"
        title={company?.trade_name ?? 'Minha empresa'}
        subtitle={
          company
            ? 'Dados da sua empresa de reciclagem. Mantenha-os atualizados.'
            : 'Sua empresa ainda não foi cadastrada no EcoControl.'
        }
        stats={
          company
            ? [
                {
                  label: 'Cadastro preenchido',
                  value: `${Math.round((filled / fields.length) * 100)}%`,
                  share: share(filled, fields.length),
                },
                { label: 'Licença ambiental', value: license.label, share: license.share, negative: license.expired },
              ]
            : undefined
        }
      />

      {company ? (
        <section className="card">
          <div className="card-head">
            <div className="card-title">
              <h2>Dados da empresa</h2>
            </div>
            <button type="button" className="btn" onClick={() => setModalOpen(true)}>
              <IconEdit size={16} />
              Editar cadastro
            </button>
          </div>
          <div className="card-body flex flex-col gap-5">
            <InfoGroup
              items={[
                ['Nome fantasia', company.trade_name],
                ['Razão social', company.legal_name],
                ['CNPJ', company.cnpj, true],
                ['Inscrição estadual', company.state_registration, true],
                ['Telefone / WhatsApp', company.phone, true],
                ['E-mail', company.email],
              ]}
            />
            <InfoGroup
              title="Endereço"
              items={[
                ['Rua', [company.street, company.number].filter(Boolean).join(', ')],
                ['Complemento', company.complement],
                ['Bairro', company.neighborhood],
                ['Cidade / UF', [company.city, company.state].filter(Boolean).join(' / ')],
                ['CEP', company.zip_code, true],
              ]}
            />
            <InfoGroup
              title="Licença ambiental"
              items={[
                ['Nº da licença de operação', company.license_number, true],
                ['Órgão emissor', company.license_agency],
                ['Validade', company.license_expires_at && dateOnly(company.license_expires_at), true],
              ]}
            />
            {company.notes && <InfoGroup title="Observações" items={[['', company.notes]]} />}
          </div>
        </section>
      ) : (
        <section className="card card-body flex flex-col items-center gap-3 py-12 text-center">
          <span className="badge tone-green">
            <IconBuilding size={22} />
          </span>
          <h2 className="text-lg font-semibold text-ink">Nenhuma empresa cadastrada</h2>
          <p className="max-w-md text-sm text-muted">
            Informe nome, CNPJ, endereço e licença ambiental da sua empresa. Esses dados aparecem nos comprovantes.
          </p>
          <button type="button" className="btn mt-2" onClick={() => setModalOpen(true)}>
            <IconPlus size={16} />
            Cadastre sua empresa aqui
          </button>
        </section>
      )}

      {modalOpen && (
        <CompanyFormModal
          mode={company ? 'edit' : 'create'}
          initialValue={company ? toInput(company) : undefined}
          submitting={submitting}
          error={formError}
          onSubmit={handleSubmit}
          onCancel={() => {
            setModalOpen(false)
            setFormError(null)
          }}
        />
      )}
    </div>
  )
}

type InfoItem = [label: string, value: string | null | undefined, mono?: boolean]

function InfoGroup({ title, items }: { title?: string; items: InfoItem[] }) {
  return (
    <div className="flex flex-col gap-3">
      {title && <span className="form-section">{title}</span>}
      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(([label, value, mono]) => (
          <div key={label || 'value'} className="flex min-w-0 flex-col gap-1">
            {label && <dt className="lbl">{label}</dt>}
            <dd className={`break-words text-sm ${value ? 'text-ink' : 'text-muted'} ${mono && value ? 'mono' : ''}`}>
              {value || '—'}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function toInput(company: Company): CompanyInput {
  const input = { ...emptyCompanyInput }
  for (const key of Object.keys(input) as (keyof CompanyInput)[]) input[key] = company[key] ?? ''
  return input
}

function licenseStatus(expiresAt: string | null) {
  if (!expiresAt) return { label: '—', share: 0, expired: false }
  const days = Math.round((Date.parse(expiresAt) - Date.parse(todayIso())) / DAY_MS)
  if (days < 0) return { label: 'Vencida', share: 100, expired: true }
  if (days <= 60) return { label: `${days} dias`, share: share(days, 60), expired: false }
  return { label: `até ${dateOnly(expiresAt)}`, share: 100, expired: false }
}
