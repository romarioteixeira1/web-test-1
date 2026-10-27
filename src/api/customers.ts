import type { Customer, CustomerInput, CustomerStats } from '../../shared/customer'
import { request } from './http'

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
