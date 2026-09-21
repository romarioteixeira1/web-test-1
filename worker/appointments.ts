import { Hono } from 'hono'
import {
  buildReminderMessage,
  type AppointmentInput,
  type AppointmentKind,
  type AppointmentStatus,
  type AppointmentWithDetails,
  type ReminderChannel,
  type Vehicle,
  type VehicleInput,
} from '../shared/appointment'

export type AppointmentBindings = {
  DB: D1Database
  // Provedores de lembrete (opcionais). Sem eles o lembrete fica registrado como erro.
  RESEND_API_KEY?: string
  MAIL_FROM?: string
  TWILIO_ACCOUNT_SID?: string
  TWILIO_AUTH_TOKEN?: string
  TWILIO_SMS_FROM?: string
  TWILIO_WHATSAPP_FROM?: string
}

const kinds: AppointmentKind[] = ['coleta', 'entrega']
const statuses: AppointmentStatus[] = ['pendente', 'confirmado', 'em_rota', 'concluido', 'cancelado']
const channels: ReminderChannel[] = ['nenhum', 'whatsapp', 'sms', 'email']

// Horário de Brasília (UTC-3, sem horário de verão).
const TZ_OFFSET = '-03:00'

export const appointments = new Hono<{ Bindings: AppointmentBindings }>()

function normalizeAppointment(body: Partial<AppointmentInput>): AppointmentInput {
  const kind = kinds.includes(body.kind as AppointmentKind) ? (body.kind as AppointmentKind) : 'coleta'
  const status = statuses.includes(body.status as AppointmentStatus)
    ? (body.status as AppointmentStatus)
    : 'pendente'
  const reminder_channel = channels.includes(body.reminder_channel as ReminderChannel)
    ? (body.reminder_channel as ReminderChannel)
    : 'nenhum'
  const hours = Number(body.reminder_hours_before)

  return {
    customer_id: body.customer_id ? Number(body.customer_id) : null,
    kind,
    scheduled_date: body.scheduled_date?.trim() ?? '',
    scheduled_time: body.scheduled_time?.trim() ?? '',
    address: body.address?.trim() || null,
    vehicle_id: body.vehicle_id ? Number(body.vehicle_id) : null,
    status,
    reminder_channel,
    reminder_hours_before: Number.isFinite(hours) && hours > 0 ? Math.round(hours) : 24,
    notes: body.notes?.trim() || null,
  }
}

function validateAppointment(body: AppointmentInput): string | null {
  if (!body.customer_id) return 'Cliente é obrigatório'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.scheduled_date)) return 'Data inválida'
  if (!/^\d{2}:\d{2}$/.test(body.scheduled_time)) return 'Horário inválido'
  if (body.kind === 'coleta' && !body.address) return 'Endereço é obrigatório para coleta'
  return null
}

const appointmentSelect = `
  SELECT a.*, c.name AS customer_name, c.phone AS customer_phone, c.email AS customer_email,
         v.plate AS vehicle_plate, v.driver_name AS driver_name
  FROM appointments a
  JOIN customers c ON c.id = a.customer_id
  LEFT JOIN vehicles v ON v.id = a.vehicle_id
`

/** Motorista/veículo não pode ter dois agendamentos ativos no mesmo dia e horário. */
async function vehicleConflict(db: D1Database, body: AppointmentInput, ignoreId?: string) {
  if (!body.vehicle_id || body.status === 'cancelado') return null
  return db
    .prepare(
      `SELECT id FROM appointments
       WHERE vehicle_id = ?1 AND scheduled_date = ?2 AND scheduled_time = ?3
         AND status != 'cancelado' AND id != ?4`,
    )
    .bind(body.vehicle_id, body.scheduled_date, body.scheduled_time, ignoreId ?? 0)
    .first()
}

