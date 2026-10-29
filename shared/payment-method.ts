export type PaymentKind = 'a_vista' | 'a_prazo'

export interface PaymentMethodRecord {
  id: number
  code: string
  name: string
  kind: PaymentKind
  term_days: number
  use_purchases: boolean
  use_sales: boolean
  active: boolean
  created_at: string
  updated_at: string
}

export type PaymentMethodInput = Pick<
  PaymentMethodRecord,
  'name' | 'kind' | 'term_days' | 'use_purchases' | 'use_sales' | 'active'
>

export const emptyPaymentMethodInput: PaymentMethodInput = {
  name: '',
  kind: 'a_vista',
  term_days: 0,
  use_purchases: true,
  use_sales: true,
  active: true,
}

export const paymentKindLabels: Record<PaymentKind, string> = {
  a_vista: 'À vista',
  a_prazo: 'A prazo',
}
