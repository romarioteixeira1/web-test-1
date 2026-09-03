export type CustomerStatus = 'active' | 'inactive'

export interface Customer {
  id: number
  name: string
  document: string | null
  birth_date: string | null
  phone: string | null
  email: string | null
  street: string | null
  number: string | null
  complement: string | null
  neighborhood: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  notes: string | null
  status: CustomerStatus
  created_at: string
  updated_at: string
}

export type CustomerInput = Omit<Customer, 'id' | 'created_at' | 'updated_at'>

export interface CustomerStats {
  total: number
  active: number
  inactive: number
  recent: Customer[]
}

export const emptyCustomerInput: CustomerInput = {
  name: '',
  document: '',
  birth_date: '',
  phone: '',
  email: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  zip_code: '',
  notes: '',
  status: 'active',
}
