import { Hono, type Context } from 'hono'
import type {
  Customer,
  CustomerInput,
  CustomerStats,
  CustomerStatus,
  PaymentMethod,
  PersonType,
  RelationshipType,
} from '../shared/customer'
import type { CollectionInput, CollectionType, CollectionWithCustomer } from '../shared/collection'
import type { Company, CompanyInput } from '../shared/company'
import {
  materialCategories,
  type MaterialPriceInput,
  type MaterialStatus,
  type MaterialTypeInput,
  type MaterialWithPrice,
} from '../shared/material'
import type { PaymentKind, PaymentMethodInput, PaymentMethodRecord } from '../shared/payment-method'
import type {
  PaymentStatus,
  TransactionInput,
  TransactionType,
  TransactionWithDetails,
} from '../shared/transaction'
import type {
  CashFlowReport,
  CashFlowRow,
  CustomerReportRow,
  MaterialReportRow,
  PeriodReportRow,
  ReportGranularity,
} from '../shared/report'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

/** Returns the code only if it matches a registered payment method, so free text never reaches the database. */
async function knownPaymentCode(db: D1Database, code: unknown): Promise<PaymentMethod | null> {
  if (typeof code !== 'string' || !code.trim()) return null
  const row = await db.prepare('SELECT code FROM payment_methods WHERE code = ?').bind(code.trim()).first<{ code: string }>()
  return row?.code ?? null
}

async function withKnownPaymentCode<T extends { payment_method?: PaymentMethod | null }>(db: D1Database, body: T) {
  return { ...body, payment_method: await knownPaymentCode(db, body.payment_method) }
}

function normalize(body: Partial<CustomerInput>): Omit<CustomerInput, 'name'> & { name: string } {
  const status: CustomerStatus = body.status === 'inactive' ? 'inactive' : 'active'
  const person_type: PersonType = body.person_type === 'juridica' ? 'juridica' : 'fisica'
  const relationship_type: RelationshipType =
    body.relationship_type === 'fornecedor' || body.relationship_type === 'ambos'
      ? body.relationship_type
      : 'comprador'
  const payment_method = body.payment_method || null

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
    person_type,
    company_name: person_type === 'juridica' ? body.company_name?.trim() || null : null,
    state_registration: person_type === 'juridica' ? body.state_registration?.trim() || null : null,
    relationship_type,
    payment_method,
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
  const body = normalize(await withKnownPaymentCode(c.env.DB, await c.req.json<Partial<CustomerInput>>()))
  if (!body.name) return c.json({ error: 'Nome é obrigatório' }, 400)

  const result = await c.env.DB.prepare(
    `INSERT INTO customers
       (name, document, birth_date, phone, email, street, number, complement, neighborhood, city, state, zip_code,
        notes, status, person_type, company_name, state_registration, relationship_type, payment_method)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19)`,
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
      body.person_type,
      body.company_name,
      body.state_registration,
      body.relationship_type,
      body.payment_method,
    )
    .run()

  const customer = await c.env.DB.prepare('SELECT * FROM customers WHERE id = ?')
    .bind(result.meta.last_row_id)
    .first<Customer>()

  return c.json(customer, 201)
})

