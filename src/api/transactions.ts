import type { TransactionInput, TransactionWithDetails } from '../../shared/transaction'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error ?? `Erro ${res.status}`)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

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
