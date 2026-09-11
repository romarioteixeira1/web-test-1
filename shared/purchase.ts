export interface Purchase {
  id: number
  customer_id: number
  description: string
  amount: number
  purchased_at: string
  notes: string | null
  created_at: string
}

export type PurchaseInput = Omit<Purchase, 'id' | 'customer_id' | 'created_at'>

export const emptyPurchaseInput: PurchaseInput = {
  description: '',
  amount: 0,
  purchased_at: new Date().toISOString().slice(0, 10),
  notes: '',
}