app.put('/api/customers/:id', async (c) => {
  const id = c.req.param('id')
  const body = normalize(await withKnownPaymentCode(c.env.DB, await c.req.json<Partial<CustomerInput>>()))
  if (!body.name) return c.json({ error: 'Nome é obrigatório' }, 400)

  const { meta } = await c.env.DB.prepare(
    `UPDATE customers
     SET name = ?1, document = ?2, birth_date = ?3, phone = ?4, email = ?5, street = ?6,
         number = ?7, complement = ?8, neighborhood = ?9, city = ?10, state = ?11,
         zip_code = ?12, notes = ?13, status = ?14, person_type = ?15, company_name = ?16,
         state_registration = ?17, relationship_type = ?18, payment_method = ?19, updated_at = datetime('now')
     WHERE id = ?20`,
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
      body.person_type,
      body.company_name,
      body.state_registration,
      body.relationship_type,
      body.payment_method,
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

function normalizeCollection(body: Partial<CollectionInput>) {
  const type: CollectionType = body.type === 'servico' ? 'servico' : 'material'
  return {
    type,
    material_type: type === 'material' ? body.material_type?.trim() || null : null,
    weight_kg: type === 'material' && Number.isFinite(body.weight_kg) ? Number(body.weight_kg) : null,
    description: body.description?.trim() ?? '',
    amount: Number.isFinite(body.amount) ? Number(body.amount) : 0,
    collected_at: body.collected_at?.trim() || new Date().toISOString().slice(0, 10),
    scheduled_at: body.scheduled_at?.trim() || null,
    notes: body.notes?.trim() || null,
  }
}

const collectionSelect = `
  SELECT col.*, c.name AS customer_name
  FROM collections col
  JOIN customers c ON c.id = col.customer_id
`

app.get('/api/collections', async (c) => {
  const customerId = c.req.query('customer_id')
  let sql = collectionSelect
  const params: (string | number)[] = []

  if (customerId) {
    sql += ' WHERE col.customer_id = ?'
    params.push(customerId)
  }
  sql += ' ORDER BY col.collected_at DESC, col.id DESC'

  const statement = params.length ? c.env.DB.prepare(sql).bind(...params) : c.env.DB.prepare(sql)
  const { results } = await statement.all<CollectionWithCustomer>()
  return c.json(results)
})

app.post('/api/collections', async (c) => {
  const raw = await c.req.json<Partial<CollectionInput>>()
  const customerId = Number.isFinite(raw.customer_id) ? Number(raw.customer_id) : null
  if (!customerId) return c.json({ error: 'Cliente é obrigatório' }, 400)

  const customer = await c.env.DB.prepare('SELECT id FROM customers WHERE id = ?').bind(customerId).first()
  if (!customer) return c.json({ error: 'Cliente não encontrado' }, 404)

  const body = normalizeCollection(raw)
  if (!body.description) return c.json({ error: 'Descrição é obrigatória' }, 400)

  const result = await c.env.DB.prepare(
    `INSERT INTO collections
       (customer_id, type, material_type, weight_kg, description, amount, collected_at, scheduled_at, notes)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`,
  )
    .bind(
      customerId,
      body.type,
      body.material_type,
      body.weight_kg,
      body.description,
      body.amount,
      body.collected_at,
      body.scheduled_at,
      body.notes,
    )
    .run()

  const collection = await c.env.DB.prepare(`${collectionSelect} WHERE col.id = ?`)
    .bind(result.meta.last_row_id)
    .first<CollectionWithCustomer>()

  return c.json(collection, 201)
})

app.put('/api/collections/:id', async (c) => {
  const id = c.req.param('id')
  const body = normalizeCollection(await c.req.json<Partial<CollectionInput>>())
  if (!body.description) return c.json({ error: 'Descrição é obrigatória' }, 400)

  const { meta } = await c.env.DB.prepare(
    `UPDATE collections
     SET type = ?1, material_type = ?2, weight_kg = ?3, description = ?4, amount = ?5,
         collected_at = ?6, scheduled_at = ?7, notes = ?8
     WHERE id = ?9`,
  )
    .bind(
      body.type,
      body.material_type,
      body.weight_kg,
      body.description,
      body.amount,
      body.collected_at,
      body.scheduled_at,
      body.notes,
      id,
    )
    .run()

  if (meta.changes === 0) return c.json({ error: 'Coleta não encontrada' }, 404)

  const collection = await c.env.DB.prepare(`${collectionSelect} WHERE col.id = ?`)
    .bind(id)
    .first<CollectionWithCustomer>()

  return c.json(collection)
})

app.delete('/api/collections/:id', async (c) => {
  const id = c.req.param('id')
  const { meta } = await c.env.DB.prepare('DELETE FROM collections WHERE id = ?').bind(id).run()

  if (meta.changes === 0) return c.json({ error: 'Coleta não encontrada' }, 404)
  return c.body(null, 204)
})

function normalizeMaterialType(body: Partial<MaterialTypeInput>): MaterialTypeInput {
  const status: MaterialStatus = body.status === 'inactive' ? 'inactive' : 'active'
  const category = materialCategories.find((cat) => cat === body.category) ?? null
  return {
    parent_id: Number.isFinite(body.parent_id) ? Number(body.parent_id) : null,
    name: body.name?.trim() ?? '',
    category,
    unit: body.unit?.trim() || 'kg',
    status,
  }
}

const materialSelect = `
  SELECT mt.*,
    (SELECT buy_price FROM material_prices mp WHERE mp.material_type_id = mt.id
       ORDER BY mp.effective_at DESC, mp.id DESC LIMIT 1) AS buy_price,
    (SELECT sell_price FROM material_prices mp WHERE mp.material_type_id = mt.id
       ORDER BY mp.effective_at DESC, mp.id DESC LIMIT 1) AS sell_price,
    (SELECT effective_at FROM material_prices mp WHERE mp.material_type_id = mt.id
       ORDER BY mp.effective_at DESC, mp.id DESC LIMIT 1) AS price_effective_at
  FROM material_types mt
`

app.get('/api/materials', async (c) => {
  const { results } = await c.env.DB.prepare(`${materialSelect} ORDER BY mt.name`).all<MaterialWithPrice>()
  return c.json(results)
})

app.get('/api/materials/:id', async (c) => {
  const id = c.req.param('id')
  const material = await c.env.DB.prepare(`${materialSelect} WHERE mt.id = ?`)
    .bind(id)
    .first<MaterialWithPrice>()

  if (!material) return c.json({ error: 'Material não encontrado' }, 404)
  return c.json(material)
})

app.post('/api/materials', async (c) => {
  const body = normalizeMaterialType(await c.req.json<Partial<MaterialTypeInput>>())
  if (!body.name) return c.json({ error: 'Nome é obrigatório' }, 400)

  const result = await c.env.DB.prepare(
    'INSERT INTO material_types (parent_id, name, category, unit, status) VALUES (?1, ?2, ?3, ?4, ?5)',
  )
    .bind(body.parent_id, body.name, body.category, body.unit, body.status)
    .run()

  const material = await c.env.DB.prepare(`${materialSelect} WHERE mt.id = ?`)
    .bind(result.meta.last_row_id)
    .first<MaterialWithPrice>()

  return c.json(material, 201)
})

app.put('/api/materials/:id', async (c) => {
  const id = c.req.param('id')
  const body = normalizeMaterialType(await c.req.json<Partial<MaterialTypeInput>>())
  if (!body.name) return c.json({ error: 'Nome é obrigatório' }, 400)
  if (body.parent_id === Number(id)) return c.json({ error: 'Um material não pode ser subtipo de si mesmo' }, 400)

  const { meta } = await c.env.DB.prepare(
    `UPDATE material_types
     SET parent_id = ?1, name = ?2, category = ?3, unit = ?4, status = ?5, updated_at = datetime('now')
     WHERE id = ?6`,
  )
    .bind(body.parent_id, body.name, body.category, body.unit, body.status, id)
    .run()

  if (meta.changes === 0) return c.json({ error: 'Material não encontrado' }, 404)

  const material = await c.env.DB.prepare(`${materialSelect} WHERE mt.id = ?`)
    .bind(id)
    .first<MaterialWithPrice>()

  return c.json(material)
})

app.delete('/api/materials/:id', async (c) => {
  const id = c.req.param('id')
  const { meta } = await c.env.DB.prepare('DELETE FROM material_types WHERE id = ?').bind(id).run()

  if (meta.changes === 0) return c.json({ error: 'Material não encontrado' }, 404)
  return c.body(null, 204)
})

app.get('/api/materials/:id/prices', async (c) => {
  const id = c.req.param('id')
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM material_prices WHERE material_type_id = ? ORDER BY effective_at DESC, id DESC',
  )
    .bind(id)
    .all()

  return c.json(results)
})

app.post('/api/materials/:id/prices', async (c) => {
  const id = c.req.param('id')
  const material = await c.env.DB.prepare('SELECT id FROM material_types WHERE id = ?').bind(id).first()
  if (!material) return c.json({ error: 'Material não encontrado' }, 404)

  const body = await c.req.json<Partial<MaterialPriceInput>>()
  const buy_price = Number(body.buy_price)
  const sell_price = Number(body.sell_price)
  const effective_at = body.effective_at?.trim() || new Date().toISOString().slice(0, 10)

  if (!Number.isFinite(buy_price) || buy_price < 0) return c.json({ error: 'Preço de compra inválido' }, 400)
  if (!Number.isFinite(sell_price) || sell_price < 0) return c.json({ error: 'Preço de venda inválido' }, 400)

  const result = await c.env.DB.prepare(
    'INSERT INTO material_prices (material_type_id, buy_price, sell_price, effective_at) VALUES (?1, ?2, ?3, ?4)',
  )
    .bind(id, buy_price, sell_price, effective_at)
    .run()

  const price = await c.env.DB.prepare('SELECT * FROM material_prices WHERE id = ?')
    .bind(result.meta.last_row_id)
    .first()

  return c.json(price, 201)
})

app.delete('/api/materials/prices/:priceId', async (c) => {
  const priceId = c.req.param('priceId')
  const { meta } = await c.env.DB.prepare('DELETE FROM material_prices WHERE id = ?').bind(priceId).run()

  if (meta.changes === 0) return c.json({ error: 'Registro de preço não encontrado' }, 404)
  return c.body(null, 204)
})

function normalizeTransaction(body: Partial<TransactionInput>) {
  const transaction_type: TransactionType = body.transaction_type === 'venda' ? 'venda' : 'compra'
  const payment_status: PaymentStatus =
    body.payment_status === 'pago' || body.payment_status === 'parcelado' ? body.payment_status : 'a_pagar'
  const payment_method = body.payment_method || null
  const weight = Number(body.weight)
  const unit_price = Number(body.unit_price)
  const allowInstallments =
    payment_status === 'parcelado' || payment_method === 'cartao_credito' || payment_method === 'cartao_debito'
  const installments =
    allowInstallments && Number.isFinite(body.installments) && Number(body.installments) > 0
      ? Math.round(Number(body.installments))
      : null

  return {
    customer_id: Number.isFinite(body.customer_id) ? Number(body.customer_id) : null,
    material_type_id: Number.isFinite(body.material_type_id) ? Number(body.material_type_id) : null,
    transaction_type,
    weight,
    unit_price,
    payment_method,
    payment_status,
    installments,
    transacted_at: body.transacted_at?.trim() || new Date().toISOString().slice(0, 10),
    notes: body.notes?.trim() || null,
  }
}

const transactionSelect = `
  SELECT t.*, c.name AS customer_name, mt.name AS material_name, mt.unit AS material_unit,
    pm.name AS payment_method_name
  FROM transactions t
  JOIN customers c ON c.id = t.customer_id
  JOIN material_types mt ON mt.id = t.material_type_id
  LEFT JOIN payment_methods pm ON pm.code = t.payment_method
`

app.get('/api/transactions', async (c) => {
  const customerId = c.req.query('customer_id')
  const status = c.req.query('status')
  const clauses: string[] = []
  const params: (string | number)[] = []

  if (customerId) {
    clauses.push('t.customer_id = ?')
    params.push(customerId)
  }
  if (status) {
    clauses.push('t.payment_status = ?')
    params.push(status)
  }

  let sql = transactionSelect
  if (clauses.length) sql += ` WHERE ${clauses.join(' AND ')}`
  sql += ' ORDER BY t.transacted_at DESC, t.id DESC'

  const statement = params.length ? c.env.DB.prepare(sql).bind(...params) : c.env.DB.prepare(sql)
  const { results } = await statement.all<TransactionWithDetails>()
  return c.json(results)
})

app.get('/api/transactions/:id', async (c) => {
  const id = c.req.param('id')
  const transaction = await c.env.DB.prepare(`${transactionSelect} WHERE t.id = ?`)
    .bind(id)
    .first<TransactionWithDetails>()

  if (!transaction) return c.json({ error: 'Transação não encontrada' }, 404)
  return c.json(transaction)
})

app.post('/api/transactions', async (c) => {
  const body = normalizeTransaction(await withKnownPaymentCode(c.env.DB, await c.req.json<Partial<TransactionInput>>()))
  if (!body.customer_id) return c.json({ error: 'Cliente é obrigatório' }, 400)
  if (!body.material_type_id) return c.json({ error: 'Material é obrigatório' }, 400)
  if (!Number.isFinite(body.weight) || body.weight <= 0) return c.json({ error: 'Peso inválido' }, 400)
  if (!Number.isFinite(body.unit_price) || body.unit_price < 0)
    return c.json({ error: 'Preço unitário inválido' }, 400)

  const customer = await c.env.DB.prepare('SELECT id FROM customers WHERE id = ?').bind(body.customer_id).first()
  if (!customer) return c.json({ error: 'Cliente não encontrado' }, 404)

  const material = await c.env.DB.prepare('SELECT id FROM material_types WHERE id = ?')
    .bind(body.material_type_id)
    .first()
  if (!material) return c.json({ error: 'Material não encontrado' }, 404)

  const total_amount = Math.round(body.weight * body.unit_price * 100) / 100

  const result = await c.env.DB.prepare(
    `INSERT INTO transactions
       (customer_id, material_type_id, transaction_type, weight, unit_price, total_amount,
        payment_method, payment_status, installments, transacted_at, notes)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)`,
  )
    .bind(
      body.customer_id,
      body.material_type_id,
      body.transaction_type,
      body.weight,
      body.unit_price,
      total_amount,
      body.payment_method,
      body.payment_status,
      body.installments,
      body.transacted_at,
      body.notes,
    )
    .run()

  const transaction = await c.env.DB.prepare(`${transactionSelect} WHERE t.id = ?`)
    .bind(result.meta.last_row_id)
    .first<TransactionWithDetails>()

  return c.json(transaction, 201)
})

app.put('/api/transactions/:id', async (c) => {
  const id = c.req.param('id')
  const body = normalizeTransaction(await withKnownPaymentCode(c.env.DB, await c.req.json<Partial<TransactionInput>>()))
  if (!body.customer_id) return c.json({ error: 'Cliente é obrigatório' }, 400)
  if (!body.material_type_id) return c.json({ error: 'Material é obrigatório' }, 400)
  if (!Number.isFinite(body.weight) || body.weight <= 0) return c.json({ error: 'Peso inválido' }, 400)
  if (!Number.isFinite(body.unit_price) || body.unit_price < 0)
    return c.json({ error: 'Preço unitário inválido' }, 400)

  const total_amount = Math.round(body.weight * body.unit_price * 100) / 100

  const { meta } = await c.env.DB.prepare(
    `UPDATE transactions
     SET customer_id = ?1, material_type_id = ?2, transaction_type = ?3, weight = ?4, unit_price = ?5,
         total_amount = ?6, payment_method = ?7, payment_status = ?8, installments = ?9,
         transacted_at = ?10, notes = ?11, updated_at = datetime('now')
     WHERE id = ?12`,
  )
    .bind(
      body.customer_id,
      body.material_type_id,
      body.transaction_type,
      body.weight,
      body.unit_price,
      total_amount,
      body.payment_method,
      body.payment_status,
      body.installments,
      body.transacted_at,
      body.notes,
      id,
    )
    .run()

  if (meta.changes === 0) return c.json({ error: 'Transação não encontrada' }, 404)

  const transaction = await c.env.DB.prepare(`${transactionSelect} WHERE t.id = ?`)
    .bind(id)
    .first<TransactionWithDetails>()

  return c.json(transaction)
})

app.delete('/api/transactions/:id', async (c) => {
  const id = c.req.param('id')
  const { meta } = await c.env.DB.prepare('DELETE FROM transactions WHERE id = ?').bind(id).run()

  if (meta.changes === 0) return c.json({ error: 'Transação não encontrada' }, 404)
  return c.body(null, 204)
})

type PaymentMethodRow = Omit<PaymentMethodRecord, 'use_purchases' | 'use_sales' | 'active'> & {
  use_purchases: number
  use_sales: number
  active: number
}

function toPaymentMethod(row: PaymentMethodRow): PaymentMethodRecord {
  return {
    ...row,
    use_purchases: Boolean(row.use_purchases),
    use_sales: Boolean(row.use_sales),
    active: Boolean(row.active),
  }
}

function normalizePaymentMethod(body: Partial<PaymentMethodInput>): PaymentMethodInput {
  const kind: PaymentKind = body.kind === 'a_prazo' ? 'a_prazo' : 'a_vista'
  const termDays = Number(body.term_days)
  return {
    name: body.name?.trim() ?? '',
    kind,
    term_days: kind === 'a_prazo' && Number.isFinite(termDays) && termDays > 0 ? Math.round(termDays) : 0,
    use_purchases: body.use_purchases !== false,
    use_sales: body.use_sales !== false,
    active: body.active !== false,
  }
}

function slugify(value: string) {
  return (
    value
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'forma'
  )
}

async function uniquePaymentCode(db: D1Database, name: string) {
  const base = slugify(name)
  const { results } = await db
    .prepare("SELECT code FROM payment_methods WHERE code = ?1 OR code LIKE ?1 || '\\_%' ESCAPE '\\'")
    .bind(base)
    .all<{ code: string }>()
  const taken = new Set(results.map((r) => r.code))
  let code = base
  for (let n = 2; taken.has(code); n++) code = `${base}_${n}`
  return code
}

async function findPaymentMethod(db: D1Database, id: string | number) {
  const row = await db.prepare('SELECT * FROM payment_methods WHERE id = ?').bind(id).first<PaymentMethodRow>()
  return row ? toPaymentMethod(row) : null
}

app.get('/api/payment-methods', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM payment_methods ORDER BY name').all<PaymentMethodRow>()
  return c.json(results.map(toPaymentMethod))
})

app.post('/api/payment-methods', async (c) => {
  const body = normalizePaymentMethod(await c.req.json<Partial<PaymentMethodInput>>())
  if (!body.name) return c.json({ error: 'Nome é obrigatório' }, 400)

  const code = await uniquePaymentCode(c.env.DB, body.name)
  const result = await c.env.DB.prepare(
    `INSERT INTO payment_methods (code, name, kind, term_days, use_purchases, use_sales, active)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`,
  )
    .bind(
      code,
      body.name,
      body.kind,
      body.term_days,
      Number(body.use_purchases),
      Number(body.use_sales),
      Number(body.active),
    )
    .run()

  return c.json(await findPaymentMethod(c.env.DB, result.meta.last_row_id), 201)
})

app.put('/api/payment-methods/:id', async (c) => {
  const id = c.req.param('id')
  const body = normalizePaymentMethod(await c.req.json<Partial<PaymentMethodInput>>())
  if (!body.name) return c.json({ error: 'Nome é obrigatório' }, 400)

  const { meta } = await c.env.DB.prepare(
    `UPDATE payment_methods
     SET name = ?1, kind = ?2, term_days = ?3, use_purchases = ?4, use_sales = ?5, active = ?6,
         updated_at = datetime('now')
     WHERE id = ?7`,
  )
    .bind(
      body.name,
      body.kind,
      body.term_days,
      Number(body.use_purchases),
      Number(body.use_sales),
      Number(body.active),
      id,
    )
    .run()

  if (meta.changes === 0) return c.json({ error: 'Forma de pagamento não encontrada' }, 404)
  return c.json(await findPaymentMethod(c.env.DB, id))
})

app.patch('/api/payment-methods/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<{ active?: unknown }>()
  if (typeof body.active !== 'boolean') return c.json({ error: 'Informe active como true ou false' }, 400)

  const { meta } = await c.env.DB.prepare(
    "UPDATE payment_methods SET active = ?1, updated_at = datetime('now') WHERE id = ?2",
  )
    .bind(Number(body.active), id)
    .run()

  if (meta.changes === 0) return c.json({ error: 'Forma de pagamento não encontrada' }, 404)
  return c.json(await findPaymentMethod(c.env.DB, id))
})

