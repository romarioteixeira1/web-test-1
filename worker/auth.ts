import { Hono, type Context, type MiddlewareHandler } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import {
  MIN_PASSWORD_LENGTH,
  type AuthSession,
  type ChangePasswordInput,
  type LoginInput,
  type SetupInput,
  type User,
} from '../shared/auth'

type AuthEnv = {
  Bindings: { DB: D1Database }
  Variables: { user: User }
}

const COOKIE_NAME = 'ecocontrol_session'
const SESSION_DAYS = 30
/** Workers caps PBKDF2 at 100k iterations. */
const PBKDF2_ITERATIONS = 100_000

const encoder = new TextEncoder()

function toBase64(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
}

function fromBase64(value: string) {
  return Uint8Array.from(atob(value), (ch) => ch.charCodeAt(0))
}

async function pbkdf2(password: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256)
  return new Uint8Array(bits)
}

/** Stored as `pbkdf2$<iterations>$<salt>$<hash>` so the cost can be raised later without breaking old hashes. */
export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const hash = await pbkdf2(password, salt, PBKDF2_ITERATIONS)
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toBase64(salt)}$${toBase64(hash)}`
}

async function verifyPassword(password: string, stored: string) {
  const [scheme, iterations, salt, hash] = stored.split('$')
  if (scheme !== 'pbkdf2' || !iterations || !salt || !hash) return false
  const expected = fromBase64(hash)
  const actual = await pbkdf2(password, fromBase64(salt), Number(iterations))
  return actual.length === expected.length && crypto.subtle.timingSafeEqual(actual, expected)
}

/**
 * Checked against when the username doesn't exist, so a wrong username takes as long as a wrong password.
 * Built on first use: Workers don't allow random values at module load.
 */
let dummyHash: Promise<string> | undefined

async function sha256(value: string) {
  return toBase64(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value))))
}

async function createSession(c: Context<AuthEnv>, userId: number) {
  const token = toBase64(crypto.getRandomValues(new Uint8Array(32)))
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)

  // Housekeeping: expired sessions are dropped whenever someone signs in.
  await c.env.DB.batch([
    c.env.DB.prepare("DELETE FROM sessions WHERE expires_at <= datetime('now')"),
    c.env.DB.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)').bind(
      await sha256(token),
      userId,
      toSqlDate(expires),
    ),
  ])

  setCookie(c, COOKIE_NAME, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
    // http://localhost in dev can't carry Secure cookies in every browser.
    secure: new URL(c.req.url).protocol === 'https:',
    expires,
  })
}

/** D1 compares dates as text, so store them in SQLite's own `YYYY-MM-DD HH:MM:SS` form. */
function toSqlDate(date: Date) {
  return date.toISOString().slice(0, 19).replace('T', ' ')
}

async function currentUser(c: Context<AuthEnv>) {
  const token = getCookie(c, COOKIE_NAME)
  if (!token) return null
  return c.env.DB.prepare(
    `SELECT u.id, u.name, u.username
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.id = ? AND s.expires_at > datetime('now')`,
  )
    .bind(await sha256(token))
    .first<User>()
}

async function hasUsers(db: D1Database) {
  return (await db.prepare('SELECT 1 FROM users LIMIT 1').first()) !== null
}

/** Blocks every /api/* route except /api/auth/* for requests without a valid session. */
export const requireSession: MiddlewareHandler<AuthEnv> = async (c, next) => {
  if (c.req.path.startsWith('/api/auth/')) return next()
  const user = await currentUser(c)
  if (!user) return c.json({ error: 'Sua sessão expirou. Entre novamente.' }, 401)
  c.set('user', user)
  return next()
}

export const auth = new Hono<AuthEnv>()

auth.get('/session', async (c) => {
  const user = await currentUser(c)
  const session: AuthSession = { user, needs_setup: user ? false : !(await hasUsers(c.env.DB)) }
  return c.json(session)
})

auth.post('/login', async (c) => {
  const body = await c.req.json<Partial<LoginInput>>().catch(() => null)
  const username = typeof body?.username === 'string' ? body.username.trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  if (!username || !password) return c.json({ error: 'Informe usuário e senha.' }, 400)

  const row = await c.env.DB.prepare('SELECT id, name, username, password_hash FROM users WHERE username = ?')
    .bind(username)
    .first<User & { password_hash: string }>()

  const valid = await verifyPassword(password, row?.password_hash ?? (await (dummyHash ??= hashPassword('dummy-password'))))
  if (!row || !valid) return c.json({ error: 'Usuário ou senha incorretos.' }, 401)

  await createSession(c, row.id)
  return c.json({ id: row.id, name: row.name, username: row.username } satisfies User)
})

/** Creates the first account. Closed for good once any account exists. */
auth.post('/setup', async (c) => {
  const body = await c.req.json<Partial<SetupInput>>().catch(() => null)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const username = typeof body?.username === 'string' ? body.username.trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!name || !username) return c.json({ error: 'Preencha nome e usuário.' }, 400)
  if (/\s/.test(username)) return c.json({ error: 'O usuário não pode ter espaços.' }, 400)
  if (password.length < MIN_PASSWORD_LENGTH) {
    return c.json({ error: `A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.` }, 400)
  }

  // The NOT EXISTS check runs in the same statement as the insert, so two setups at once can't both win.
  const user = await c.env.DB.prepare(
    `INSERT INTO users (name, username, password_hash)
     SELECT ?1, ?2, ?3 WHERE NOT EXISTS (SELECT 1 FROM users)
     RETURNING id, name, username`,
  )
    .bind(name, username, await hashPassword(password))
    .first<User>()

  if (!user) return c.json({ error: 'O acesso já foi configurado. Entre com seu usuário e senha.' }, 409)

  await createSession(c, user.id)
  return c.json(user)
})

/** Changes the signed-in user's password and signs out their other devices. */
auth.post('/password', async (c) => {
  const user = await currentUser(c)
  if (!user) return c.json({ error: 'Sua sessão expirou. Entre novamente.' }, 401)

  const body = await c.req.json<Partial<ChangePasswordInput>>().catch(() => null)
  const current = typeof body?.current_password === 'string' ? body.current_password : ''
  const next = typeof body?.new_password === 'string' ? body.new_password : ''
  if (next.length < MIN_PASSWORD_LENGTH) {
    return c.json({ error: `A nova senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.` }, 400)
  }

  const row = await c.env.DB.prepare('SELECT password_hash FROM users WHERE id = ?')
    .bind(user.id)
    .first<{ password_hash: string }>()
  // 400, not 401: a 401 would send the app back to the login screen.
  if (!row || !(await verifyPassword(current, row.password_hash))) {
    return c.json({ error: 'A senha atual está incorreta.' }, 400)
  }

  const sessionId = await sha256(getCookie(c, COOKIE_NAME) ?? '')
  await c.env.DB.batch([
    c.env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(await hashPassword(next), user.id),
    c.env.DB.prepare('DELETE FROM sessions WHERE user_id = ? AND id <> ?').bind(user.id, sessionId),
  ])
  return c.body(null, 204)
})

auth.post('/logout', async (c) => {
  const token = getCookie(c, COOKIE_NAME)
  if (token) await c.env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(await sha256(token)).run()
  deleteCookie(c, COOKIE_NAME, { path: '/' })
  return c.body(null, 204)
})
