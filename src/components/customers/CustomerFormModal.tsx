import { useState, type FormEvent } from 'react'
import { emptyCustomerInput, type CustomerInput } from '../../../shared/customer'

type Props = {
  title: string
  initialValue?: CustomerInput
  submitting?: boolean
  error?: string | null
  onSubmit: (input: CustomerInput) => void
  onCancel: () => void
}

const fieldClass =
  'w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-strong outline-none focus:border-accent'
const labelClass = 'flex flex-col gap-1 text-left text-sm'

export function CustomerFormModal({
  title,
  initialValue,
  submitting,
  error,
  onSubmit,
  onCancel,
}: Props) {
  const [form, setForm] = useState<CustomerInput>(initialValue ?? emptyCustomerInput)

  function set<K extends keyof CustomerInput>(key: K, value: CustomerInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-bg p-6 text-left shadow-lg">
        <h2 className="mb-4 text-xl font-medium text-text-strong">{title}</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr]">
            <label className={labelClass}>
              Nome completo *
              <input
                className={fieldClass}
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                required
                autoFocus
              />
            </label>
            <label className={labelClass}>
              Status
              <select
                className={fieldClass}
                value={form.status}
                onChange={(e) => set('status', e.target.value as CustomerInput['status'])}
              >
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              CPF / CNPJ
              <input
                className={fieldClass}
                value={form.document ?? ''}
                onChange={(e) => set('document', e.target.value)}
              />
            </label>
            <label className={labelClass}>
              Data de nascimento
              <input
                type="date"
                className={fieldClass}
                value={form.birth_date ?? ''}
                onChange={(e) => set('birth_date', e.target.value)}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              Telefone / WhatsApp
              <input
                className={fieldClass}
                value={form.phone ?? ''}
                onChange={(e) => set('phone', e.target.value)}
              />
            </label>
            <label className={labelClass}>
              Email
              <input
                type="email"
                className={fieldClass}
                value={form.email ?? ''}
                onChange={(e) => set('email', e.target.value)}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr_1fr]">
            <label className={labelClass}>
              Endereço
              <input
                className={fieldClass}
                value={form.street ?? ''}
                onChange={(e) => set('street', e.target.value)}
              />
            </label>
            <label className={labelClass}>
              Número
              <input
                className={fieldClass}
                value={form.number ?? ''}
                onChange={(e) => set('number', e.target.value)}
              />
            </label>
            <label className={labelClass}>
              Complemento
              <input
                className={fieldClass}
                value={form.complement ?? ''}
                onChange={(e) => set('complement', e.target.value)}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              Bairro
              <input
                className={fieldClass}
                value={form.neighborhood ?? ''}
                onChange={(e) => set('neighborhood', e.target.value)}
              />
            </label>
            <label className={labelClass}>
              CEP
              <input
                className={fieldClass}
                value={form.zip_code ?? ''}
                onChange={(e) => set('zip_code', e.target.value)}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr]">
            <label className={labelClass}>
              Cidade
              <input
                className={fieldClass}
                value={form.city ?? ''}
                onChange={(e) => set('city', e.target.value)}
              />
            </label>
            <label className={labelClass}>
              Estado
              <input
                className={fieldClass}
                value={form.state ?? ''}
                onChange={(e) => set('state', e.target.value)}
                maxLength={2}
              />
            </label>
          </div>

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
              className="rounded-md border border-border px-4 py-2 text-sm hover:bg-surface"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {submitting ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
