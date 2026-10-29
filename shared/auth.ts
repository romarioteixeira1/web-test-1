/** `admin` also manages the users screen; `operador` uses everything else. */
export type UserRole = 'admin' | 'operador'

export const userRoleLabels: Record<UserRole, string> = {
  admin: 'Administrador',
  operador: 'Operador',
}

export type User = {
  id: number
  name: string
  username: string
  role: UserRole
}

/** A row on the users screen. */
export type UserRecord = User & {
  created_at: string
}

/** Creating needs `password`; when editing, an empty one keeps the current password. */
export type UserInput = {
  name: string
  username: string
  role: UserRole
  password: string
}

/** What GET /api/auth/session returns. `needs_setup` is true while no account exists yet. */
export type AuthSession = {
  user: User | null
  needs_setup: boolean
}

export type LoginInput = {
  username: string
  password: string
}

export type SetupInput = LoginInput & {
  name: string
}

export type ChangePasswordInput = {
  current_password: string
  new_password: string
}

export const MIN_PASSWORD_LENGTH = 8
