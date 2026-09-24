import type { PaymentMethodInput, PaymentMethodRecord } from '../../shared/payment-method'

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
