import { Hono } from 'hono'
import type { Customer, CustomerInput } from '../shared/customer'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

function normalize(body: Partial<CustomerInput>): Omit<CustomerInput, 'name'> & { name: string } {
  return {
    name: body.name?.trim() ?? '',
    email: body.email?.trim() || null,
    phone: body.phone?.trim() || null,
    document: body.document?.trim() || null,
    street: body.street?.trim() || null,
    number: body.number?.trim() || null,
    city: body.city?.trim() || null,
    state: body.state?.trim() || null,
    zip_code: body.zip_code?.trim() || null,
    notes: body.notes?.trim() || null,
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
    `INSERT INTO customers (name, email, phone, document, street, number, city, state, zip_code, notes)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`,
  )
    .bind(
      body.name,
      body.email,
      body.phone,
      body.document,
      body.street,
      body.number,
      body.city,
      body.state,
      body.zip_code,
      body.notes,
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
     SET name = ?1, email = ?2, phone = ?3, document = ?4, street = ?5, number = ?6,
         city = ?7, state = ?8, zip_code = ?9, notes = ?10, updated_at = datetime('now')
     WHERE id = ?11`,
  )
    .bind(
      body.name,
      body.email,
      body.phone,
      body.document,
      body.street,
      body.number,
      body.city,
      body.state,
      body.zip_code,
      body.notes,
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
