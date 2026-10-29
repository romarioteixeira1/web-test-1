/**
 * Loads test data from a JSON file into the D1 database.
 *
 *   npm run db:seed:local                      # scripts/seed-ecocontrol.json into the local database
 *   node scripts/seed.js other.json --local    # another file
 *   node scripts/seed.js --dry-run             # only print the SQL
 *   node scripts/seed.js --remote              # production; asks you to type the database name first
 *
 * The file's items point at each other by name (a transaction names its customer, material and payment
 * method), so the SQL looks those names up in the database. Anything that already exists is skipped,
 * which makes running it twice safe.
 */
import { spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createInterface } from 'node:readline/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DATABASE = 'web-test-1-db'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const MATERIAL_CATEGORIES = ['Papel', 'Plástico', 'Metal', 'Vidro', 'Eletrônico']
/** The collection form's "Tipo de material" options (shared/collection.ts). */
const COLLECTION_MATERIALS = ['Papelão', 'Plástico', 'Metal', 'Vidro', 'Eletrônico', 'Óleo', 'Outro']
const MAX_INSTALLMENTS = 10

const args = process.argv.slice(2)
const remote = args.includes('--remote')
const dryRun = args.includes('--dry-run')
const file = resolve(args.find((a) => !a.startsWith('--')) ?? resolve(root, 'scripts/seed-ecocontrol.json'))

const errors = []

/** SQL string literal, or NULL. */
function q(value) {
  if (value === null || value === undefined || value === '') return 'NULL'
  return `'${String(value).replaceAll("'", "''")}'`
}

/** SQL number, or NULL. */
function n(value) {
  return typeof value === 'number' && Number.isFinite(value) ? String(value) : 'NULL'
}

/** Same rule as slugify() in worker/index.ts, so seeded codes look like ones made in the app. */
function slugify(value) {
  return (
    value
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'forma'
  )
}

const paymentCode = (name) => `(SELECT code FROM payment_methods WHERE name = ${q(name)} COLLATE NOCASE LIMIT 1)`
const customerId = (name) => `(SELECT id FROM customers WHERE name = ${q(name)} COLLATE NOCASE LIMIT 1)`
const materialId = (name) => `(SELECT id FROM material_types WHERE name = ${q(name)} COLLATE NOCASE LIMIT 1)`

function check(condition, message) {
  if (!condition) errors.push(message)
}

const isDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)

