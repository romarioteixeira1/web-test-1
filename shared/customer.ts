export interface Customer {
  id: number
  name: string
  email: string | null
  phone: string | null
  document: string | null
  street: string | null
  number: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type CustomerInput = Omit<Customer, 'id' | 'created_at' | 'updated_at'>

export const emptyCustomerInput: CustomerInput = {
  name: '',
  email: '',
  phone: '',
  document: '',
  street: '',
  number: '',
  city: '',
  state: '',
  zip_code: '',
  notes: '',
}