app.delete('/api/payment-methods/:id', async (c) => {
  const id = c.req.param('id')
  const method = await findPaymentMethod(c.env.DB, id)
  if (!method) return c.json({ error: 'Forma de pagamento não encontrada' }, 404)

  const usage = await c.env.DB.prepare(
    `SELECT
       (SELECT COUNT(*) FROM transactions WHERE payment_method = ?1) +
       (SELECT COUNT(*) FROM customers WHERE payment_method = ?1) AS total`,
  )
    .bind(method.code)
    .first<{ total: number }>()

  if (usage && usage.total > 0) {
    return c.json(
      { error: 'Esta forma de pagamento já foi usada em clientes ou transações. Desative-a em vez de excluir.' },
      409,
    )
  }

  await c.env.DB.prepare('DELETE FROM payment_methods WHERE id = ?').bind(id).run()
  return c.body(null, 204)
})

function normalizeCompany(body: Partial<CompanyInput>): CompanyInput {
  const text = (value: string | null | undefined) => value?.trim() || null
  return {
    trade_name: body.trade_name?.trim() ?? '',
    legal_name: text(body.legal_name),
    cnpj: text(body.cnpj),
    state_registration: text(body.state_registration),
    phone: text(body.phone),
    email: text(body.email),
    street: text(body.street),
    number: text(body.number),
    complement: text(body.complement),
    neighborhood: text(body.neighborhood),
    city: text(body.city),
    state: text(body.state)?.toUpperCase().slice(0, 2) ?? null,
    zip_code: text(body.zip_code),
    license_number: text(body.license_number),
    license_agency: text(body.license_agency),
    license_expires_at: text(body.license_expires_at),
    notes: text(body.notes),
  }
}

