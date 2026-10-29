import type { UserInput, UserRecord } from '../../shared/auth'
import { request } from './http'

export function listUsers() {
  return request<UserRecord[]>('/api/users')
}

export function createUser(input: UserInput) {
  return request<UserRecord>('/api/users', { method: 'POST', body: JSON.stringify(input) })
}

/** An empty `password` keeps the current one. */
export function updateUser(id: number, input: UserInput) {
  return request<UserRecord>(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(input) })
}

export function deleteUser(id: number) {
  return request<void>(`/api/users/${id}`, { method: 'DELETE' })
}