function build(data) {
  const payments = data.formas_pagamento ?? []
  const materials = data.materiais ?? []
  const customers = data.clientes ?? []
  const transactions = data.transacoes ?? []
  const collections = data.coletas ?? []

  const paymentNames = new Set(payments.map((p) => p.nome.toLowerCase()))
  const materialsByName = new Map(materials.map((m) => [m.nome.toLowerCase(), m]))
  const customerNames = new Set(customers.map((c) => c.nome.toLowerCase()))
  const paymentKinds = new Map(payments.map((p) => [p.nome.toLowerCase(), p.pagamento]))

  // Names the file refers to must be in the file too (or the lookup would quietly come back empty).
  const knownPayment = (name, where) =>
    check(name == null || paymentNames.has(name.toLowerCase()), `${where}: forma de pagamento "${name}" não está em formas_pagamento`)
  const knownMaterial = (name, where) =>
    check(materialsByName.has(String(name).toLowerCase()), `${where}: material "${name}" não está em materiais`)
  const knownCustomer = (name, where) =>
    check(customerNames.has(String(name).toLowerCase()), `${where}: cliente "${name}" não está em clientes`)

  const sql = []

  sql.push('-- Formas de pagamento')
  for (const p of payments) {
    const where = `formas_pagamento "${p.nome}"`
    check(['a_vista', 'a_prazo'].includes(p.pagamento), `${where}: pagamento deve ser a_vista ou a_prazo`)
    // The file has no term; "Boleto 30 dias" says it in the name, otherwise 30 days like the app's default card.
    const termDays = p.pagamento === 'a_prazo' ? Number(/(\d+)\s*dias?/i.exec(p.nome)?.[1] ?? 30) : 0
    sql.push(
      `INSERT INTO payment_methods (code, name, kind, term_days, use_purchases, use_sales, active)
SELECT ${q(slugify(p.nome))}, ${q(p.nome)}, ${q(p.pagamento)}, ${termDays}, ${Number(p.usar_em_compras !== false)}, ${Number(p.usar_em_vendas !== false)}, ${Number(p.ativo !== false)}
WHERE NOT EXISTS (SELECT 1 FROM payment_methods WHERE name = ${q(p.nome)} COLLATE NOCASE OR code = ${q(slugify(p.nome))});`,
    )
  }

  // Prices start on the first day the file has a transaction, so every seeded transaction has a price in effect.
  const firstDate = transactions.map((t) => t.data).filter(isDate).sort()[0] ?? new Date().toISOString().slice(0, 10)

  sql.push('\n-- Materiais e preços')
  for (const m of materials) {
    const where = `materiais "${m.nome}"`
    check(MATERIAL_CATEGORIES.includes(m.categoria), `${where}: categoria deve ser uma de ${MATERIAL_CATEGORIES.join(', ')}`)
    check(typeof m.preco_compra === 'number' && typeof m.preco_venda === 'number', `${where}: preços precisam ser números`)
    sql.push(
      `INSERT INTO material_types (name, category, unit, status)
SELECT ${q(m.nome)}, ${q(m.categoria)}, ${q(m.unidade || 'kg')}, ${q(m.ativo === false ? 'inactive' : 'active')}
WHERE NOT EXISTS (SELECT 1 FROM material_types WHERE name = ${q(m.nome)} COLLATE NOCASE);`,
      `INSERT INTO material_prices (material_type_id, buy_price, sell_price, effective_at)
SELECT ${materialId(m.nome)}, ${n(m.preco_compra)}, ${n(m.preco_venda)}, ${q(firstDate)}
WHERE NOT EXISTS (SELECT 1 FROM material_prices WHERE material_type_id = ${materialId(m.nome)} AND effective_at = ${q(firstDate)});`,
    )
  }

  sql.push('\n-- Clientes')
  for (const c of customers) {
    const where = `clientes "${c.nome}"`
    const address = c.endereco ?? {}
    check(['fornecedor', 'comprador', 'ambos'].includes(c.tipo), `${where}: tipo deve ser fornecedor, comprador ou ambos`)
    check(['fisica', 'juridica'].includes(c.pessoa), `${where}: pessoa deve ser fisica ou juridica`)
    knownPayment(c.forma_pagamento_preferida, where)
    const sameDocument = c.documento ? ` OR document = ${q(c.documento)}` : ''
    sql.push(
      `INSERT INTO customers (name, document, phone, email, street, number, complement, neighborhood, city, state, zip_code,
  notes, status, person_type, relationship_type, payment_method)
SELECT ${q(c.nome)}, ${q(c.documento)}, ${q(c.telefone)}, ${q(c.email)}, ${q(address.rua)}, ${q(address.numero)}, ${q(address.complemento)},
  ${q(address.bairro)}, ${q(address.cidade)}, ${q(address.uf)}, ${q(address.cep)}, ${q(c.observacoes)}, ${q(c.ativo === false ? 'inactive' : 'active')},
  ${q(c.pessoa)}, ${q(c.tipo)}, ${c.forma_pagamento_preferida ? paymentCode(c.forma_pagamento_preferida) : 'NULL'}
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = ${q(c.nome)} COLLATE NOCASE${sameDocument});`,
    )
  }

  sql.push('\n-- Transações')
  transactions.forEach((t, i) => {
    const where = `transacoes[${i}] (${t.data}, ${t.cliente})`
    knownCustomer(t.cliente, where)
    knownMaterial(t.material, where)
    knownPayment(t.forma_pagamento, where)
    check(isDate(t.data), `${where}: data deve ser AAAA-MM-DD`)
    check(['compra', 'venda'].includes(t.tipo), `${where}: tipo deve ser compra ou venda`)
    check(['pago', 'a_pagar', 'parcelado'].includes(t.status), `${where}: status deve ser pago, a_pagar ou parcelado`)
    check(t.quantidade > 0 && t.preco_unitario >= 0, `${where}: quantidade e preço precisam ser positivos`)
    // The app stores weight × price rounded to cents; a different total in the file is a typo.
    const total = Math.round(t.quantidade * t.preco_unitario * 100) / 100
    check(t.total == null || Math.abs(total - t.total) < 0.005, `${where}: total ${t.total} não bate com ${t.quantidade} × ${t.preco_unitario} = ${total}`)
    const material = materialsByName.get(String(t.material).toLowerCase())
    check(!material || !t.unidade || material.unidade === t.unidade, `${where}: unidade "${t.unidade}" difere da do material (${material?.unidade})`)

    let installments = null
    if (t.status === 'parcelado') {
      check(Number.isInteger(t.parcelas) && t.parcelas >= 1 && t.parcelas <= MAX_INSTALLMENTS, `${where}: parcelas deve ser de 1 a ${MAX_INSTALLMENTS}`)
      check(paymentKinds.get(String(t.forma_pagamento).toLowerCase()) === 'a_prazo', `${where}: parcelado precisa de uma forma de pagamento a prazo`)
      installments = t.parcelas
    }

    sql.push(
      `INSERT INTO transactions (customer_id, material_type_id, transaction_type, weight, unit_price, total_amount,
  payment_method, payment_status, installments, transacted_at)
SELECT ${customerId(t.cliente)}, ${materialId(t.material)}, ${q(t.tipo)}, ${n(t.quantidade)}, ${n(t.preco_unitario)}, ${n(total)},
  ${t.forma_pagamento ? paymentCode(t.forma_pagamento) : 'NULL'}, ${q(t.status)}, ${n(installments)}, ${q(t.data)}
WHERE NOT EXISTS (SELECT 1 FROM transactions WHERE customer_id = ${customerId(t.cliente)} AND material_type_id = ${materialId(t.material)}
  AND transaction_type = ${q(t.tipo)} AND transacted_at = ${q(t.data)} AND weight = ${n(t.quantidade)});`,
    )
  })

  sql.push('\n-- Coletas')
  collections.forEach((col, i) => {
    const where = `coletas[${i}] (${col.data}, ${col.cliente})`
    const isMaterial = col.tipo === 'material'
    knownCustomer(col.cliente, where)
    check(['material', 'servico'].includes(col.tipo), `${where}: tipo deve ser material ou servico`)
    check(isDate(col.data), `${where}: data deve ser AAAA-MM-DD`)
    if (isMaterial) knownMaterial(col.material, where)

    // Collections keep the material as one of the form's broad options, not the material's own name.
    const material = isMaterial ? materialsByName.get(String(col.material).toLowerCase()) : null
    const materialType = !material
      ? null
      : COLLECTION_MATERIALS.includes(material.nome)
        ? material.nome
        : COLLECTION_MATERIALS.includes(material.categoria)
          ? material.categoria
          : 'Outro'
    // The app requires a description; the file only has a note. Services describe themselves in the note.
    const description = isMaterial ? `Coleta de ${col.material}` : col.observacao || 'Serviço de coleta'
    const notes = isMaterial ? col.observacao : null

    sql.push(
      `INSERT INTO collections (customer_id, type, material_type, weight_kg, description, amount, collected_at, scheduled_at, notes)
SELECT ${customerId(col.cliente)}, ${q(col.tipo)}, ${q(materialType)}, ${isMaterial ? n(col.peso_estimado_kg) : 'NULL'}, ${q(description)},
  ${n(col.valor ?? 0)}, ${q(col.data)}, ${q(col.agendamento)}, ${q(notes)}
WHERE NOT EXISTS (SELECT 1 FROM collections WHERE customer_id = ${customerId(col.cliente)} AND type = ${q(col.tipo)}
  AND collected_at = ${q(col.data)} AND description = ${q(description)});`,
    )
  })

  return {
    sql: sql.join('\n') + '\n',
    counts: {
      'formas de pagamento': payments.length,
      materiais: materials.length,
      clientes: customers.length,
      transações: transactions.length,
      coletas: collections.length,
    },
  }
}