appointments.get('/api/appointments', async (c) => {
  const { from, to, status, customer_id, vehicle_id } = c.req.query()
  const clauses: string[] = []
  const params: (string | number)[] = []

  if (from) {
    clauses.push('a.scheduled_date >= ?')
    params.push(from)
  }
  if (to) {
    clauses.push('a.scheduled_date <= ?')
    params.push(to)
  }
  if (status) {
    clauses.push('a.status = ?')
    params.push(status)
  }
  if (customer_id) {
    clauses.push('a.customer_id = ?')
    params.push(customer_id)
  }
  if (vehicle_id) {
    clauses.push('a.vehicle_id = ?')
    params.push(vehicle_id)
  }

  let sql = appointmentSelect
  if (clauses.length) sql += ` WHERE ${clauses.join(' AND ')}`
  sql += ' ORDER BY a.scheduled_date, a.scheduled_time, a.id'

  const statement = params.length ? c.env.DB.prepare(sql).bind(...params) : c.env.DB.prepare(sql)
  const { results } = await statement.all<AppointmentWithDetails>()
  return c.json(results)
})

appointments.get('/api/appointments/:id', async (c) => {
  const row = await c.env.DB.prepare(`${appointmentSelect} WHERE a.id = ?`)
    .bind(c.req.param('id'))
    .first<AppointmentWithDetails>()
  if (!row) return c.json({ error: 'Agendamento não encontrado' }, 404)
  return c.json(row)
})

appointments.post('/api/appointments', async (c) => {
  const body = normalizeAppointment(await c.req.json<Partial<AppointmentInput>>())
  const invalid = validateAppointment(body)
  if (invalid) return c.json({ error: invalid }, 400)

  const customer = await c.env.DB.prepare('SELECT id FROM customers WHERE id = ?').bind(body.customer_id).first()
  if (!customer) return c.json({ error: 'Cliente não encontrado' }, 404)
  if (await vehicleConflict(c.env.DB, body)) {
    return c.json({ error: 'Veículo já possui agendamento nesse dia e horário' }, 409)
  }

  const result = await c.env.DB.prepare(
    `INSERT INTO appointments
       (customer_id, kind, scheduled_date, scheduled_time, address, vehicle_id, status,
        reminder_channel, reminder_hours_before, notes)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`,
  )
    .bind(
      body.customer_id,
      body.kind,
      body.scheduled_date,
      body.scheduled_time,
      body.address,
      body.vehicle_id,
      body.status,
      body.reminder_channel,
      body.reminder_hours_before,
      body.notes,
    )
    .run()

  const row = await c.env.DB.prepare(`${appointmentSelect} WHERE a.id = ?`)
    .bind(result.meta.last_row_id)
    .first<AppointmentWithDetails>()
  return c.json(row, 201)
})

appointments.put('/api/appointments/:id', async (c) => {
  const id = c.req.param('id')
  const body = normalizeAppointment(await c.req.json<Partial<AppointmentInput>>())
  const invalid = validateAppointment(body)
  if (invalid) return c.json({ error: invalid }, 400)
  if (await vehicleConflict(c.env.DB, body, id)) {
    return c.json({ error: 'Veículo já possui agendamento nesse dia e horário' }, 409)
  }

  // Reagendar (data, hora ou canal) reinicia o controle do lembrete.
  const { meta } = await c.env.DB.prepare(
    `UPDATE appointments
     SET customer_id = ?1, kind = ?2, address = ?5, vehicle_id = ?6, status = ?7, notes = ?10,
         reminder_hours_before = ?9,
         reminder_sent_at = CASE WHEN scheduled_date = ?3 AND scheduled_time = ?4 AND reminder_channel = ?8
                                 THEN reminder_sent_at ELSE NULL END,
         reminder_error = CASE WHEN scheduled_date = ?3 AND scheduled_time = ?4 AND reminder_channel = ?8
                               THEN reminder_error ELSE NULL END,
         scheduled_date = ?3, scheduled_time = ?4, reminder_channel = ?8,
         updated_at = datetime('now')
     WHERE id = ?11`,
  )
    .bind(
      body.customer_id,
      body.kind,
      body.scheduled_date,
      body.scheduled_time,
      body.address,
      body.vehicle_id,
      body.status,
      body.reminder_channel,
      body.reminder_hours_before,
      body.notes,
      id,
    )
    .run()

  if (meta.changes === 0) return c.json({ error: 'Agendamento não encontrado' }, 404)

  const row = await c.env.DB.prepare(`${appointmentSelect} WHERE a.id = ?`).bind(id).first<AppointmentWithDetails>()
  return c.json(row)
})

