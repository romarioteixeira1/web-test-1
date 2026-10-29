import { Hono } from 'hono'
import type { UserInput, UserRecord, UserRole } from '../shared/auth'
import {
  currentSessionId,
  hashPassword,
  passwordError,
  requireAdmin,
  usernameError,
  type AuthEnv,
} from './auth'

/** The users screen: administrators create, edit and remove accounts. Mounted at /api/users. */
export const users = new Hono<AuthEnv>()

users.use('*', requireAdmin)

const columns = 'id, name, username, role, created_at'

function readInput(body: Partial<UserInput> | null) {
  const role: UserRole = body?.role === 'admin' ? 'admin' : 'operador'
  return {
    name: typeof body?.name === 'string' ? body.name.trim() : '',
    username: typeof body?.username === 'string' ? body.username.trim() : '',
    password: typeof body?.password === 'string' ? body.password : '',
    role,
  }
}

/** Usernames are unique regardless of case (the column is COLLATE NOCASE). */
async function usernameTaken(db: D1Database, username: string, exceptId = 0) {
  const row = await db.prepare('SELECT 1 FROM users WHERE username = ? AND id <> ?').bind(username, exceptId).first()
  return row !== null
}

users.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(`SELECT ${columns} FROM users ORDER BY name`).all<UserRecord>()
  return c.json(results)
})

users.post('/', async (c) => {
  const input = readInput(await c.req.json<Partial<UserInput>>().catch(() => null))
  if (!input.name) return c.json({ error: 'Preencha o nome.' }, 400)
  const invalid = usernameError(input.username) ?? passwordError(input.password)
  if (invalid) return c.json({ error: invalid }, 400)
  if (await usernameTaken(c.env.DB, input.username)) {
    return c.json({ error: `Já existe alguém com o usuário "${input.username}".` }, 409)
  }

  const user = await c.env.DB.prepare(
    `INSERT INTO users (name, username, password_hash, role) VALUES (?, ?, ?, ?) RETURNING ${columns}`,
  )
    .bind(input.name, input.username, await hashPassword(input.password), input.role)
    .first<UserRecord>()
  return c.json(user, 201)
})

/** An empty password keeps the current one. A new password signs that user out everywhere else. */
users.put('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const me = c.get('user')
  const input = readInput(await c.req.json<Partial<UserInput>>().catch(() => null))
  if (!input.name) return c.json({ error: 'Preencha o nome.' }, 400)
  const invalid = usernameError(input.username) ?? (input.password ? passwordError(input.password) : null)
  if (invalid) return c.json({ error: invalid }, 400)
  // Admins can't demote themselves, so there is always at least one admin left.
  if (id === me.id && input.role !== 'admin') {
    return c.json({ error: 'Você não pode tirar o seu próprio acesso de administrador.' }, 400)
  }
  if (await usernameTaken(c.env.DB, input.username, id)) {
    return c.json({ error: `Já existe alguém com o usuário "${input.username}".` }, 409)
  }

  const user = await c.env.DB.prepare(
    `UPDATE users SET name = ?, username = ?, role = ? WHERE id = ? RETURNING ${columns}`,
  )
    .bind(input.name, input.username, input.role, id)
    .first<UserRecord>()
  if (!user) return c.json({ error: 'Usuário não encontrado.' }, 404)

  if (input.password) {
    await c.env.DB.batch([
      c.env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(await hashPassword(input.password), id),
      c.env.DB.prepare('DELETE FROM sessions WHERE user_id = ? AND id <> ?').bind(id, await currentSessionId(c)),
    ])
  }
  return c.json(user)
})

users.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  if (id === c.get('user').id) return c.json({ error: 'Você não pode excluir o seu próprio usuário.' }, 400)

  // Sessions go with the user (ON DELETE CASCADE needs foreign keys on, so delete them explicitly too).
  const [, result] = await c.env.DB.batch([
    c.env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(id),
    c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id),
  ])
  if (!result.meta.changes) return c.json({ error: 'Usuário não encontrado.' }, 404)
  return c.body(null, 204)
})