const companySelect = 'SELECT * FROM company WHERE id = 1'

app.get('/api/company', async (c) => {
  return c.json(await c.env.DB.prepare(companySelect).first<Company>())
})

app.put('/api/company', async (c) => {
  const body = normalizeCompany(await c.req.json<Partial<CompanyInput>>())
  if (!body.trade_name) return c.json({ error: 'Nome da empresa é obrigatório' }, 400)

  await c.env.DB.prepare(
    `INSERT INTO company
       (id, trade_name, legal_name, cnpj, state_registration, phone, email, street, number, complement,
        neighborhood, city, state, zip_code, license_number, license_agency, license_expires_at, notes)
     VALUES (1, ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17)
     ON CONFLICT (id) DO UPDATE SET
       trade_name = excluded.trade_name, legal_name = excluded.legal_name, cnpj = excluded.cnpj,
       state_registration = excluded.state_registration, phone = excluded.phone, email = excluded.email,
       street = excluded.street, number = excluded.number, complement = excluded.complement,
       neighborhood = excluded.neighborhood, city = excluded.city, state = excluded.state,
       zip_code = excluded.zip_code, license_number = excluded.license_number,
       license_agency = excluded.license_agency, license_expires_at = excluded.license_expires_at,
       notes = excluded.notes, updated_at = datetime('now')`,
  )
    .bind(
      body.trade_name,
      body.legal_name,
      body.cnpj,
      body.state_registration,
      body.phone,
      body.email,
      body.street,
      body.number,
      body.complement,
      body.neighborhood,
      body.city,
      body.state,
      body.zip_code,
      body.license_number,
      body.license_agency,
      body.license_expires_at,
      body.notes,
    )
    .run()

  return c.json(await c.env.DB.prepare(companySelect).first<Company>())
})