appointments.patch('/api/appointments/:id/status', async (c) => {
  const { status } = await c.req.json<{ status?: AppointmentStatus }>()
  if (!status || !statuses.includes(status)) return c.json({ error: 'Status inválido' }, 400)

  const { meta } = await c.env.DB.prepare(
    "UPDATE appointments SET status = ?1, updated_at = datetime('now') WHERE id = ?2",
  )
    .bind(status, c.req.param('id'))
    .run()
  if (meta.changes === 0) return c.json({ error: 'Agendamento não encontrado' }, 404)

  const row = await c.env.DB.prepare(`${appointmentSelect} WHERE a.id = ?`)
    .bind(c.req.param('id'))
    .first<AppointmentWithDetails>()
  return c.json(row)
})

appointments.delete('/api/appointments/:id', async (c) => {
  const { meta } = await c.env.DB.prepare('DELETE FROM appointments WHERE id = ?').bind(c.req.param('id')).run()
  if (meta.changes === 0) return c.json({ error: 'Agendamento não encontrado' }, 404)
  return c.body(null, 204)
})

appointments.post('/api/appointments/:id/reminder', async (c) => {
  const row = await c.env.DB.prepare(`${appointmentSelect} WHERE a.id = ?`)
    .bind(c.req.param('id'))
    .first<AppointmentWithDetails>()
  if (!row) return c.json({ error: 'Agendamento não encontrado' }, 404)
  if (row.reminder_channel === 'nenhum') return c.json({ error: 'Nenhum canal de lembrete definido' }, 400)

  const error = await deliverReminder(c.env, row)
  if (error) return c.json({ error }, 502)
  return c.json({ ok: true })
})

// --- Veículos / motoristas -------------------------------------------------

function normalizeVehicle(body: Partial<VehicleInput>) {
  return {
    plate: body.plate?.trim().toUpperCase() ?? '',
    description: body.description?.trim() || null,
    driver_name: body.driver_name?.trim() || null,
    driver_phone: body.driver_phone?.trim() || null,
    active: body.active === false ? 0 : 1,
  }
}

appointments.get('/api/vehicles', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM vehicles ORDER BY active DESC, plate').all<Vehicle>()
  return c.json(results)
})

appointments.post('/api/vehicles', async (c) => {
  const body = normalizeVehicle(await c.req.json<Partial<VehicleInput>>())
  if (!body.plate) return c.json({ error: 'Placa é obrigatória' }, 400)

  try {
    const result = await c.env.DB.prepare(
      'INSERT INTO vehicles (plate, description, driver_name, driver_phone, active) VALUES (?1, ?2, ?3, ?4, ?5)',
    )
      .bind(body.plate, body.description, body.driver_name, body.driver_phone, body.active)
      .run()
    const vehicle = await c.env.DB.prepare('SELECT * FROM vehicles WHERE id = ?')
      .bind(result.meta.last_row_id)
      .first<Vehicle>()
    return c.json(vehicle, 201)
  } catch {
    return c.json({ error: 'Já existe um veículo com essa placa' }, 409)
  }
})

appointments.put('/api/vehicles/:id', async (c) => {
  const id = c.req.param('id')
  const body = normalizeVehicle(await c.req.json<Partial<VehicleInput>>())
  if (!body.plate) return c.json({ error: 'Placa é obrigatória' }, 400)

  try {
    const { meta } = await c.env.DB.prepare(
      'UPDATE vehicles SET plate = ?1, description = ?2, driver_name = ?3, driver_phone = ?4, active = ?5 WHERE id = ?6',
    )
      .bind(body.plate, body.description, body.driver_name, body.driver_phone, body.active, id)
      .run()
    if (meta.changes === 0) return c.json({ error: 'Veículo não encontrado' }, 404)
    const vehicle = await c.env.DB.prepare('SELECT * FROM vehicles WHERE id = ?').bind(id).first<Vehicle>()
    return c.json(vehicle)
  } catch {
    return c.json({ error: 'Já existe um veículo com essa placa' }, 409)
  }
})

