import type { AuthSession, ChangePasswordInput, LoginInput, SetupInput, User } from '../../shared/auth'
import { request } from './http'

export function getSession() {
  return request<AuthSession>('/api/auth/session')
}

export function login(input: LoginInput) {
  return request<User>('/api/auth/login', { method: 'POST', body: JSON.stringify(input) })
}

/** Creates the first account; only works while none exists. */
export function setupAccount(input: SetupInput) {
  return request<User>('/api/auth/setup', { method: 'POST', body: JSON.stringify(input) })
}

/** Self sign-up from the login screen; the new account is an `operador`. */
export function register(input: SetupInput) {
  return request<User>('/api/auth/register', { method: 'POST', body: JSON.stringify(input) })
}

export function changePassword(input: ChangePasswordInput) {
  return request<void>('/api/auth/password', { method: 'POST', body: JSON.stringify(input) })
}

export function logout() {
  return request<void>('/api/auth/logout', { method: 'POST' })
}