function reportDateRange(c: Context<{ Bindings: Bindings }>) {
  const from = c.req.query('from')?.trim() || null
  const to = c.req.query('to')?.trim() || null
  const clauses: string[] = []
  const params: string[] = []
  if (from) {
    clauses.push('t.transacted_at >= ?')
    params.push(from)
  }
  if (to) {
    clauses.push('t.transacted_at <= ?')
    params.push(to)
  }
  return { clauses, params }
}

const periodExpr: Record<ReportGranularity, string> = {
  day: "strftime('%Y-%m-%d', t.transacted_at)",
  week: "strftime('%Y-W%W', t.transacted_at)",
  month: "strftime('%Y-%m', t.transacted_at)",
}

app.get('/api/reports/by-material', async (c) => {
  const { clauses, params } = reportDateRange(c)
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''

  const sql = `
    SELECT mt.id AS material_id, mt.name AS material_name, mt.unit,
      SUM(CASE WHEN t.transaction_type = 'compra' THEN t.weight ELSE 0 END) AS buy_weight,
      SUM(CASE WHEN t.transaction_type = 'compra' THEN t.total_amount ELSE 0 END) AS buy_total,
      SUM(CASE WHEN t.transaction_type = 'venda' THEN t.weight ELSE 0 END) AS sell_weight,
      SUM(CASE WHEN t.transaction_type = 'venda' THEN t.total_amount ELSE 0 END) AS sell_total
    FROM transactions t
    JOIN material_types mt ON mt.id = t.material_type_id
    ${where}
    GROUP BY mt.id
    ORDER BY (buy_total + sell_total) DESC
  `

  const statement = params.length ? c.env.DB.prepare(sql).bind(...params) : c.env.DB.prepare(sql)
  const { results } = await statement.all<MaterialReportRow>()
  return c.json(results)
})

