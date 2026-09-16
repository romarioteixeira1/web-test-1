import type { Customer, CustomerInput, CustomerStats } from '../../shared/customer'
import type { Collection, CollectionInput } from '../../shared/collection'

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

export function listCustomers(query?: string) {
  const search = query?.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''
  return request<Customer[]>(`/api/customers${search}`)
}

export function getCustomer(id: number) {
  return request<Customer>(`/api/customers/${id}`)
}

export function getCustomerStats() {
  return request<CustomerStats>('/api/customers/stats')
}

export function createCustomer(input: CustomerInput) {
  return request<Customer>('/api/customers', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateCustomer(id: number, input: CustomerInput) {
  return request<Customer>(`/api/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function deleteCustomer(id: number) {
  return request<void>(`/api/customers/${id}`, { method: 'DELETE' })
}

export function listCollections(customerId: number) {
  return request<Collection[]>(`/api/customers/${customerId}/collections`)
}

export function createCollection(customerId: number, input: CollectionInput) {
  return request<Collection>(`/api/customers/${customerId}/collections`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateCollection(id: number, input: CollectionInput) {
  return request<Collection>(`/api/collections/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function deleteCollection(id: number) {
  return request<void>(`/api/collections/${id}`, { method: 'DELETE' })
}
