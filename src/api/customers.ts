import type { Customer, CustomerInput, CustomerStats } from '../../shared/customer'
import type { Purchase, PurchaseInput } from '../../shared/purchase'

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

export function listPurchases(customerId: number) {
  return request<Purchase[]>(`/api/customers/${customerId}/purchases`)
}

export function createPurchase(customerId: number, input: PurchaseInput) {
  return request<Purchase>(`/api/customers/${customerId}/purchases`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function deletePurchase(id: number) {
  return request<void>(`/api/purchases/${id}`, { method: 'DELETE' })
}
