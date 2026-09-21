import {
  appointmentKindLabels,
  appointmentStatusLabels,
  buildReminderMessage,
  reminderChannelLabels,
  type AppointmentStatus,
  type AppointmentWithDetails,
} from '../../../shared/appointment'

type Props = {
  appointments: AppointmentWithDetails[]
  onEdit: (appointment: AppointmentWithDetails) => void
  onDelete: (appointment: AppointmentWithDetails) => void
  onStatusChange: (appointment: AppointmentWithDetails, status: AppointmentStatus) => void
  onSendReminder: (appointment: AppointmentWithDetails) => void
}

function formatDateOnly(value: string) {
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
}

const statusClass: Record<AppointmentStatus, string> = {
  pendente: 'bg-amber-500/15 text-amber-500',
  confirmado: 'bg-sky-500/15 text-sky-500',
  em_rota: 'bg-violet-500/15 text-violet-500',
  concluido: 'bg-accent-soft text-accent',
  cancelado: 'bg-red-500/15 text-red-500',
}

function whatsappLink(a: AppointmentWithDetails) {
  if (!a.customer_phone) return null
  const digits = a.customer_phone.replace(/\D/g, '')
  const number = digits.length <= 11 ? `55${digits}` : digits
  return `https://wa.me/${number}?text=${encodeURIComponent(buildReminderMessage(a))}`
}

function reminderText(a: AppointmentWithDetails) {
  if (a.reminder_channel === 'nenhum') return '—'
  if (a.reminder_sent_at) return `${reminderChannelLabels[a.reminder_channel]} · enviado`
  if (a.reminder_error) return `${reminderChannelLabels[a.reminder_channel]} · falhou`
  return `${reminderChannelLabels[a.reminder_channel]} · ${a.reminder_hours_before}h antes`
}

export function AppointmentTable({ appointments, onEdit, onDelete, onStatusChange, onSendReminder }: Props) {
  if (appointments.length === 0) {
    return <p className="py-12 text-center text-sm">Nenhum agendamento encontrado.</p>
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[1100px] text-left text-sm">
        <thead className="bg-surface text-text-strong">
          <tr>
            <th className="px-4 py-3 font-medium">Data / hora</th>
            <th className="px-4 py-3 font-medium">Cliente</th>
            <th className="px-4 py-3 font-medium">Tipo</th>
            <th className="px-4 py-3 font-medium">Endereço</th>
            <th className="px-4 py-3 font-medium">Veículo</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Lembrete</th>
            <th className="px-4 py-3 font-medium" />
          </tr>
        </thead>
        <tbody>
          {appointments.map((a) => {
            const wa = whatsappLink(a)
            return (
              <tr key={a.id} className="border-t border-border transition-colors hover:bg-surface">
                <td className="px-4 py-3 whitespace-nowrap">
                  {formatDateOnly(a.scheduled_date)} · {a.scheduled_time}
                </td>
                <td className="px-4 py-3 text-text-strong">{a.customer_name}</td>
                <td className="px-4 py-3 whitespace-nowrap">{appointmentKindLabels[a.kind]}</td>
                <td className="px-4 py-3">{a.address || '—'}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {a.vehicle_plate ? `${a.vehicle_plate}${a.driver_name ? ` · ${a.driver_name}` : ''}` : '—'}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={a.status}
                    onChange={(e) => onStatusChange(a, e.target.value as AppointmentStatus)}
                    className={`rounded-full border-0 px-2 py-1 text-xs font-medium outline-none ${statusClass[a.status]}`}
                  >
                    {Object.entries(appointmentStatusLabels).map(([value, label]) => (
                      <option key={value} value={value} className="bg-bg text-text-strong">
                        {label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 whitespace-nowrap" title={a.reminder_error ?? undefined}>
                  {reminderText(a)}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {a.reminder_channel !== 'nenhum' && (
                    <button
                      type="button"
                      onClick={() => onSendReminder(a)}
                      className="mr-3 font-medium transition-colors hover:text-accent"
                    >
                      Enviar lembrete
                    </button>
                  )}
                  {wa && (
                    <a
                      href={wa}
                      target="_blank"
                      rel="noreferrer"
                      className="mr-3 font-medium transition-colors hover:text-accent"
                    >
                      WhatsApp
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => onEdit(a)}
                    className="mr-3 font-medium transition-colors hover:text-accent"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(a)}
                    className="font-medium transition-colors hover:text-red-500"
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
