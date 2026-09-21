import { useState, type FormEvent } from 'react'
import { emptyVehicleInput, type VehicleInput } from '../../../shared/appointment'

type Props = {
  title: string
  initialValue?: VehicleInput
  submitting?: boolean
  error?: string | null
  onSubmit: (input: VehicleInput) => void
  onCancel: () => void
}

const fieldClass =
  'w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-strong outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20'
const labelClass = 'flex flex-col gap-1 text-left text-sm'

export function VehicleFormModal({ title, initialValue, submitting, error, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<VehicleInput>(initialValue ?? emptyVehicleInput)

  function set<K extends keyof VehicleInput>(key: K, value: VehicleInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <div className="animate-fade-in fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4">
      <div className="animate-scale-in max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-bg p-6 text-left shadow-xl">
        <h2 className="mb-4 text-xl font-medium text-text-strong">{title}</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              Placa *
              <input
                className={fieldClass}
                value={form.plate}
                onChange={(e) => set('plate', e.target.value)}
                required
              />
            </label>
            <label className={labelClass}>
              Descrição
              <input
                className={fieldClass}
                value={form.description ?? ''}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Ex.: Caminhão baú"
              />
            </label>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              Motorista
              <input
                className={fieldClass}
                value={form.driver_name ?? ''}
                onChange={(e) => set('driver_name', e.target.value)}
              />
            </label>
            <label className={labelClass}>
              Telefone do motorista
              <input
                className={fieldClass}
                value={form.driver_phone ?? ''}
                onChange={(e) => set('driver_phone', e.target.value)}
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} />
            Veículo ativo
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