app.get('/api/reports/by-period', async (c) => {
  const { clauses, params } = reportDateRange(c)
  const granularityParam = c.req.query('granularity')
  const granularity: ReportGranularity =
    granularityParam === 'week' || granularityParam === 'month' ? granularityParam : 'day'
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''

  const sql = `
    SELECT ${periodExpr[granularity]} AS period,
      SUM(CASE WHEN t.transaction_type = 'compra' THEN t.weight ELSE 0 END) AS buy_weight,
      SUM(CASE WHEN t.transaction_type = 'compra' THEN t.total_amount ELSE 0 END) AS buy_total,
      SUM(CASE WHEN t.transaction_type = 'venda' THEN t.weight ELSE 0 END) AS sell_weight,
      SUM(CASE WHEN t.transaction_type = 'venda' THEN t.total_amount ELSE 0 END) AS sell_total
    FROM transactions t
    ${where}
    GROUP BY period
    ORDER BY period ASC
  `

  const statement = params.length ? c.env.DB.prepare(sql).bind(...params) : c.env.DB.prepare(sql)
  const { results } = await statement.all<PeriodReportRow>()
  return c.json(results)
})

app.get('/api/reports/customers', async (c) => {
  const { clauses, params } = reportDateRange(c)
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''

  const sql = `
    SELECT c2.id AS customer_id, c2.name AS customer_name,
      SUM(CASE WHEN t.transaction_type = 'compra' THEN t.weight ELSE 0 END) AS buy_weight,
      SUM(CASE WHEN t.transaction_type = 'compra' THEN t.total_amount ELSE 0 END) AS buy_total,
      SUM(CASE WHEN t.transaction_type = 'venda' THEN t.weight ELSE 0 END) AS sell_weight,
      SUM(CASE WHEN t.transaction_type = 'venda' THEN t.total_amount ELSE 0 END) AS sell_total
    FROM transactions t
    JOIN customers c2 ON c2.id = t.customer_id
    ${where}
    GROUP BY c2.id
    ORDER BY (buy_weight + sell_weight) DESC
  `

  const statement = params.length ? c.env.DB.prepare(sql).bind(...params) : c.env.DB.prepare(sql)
  const { results } = await statement.all<CustomerReportRow>()
  return c.json(results)
})

