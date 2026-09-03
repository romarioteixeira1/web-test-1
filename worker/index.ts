import { Hono } from 'hono'
import type { Customer, CustomerInput, CustomerStats, CustomerStatus } from '../shared/customer'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

function normalize(body: Partial<CustomerInput>): Omit<CustomerInput, 'name'> & { name: string } {
  const status: CustomerStatus = body.status === 'inactive' ? 'inactive' : 'active'
  return {
    name: body.name?.trim() ?? '',
    document: body.document?.trim() || null,
    birth_date: body.birth_date?.trim() || null,
    phone: body.phone?.trim() || null,
    email: body.email?.trim() || null,
    street: body.street?.trim() || null,
    number: body.number?.trim() || null,
    complement: body.complement?.trim() || null,
    neighborhood: body.neighborhood?.trim() || null,
    city: body.city?.trim() || null,
    state: body.state?.trim() || null,
    zip_code: body.zip_code?.trim() || null,
    notes: body.notes?.trim() || null,
    status,
  }
}

app.get('/api/customers', async (c) => {
  const q = c.req.query('q')?.trim()
  const statement = q
    ? c.env.DB.prepare(
        'SELECT * FROM customers WHERE name LIKE ?1 OR email LIKE ?1 OR document LIKE ?1 ORDER BY name',
      ).bind(`%${q}%`)
    : c.env.DB.prepare('SELECT * FROM customers ORDER BY name')

  const { results } = await statement.all<Customer>()
  return c.json(results)
})

app.get('/api/customers/stats', async (c) => {
  const [totals, recent] = await Promise.all([
    c.env.DB.prepare(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active,
         SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) AS inactive
       FROM customers`,
    ).first<{ total: number; active: number | null; inactive: number | null }>(),
    c.env.DB.prepare('SELECT * FROM customers ORDER BY created_at DESC LIMIT 5').all<Customer>(),
  ])

  const stats: CustomerStats = {
    total: totals?.total ?? 0,
    active: totals?.active ?? 0,
    inactive: totals?.inactive ?? 0,
    recent: recent.results,
  }

  return c.json(stats)
})

app.get('/api/customers/:id', async (c) => {
  const id = c.req.param('id')
  const customer = await c.env.DB.prepare('SELECT * FROM customers WHERE id = ?')
    .bind(id)
    .first<Customer>()

  if (!customer) return c.json({ error: 'Cliente não encontrado' }, 404)
  return c.json(customer)
})

app.post('/api/customers', async (c) => {
  const body = normalize(await c.req.json<Partial<CustomerInput>>())
  if (!body.name) return c.json({ error: 'Nome é obrigatório' }, 400)

  const result = await c.env.DB.prepare(
    `INSERT INTO customers
       (name, document, birth_date, phone, email, street, number, complement, neighborhood, city, state, zip_code, notes, status)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)`,
  )
    .bind(
      body.name,
      body.document,
      body.birth_date,
      body.phone,
      body.email,
      body.street,
      body.number,
      body.complement,
      body.neighborhood,
      body.city,
      body.state,
      body.zip_code,
      body.notes,
      body.status,
    )
    .run()

  const customer = await c.env.DB.prepare('SELECT * FROM customers WHERE id = ?')
    .bind(result.meta.last_row_id)
    .first<Customer>()

  return c.json(customer, 201)
})

app.put('/api/customers/:id', async (c) => {
  const id = c.req.param('id')
  const body = normalize(await c.req.json<Partial<CustomerInput>>())
  if (!body.name) return c.json({ error: 'Nome é obrigatório' }, 400)

  const { meta } = await c.env.DB.prepare(
    `UPDATE customers
     SET name = ?1, document = ?2, birth_date = ?3, phone = ?4, email = ?5, street = ?6,
         number = ?7, complement = ?8, neighborhood = ?9, city = ?10, state = ?11,
         zip_code = ?12, notes = ?13, status = ?14, updated_at = datetime('now')
     WHERE id = ?15`,
  )
    .bind(
      body.name,
      body.document,
      body.birth_date,
      body.phone,
      body.email,
      body.street,
      body.number,
      body.complement,
      body.neighborhood,
      body.city,
      body.state,
      body.zip_code,
      body.notes,
      body.status,
      id,
    )
    .run()

  if (meta.changes === 0) return c.json({ error: 'Cliente não encontrado' }, 404)

  const customer = await c.env.DB.prepare('SELECT * FROM customers WHERE id = ?')
    .bind(id)
    .first<Customer>()

  return c.json(customer)
})

app.delete('/api/customers/:id', async (c) => {
  const id = c.req.param('id')
  const { meta } = await c.env.DB.prepare('DELETE FROM customers WHERE id = ?').bind(id).run()

  if (meta.changes === 0) return c.json({ error: 'Cliente não encontrado' }, 404)
  return c.body(null, 204)
})

export default app
