export type AppointmentKind = 'coleta' | 'entrega'
export type AppointmentStatus = 'pendente' | 'confirmado' | 'em_rota' | 'concluido' | 'cancelado'
export type ReminderChannel = 'nenhum' | 'whatsapp' | 'sms' | 'email'

export interface Vehicle {
  id: number
  plate: string
  description: string | null
  driver_name: string | null
  driver_phone: string | null
  active: number
  created_at: string
}

export type VehicleInput = Omit<Vehicle, 'id' | 'created_at' | 'active'> & { active: boolean }

export interface Appointment {
  id: number
  customer_id: number
  kind: AppointmentKind
  scheduled_date: string
  scheduled_time: string
  address: string | null
  vehicle_id: number | null
  status: AppointmentStatus
  reminder_channel: ReminderChannel
  reminder_hours_before: number
  reminder_sent_at: string | null
  reminder_error: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type AppointmentInput = Omit<
  Appointment,
  'id' | 'customer_id' | 'reminder_sent_at' | 'reminder_error' | 'created_at' | 'updated_at'
> & {
  customer_id: number | null
}

export interface AppointmentWithDetails extends Appointment {
  customer_name: string
  customer_phone: string | null
  customer_email: string | null
  vehicle_plate: string | null
  driver_name: string | null
}

export const emptyAppointmentInput: AppointmentInput = {
  customer_id: null,
  kind: 'coleta',
  scheduled_date: new Date().toISOString().slice(0, 10),
  scheduled_time: '09:00',
  address: '',
  vehicle_id: null,
  status: 'pendente',
  reminder_channel: 'nenhum',
  reminder_hours_before: 24,
  notes: '',
}

export const emptyVehicleInput: VehicleInput = {
  plate: '',
  description: '',
  driver_name: '',
  driver_phone: '',
  active: true,
}

export const appointmentKindLabels: Record<AppointmentKind, string> = {
  coleta: 'Coleta no cliente',
  entrega: 'Entrega no pátio',
}

export const appointmentStatusLabels: Record<AppointmentStatus, string> = {
  pendente: 'Pendente',
  confirmado: 'Confirmado',
  em_rota: 'Em rota',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
}

export const reminderChannelLabels: Record<ReminderChannel, string> = {
  nenhum: 'Sem lembrete',
  whatsapp: 'WhatsApp',
  sms: 'SMS',
  email: 'E-mail',
}

export const yardAddress = 'Pátio BEST WAY'

/** Mensagem de lembrete enviada ao cliente (usada pelo worker e pelo link de WhatsApp). */
export function buildReminderMessage(a: {
  customer_name: string
  kind: AppointmentKind
  scheduled_date: string
  scheduled_time: string
  address: string | null
}) {
  const [y, m, d] = a.scheduled_date.split('-')
  const date = `${d}/${m}/${y}`
  const what =
    a.kind === 'coleta'
      ? `a coleta de material${a.address ? ` em ${a.address}` : ''}`
      : 'a entrega/recebimento de material no nosso pátio'
  return `Olá, ${a.customer_name}! Lembrete BEST WAY: ${what} está agendada para ${date} às ${a.scheduled_time}. Para reagendar, responda esta mensagem.`
}