const COUNT_QUERY = `SELECT
  (SELECT COUNT(*) FROM payment_methods) AS formas_pagamento,
  (SELECT COUNT(*) FROM material_types) AS materiais,
  (SELECT COUNT(*) FROM customers) AS clientes,
  (SELECT COUNT(*) FROM transactions) AS transacoes,
  (SELECT COUNT(*) FROM collections) AS coletas`

/** Runs the project's wrangler with this same Node, so no shell (or npx .cmd shim on Windows) is involved. */
function wrangler(...wranglerArgs) {
  const bin = resolve(root, 'node_modules/wrangler/bin/wrangler.js')
  const result = spawnSync(process.execPath, [bin, 'd1', 'execute', DATABASE, remote ? '--remote' : '--local', ...wranglerArgs], {
    cwd: root,
    encoding: 'utf8',
  })
  if (result.status !== 0) {
    console.error(result.stdout, result.stderr)
    process.exit(1)
  }
  return result.stdout
}

/** Runs through a file, so no shell quoting gets in the way. */
function tableCounts() {
  const countFile = resolve(root, '.wrangler/seed-count.sql')
  writeFileSync(countFile, `${COUNT_QUERY};\n`)
  const out = wrangler('--json', '--file', countFile)
  return JSON.parse(out)[0].results[0]
}

async function main() {
  let data
  try {
    data = JSON.parse(readFileSync(file, 'utf8'))
  } catch (err) {
    console.error(`Não consegui ler ${file}: ${err.message}`)
    process.exit(1)
  }

  const { sql, counts } = build(data)
  if (errors.length) {
    console.error(`O arquivo tem ${errors.length} problema(s); nada foi gravado:\n- ${errors.join('\n- ')}`)
    process.exit(1)
  }

  if (dryRun) {
    process.stdout.write(sql)
    return
  }

  if (remote) {
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    const answer = await rl.question(`Isto grava dados de TESTE no banco de PRODUÇÃO. Digite ${DATABASE} para continuar: `)
    rl.close()
    if (answer.trim() !== DATABASE) {
      console.log('Cancelado.')
      return
    }
  }

  // .wrangler is git-ignored, so the generated SQL never ends up in a commit.
  const sqlFile = resolve(root, '.wrangler/seed.sql')
  mkdirSync(dirname(sqlFile), { recursive: true })
  writeFileSync(sqlFile, sql)

  console.log(`Lendo ${file}`)
  console.log(`No arquivo: ${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(', ')}`)
  const before = tableCounts()
  wrangler('--file', sqlFile, '--yes')
  const after = tableCounts()

  console.log(`\nBanco ${remote ? 'de produção' : 'local'} (${DATABASE}):`)
  for (const key of Object.keys(after)) {
    const added = after[key] - before[key]
    console.log(`  ${key.padEnd(17)} ${String(after[key]).padStart(4)}  (${added ? `+${added}` : 'nada novo, já existiam'})`)
  }
}

main()
