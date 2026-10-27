import type { TransactionInput, TransactionWithDetails } from '../../shared/transaction'
import { request } from './http'

export function listTransactions(filters?: { customerId?: number; status?: string }) {
  const params = new URLSearchParams()
  if (filters?.customerId) params.set('customer_id', String(filters.customerId))
  if (filters?.status) params.set('status', filters.status)
  const search = params.toString() ? `?${params.toString()}` : ''
  return request<TransactionWithDetails[]>(`/api/transactions${search}`)
}

export function getTransaction(id: number) {
  return request<TransactionWithDetails>(`/api/transactions/${id}`)
}

export function createTransaction(input: TransactionInput) {
  return request<TransactionWithDetails>('/api/transactions', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateTransaction(id: number, input: TransactionInput) {
  return request<TransactionWithDetails>(`/api/transactions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function deleteTransaction(id: number) {
  return request<void>(`/api/transactions/${id}`, { method: 'DELETE' })
}
