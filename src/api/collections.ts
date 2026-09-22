import type { CollectionInput, CollectionWithCustomer } from '../../shared/collection'

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

export function listCollections(params?: { customerId?: number }) {
  const search = params?.customerId ? `?customer_id=${params.customerId}` : ''
  return request<CollectionWithCustomer[]>(`/api/collections${search}`)
}

export function createCollection(input: CollectionInput) {
  return request<CollectionWithCustomer>('/api/collections', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateCollection(id: number, input: CollectionInput) {
  return request<CollectionWithCustomer>(`/api/collections/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function deleteCollection(id: number) {
  return request<void>(`/api/collections/${id}`, { method: 'DELETE' })
}
