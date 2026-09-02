import type { Customer, CustomerInput } from '../../shared/customer'

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