appointments.delete('/api/vehicles/:id', async (c) => {
  const { meta } = await c.env.DB.prepare('DELETE FROM vehicles WHERE id = ?').bind(c.req.param('id')).run()
  if (meta.changes === 0) return c.json({ error: 'Veículo não encontrado' }, 404)
  return c.body(null, 204)
})

// --- Lembretes automáticos -------------------------------------------------

function toE164BR(phone: string) {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10 || digits.length === 11) return `+55${digits}`
  return `+${digits}`
}

async function twilioSend(env: AppointmentBindings, to: string, from: string | undefined, body: string) {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !from) return 'Twilio não configurado'
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: to, From: from, Body: body }),
  })
  return res.ok ? null : `Twilio ${res.status}: ${(await res.text()).slice(0, 200)}`
}

async function emailSend(env: AppointmentBindings, to: string, subject: string, text: string) {
  if (!env.RESEND_API_KEY || !env.MAIL_FROM) return 'E-mail (Resend) não configurado'
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.MAIL_FROM, to, subject, text }),
  })
  return res.ok ? null : `Resend ${res.status}: ${(await res.text()).slice(0, 200)}`
}

/** Envia o lembrete e registra o resultado. Retorna a mensagem de erro, ou null se enviou. */
async function deliverReminder(env: AppointmentBindings, a: AppointmentWithDetails): Promise<string | null> {
  const message = buildReminderMessage(a)
  let error: string | null

  try {
    if (a.reminder_channel === 'email') {
      error = a.customer_email
        ? await emailSend(env, a.customer_email, 'Lembrete de agendamento - BEST WAY', message)
        : 'Cliente sem e-mail cadastrado'
    } else if (a.reminder_channel === 'sms' || a.reminder_channel === 'whatsapp') {
      if (!a.customer_phone) {
        error = 'Cliente sem telefone cadastrado'
      } else if (a.reminder_channel === 'sms') {
        error = await twilioSend(env, toE164BR(a.customer_phone), env.TWILIO_SMS_FROM, message)
      } else {
        const from = env.TWILIO_WHATSAPP_FROM
        error = await twilioSend(
          env,
          `whatsapp:${toE164BR(a.customer_phone)}`,
          from ? `whatsapp:${from.replace(/^whatsapp:/, '')}` : undefined,
          message,
        )
      }
    } else {
      error = 'Nenhum canal de lembrete definido'
    }
  } catch (err) {
    error = err instanceof Error ? err.message : 'Falha ao enviar lembrete'
  }

  await env.DB.prepare(
    `UPDATE appointments
     SET reminder_sent_at = CASE WHEN ?1 IS NULL THEN datetime('now') ELSE reminder_sent_at END,
         reminder_error = ?1
     WHERE id = ?2`,
  )
    .bind(error, a.id)
    .run()

  return error
}

/**
 * Executado pelo Cron Trigger (a cada 15 min): envia lembretes cujo momento
 * (horário do agendamento menos `reminder_hours_before`) já chegou.
 * Agendamentos com erro não são reenviados automaticamente; use o botão "Enviar lembrete".
 */
export async function sendDueReminders(env: AppointmentBindings) {
  const now = Date.now()
  const today = new Date(now - 3 * 3600_000).toISOString().slice(0, 10)

  const { results } = await env.DB.prepare(
    `${appointmentSelect}
     WHERE a.reminder_channel != 'nenhum' AND a.reminder_sent_at IS NULL AND a.reminder_error IS NULL
       AND a.status IN ('pendente', 'confirmado') AND a.scheduled_date >= ?`,
  )
    .bind(today)
    .all<AppointmentWithDetails>()

  for (const a of results) {
    const start = new Date(`${a.scheduled_date}T${a.scheduled_time}:00${TZ_OFFSET}`).getTime()
    if (Number.isNaN(start) || start <= now) continue
    if (now >= start - a.reminder_hours_before * 3600_000) await deliverReminder(env, a)
  }
}
