import { useState, type FormEvent } from 'react'
import {
  appointmentKindLabels,
  appointmentStatusLabels,
  emptyAppointmentInput,
  reminderChannelLabels,
  yardAddress,
  type AppointmentInput,
  type AppointmentKind,
  type AppointmentStatus,
  type ReminderChannel,
  type Vehicle,
} from '../../../shared/appointment'
import type { Customer } from '../../../shared/customer'

type Props = {
  title: string
  initialValue?: AppointmentInput
  customers: Customer[]
  vehicles: Vehicle[]
  submitting?: boolean
  error?: string | null
  onSubmit: (input: AppointmentInput) => void
  onCancel: () => void
}

const fieldClass =
  'w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-strong outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20'
const labelClass = 'flex flex-col gap-1 text-left text-sm'

function customerAddress(c: Customer) {
  const line1 = [c.street, c.number].filter(Boolean).join(', ')
  const line2 = [c.neighborhood, [c.city, c.state].filter(Boolean).join('/')].filter(Boolean).join(' - ')
  return [line1, line2].filter(Boolean).join(' - ')
}

export function AppointmentFormModal({
  title,
  initialValue,
  customers,
  vehicles,
  submitting,
  error,
  onSubmit,
  onCancel,
}: Props) {
  const [form, setForm] = useState<AppointmentInput>(initialValue ?? emptyAppointmentInput)

  function set<K extends keyof AppointmentInput>(key: K, value: AppointmentInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleCustomerChange(customerId: number | null) {
    const customer = customers.find((c) => c.id === customerId)
    setForm((f) => ({
      ...f,
      customer_id: customerId,
      // Sugere o endereço cadastrado do cliente para coletas, sem sobrescrever o que já foi digitado.
      address: f.kind === 'coleta' && !f.address && customer ? customerAddress(customer) : f.address,
    }))
  }

  function handleKindChange(kind: AppointmentKind) {
    setForm((f) => ({ ...f, kind, address: kind === 'entrega' ? yardAddress : f.address === yardAddress ? '' : f.address }))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit(form)
  }

  const activeVehicles = vehicles.filter((v) => v.active || v.id === form.vehicle_id)
  const customer = customers.find((c) => c.id === form.customer_id)
  const missingContact =
    customer &&
    ((form.reminder_channel === 'email' && !customer.email) ||
      ((form.reminder_channel === 'sms' || form.reminder_channel === 'whatsapp') && !customer.phone))

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
                onChange={(e) => handleCustomerChange(e.target.value ? Number(e.target.value) : null)}
                required
              >
                <option value="">Selecione um cliente</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              Tipo *
              <select
                className={fieldClass}
                value={form.kind}
                onChange={(e) => handleKindChange(e.target.value as AppointmentKind)}
              >
                {Object.entries(appointmentKindLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className={labelClass}>
              Data *
              <input
                type="date"
                className={fieldClass}
                value={form.scheduled_date}
                onChange={(e) => set('scheduled_date', e.target.value)}
                required
              />
            </label>
            <label className={labelClass}>
              Horário *
              <input
                type="time"
                className={fieldClass}
                value={form.scheduled_time}
                onChange={(e) => set('scheduled_time', e.target.value)}
                required
              />
            </label>
            <label className={labelClass}>
              Status
              <select
                className={fieldClass}
                value={form.status}
                onChange={(e) => set('status', e.target.value as AppointmentStatus)}
              >
                {Object.entries(appointmentStatusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className={labelClass}>
            {form.kind === 'coleta' ? 'Endereço da coleta *' : 'Local de entrega'}
            <input
              className={fieldClass}
              value={form.address ?? ''}
              onChange={(e) => set('address', e.target.value)}
              required={form.kind === 'coleta'}
            />
          </label>

          <label className={labelClass}>
            Veículo / motorista
            <select
              className={fieldClass}
              value={form.vehicle_id ?? ''}
              onChange={(e) => set('vehicle_id', e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Sem veículo</option>
              {activeVehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plate}
                  {v.driver_name ? ` — ${v.driver_name}` : ''}
                  {v.description ? ` (${v.description})` : ''}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              Lembrete automático
              <select
                className={fieldClass}
                value={form.reminder_channel}
                onChange={(e) => set('reminder_channel', e.target.value as ReminderChannel)}
              >
                {Object.entries(reminderChannelLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              Enviar com antecedência (horas)
              <input
                type="number"
                min="1"
                step="1"
                className={fieldClass}
                value={form.reminder_hours_before}
                onChange={(e) => set('reminder_hours_before', Number(e.target.value))}
                disabled={form.reminder_channel === 'nenhum'}
              />
            </label>
          </div>
          {missingContact && (
            <p className="text-sm text-amber-500">
              Este cliente não tem {form.reminder_channel === 'email' ? 'e-mail' : 'telefone'} cadastrado; o lembrete
              não poderá ser enviado.
            </p>
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
