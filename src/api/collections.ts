import type { CollectionInput, CollectionWithCustomer } from '../../shared/collection'
import { request } from './http'

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