app.get('/api/reports/cash-flow', async (c) => {
  const { clauses, params } = reportDateRange(c)
  const granularityParam = c.req.query('granularity')
  const granularity: ReportGranularity =
    granularityParam === 'week' || granularityParam === 'month' ? granularityParam : 'day'

  const where = `WHERE ${[...clauses, "t.payment_status = 'pago'"].join(' AND ')}`

  const sql = `
    SELECT ${periodExpr[granularity]} AS period,
      SUM(CASE WHEN t.transaction_type = 'venda' THEN t.total_amount ELSE 0 END) AS entradas,
      SUM(CASE WHEN t.transaction_type = 'compra' THEN t.total_amount ELSE 0 END) AS saidas
    FROM transactions t
    ${where}
    GROUP BY period
    ORDER BY period ASC
  `

  const statement = params.length ? c.env.DB.prepare(sql).bind(...params) : c.env.DB.prepare(sql)
  const { results } = await statement.all<CashFlowRow>()

  const from = c.req.query('from')?.trim()
  let opening_balance = 0
  if (from) {
    const opening = await c.env.DB.prepare(
      `SELECT
         SUM(CASE WHEN transaction_type = 'venda' THEN total_amount ELSE 0 END) -
         SUM(CASE WHEN transaction_type = 'compra' THEN total_amount ELSE 0 END) AS balance
       FROM transactions
       WHERE payment_status = 'pago' AND transacted_at < ?`,
    )
      .bind(from)
      .first<{ balance: number | null }>()
    opening_balance = opening?.balance ?? 0
  }

  return c.json({ opening_balance, rows: results } satisfies CashFlowReport)
})

export default app
