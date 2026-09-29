import type { PaymentMethod } from './customer'

export type TransactionType = 'compra' | 'venda'
export type PaymentStatus = 'pago' | 'a_pagar' | 'parcelado'

export interface Transaction {
  id: number
  customer_id: number
  material_type_id: number
  transaction_type: TransactionType
  weight: number
  unit_price: number
  total_amount: number
  payment_method: PaymentMethod | null
  payment_status: PaymentStatus
  installments: number | null
  transacted_at: string
  notes: string | null
  created_at: string
  updated_at: string
}

export type TransactionInput = Omit<
  Transaction,
  'id' | 'customer_id' | 'total_amount' | 'created_at' | 'updated_at'
> & {
  customer_id: number | null
}

export interface TransactionWithDetails extends Transaction {
  customer_name: string
  payment_method_name: string | null
  material_name: string
  material_unit: string
}

export const emptyTransactionInput: TransactionInput = {
  customer_id: null,
  material_type_id: 0,
  transaction_type: 'compra',
  weight: 0,
  unit_price: 0,
  payment_method: null,
  payment_status: 'a_pagar',
  installments: null,
  transacted_at: new Date().toISOString().slice(0, 10),
  notes: '',
}

/** Interest-free installment limit for on-term ("a prazo") payments. */
export const MAX_INSTALLMENTS = 10

/** Splits a total into equal parcels in cents; the leftover cent (if any) goes to the first parcel. */
export function splitInstallments(total: number, count: number) {
  const cents = Math.round(total * 100)
  const base = Math.floor(cents / count)
  return { first: (cents - base * (count - 1)) / 100, rest: base / 100 }
}

export const transactionTypeLabels: Record<TransactionType, string> = {
  compra: 'Compra',
  venda: 'Venda',
}

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  pago: 'Pago',
  a_pagar: 'A pagar',
  parcelado: 'Parcelado',
}
