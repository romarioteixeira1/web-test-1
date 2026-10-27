export type User = {
  id: number
  name: string
  username: string
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
