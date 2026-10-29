import type { PaymentMethodInput, PaymentMethodRecord } from '../../shared/payment-method'
import { request } from './http'

export function listPaymentMethods() {
  return request<PaymentMethodRecord[]>('/api/payment-methods')
}

export function createPaymentMethod(input: PaymentMethodInput) {
  return request<PaymentMethodRecord>('/api/payment-methods', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updatePaymentMethod(id: number, input: PaymentMethodInput) {
  return request<PaymentMethodRecord>(`/api/payment-methods/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function setPaymentMethodActive(id: number, active: boolean) {
  return request<PaymentMethodRecord>(`/api/payment-methods/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ active }),
  })
}

export function deletePaymentMethod(id: number) {
  return request<void>(`/api/payment-methods/${id}`, { method: 'DELETE' })
}
