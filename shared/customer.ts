export type CustomerStatus = 'active' | 'inactive'
export type PersonType = 'fisica' | 'juridica'
export type RelationshipType = 'fornecedor' | 'comprador' | 'ambos'
export type PaymentMethod = 'pix' | 'dinheiro' | 'transferencia'

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
  person_type: PersonType
  company_name: string | null
  state_registration: string | null
  relationship_type: RelationshipType
  payment_method: PaymentMethod | null
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
  person_type: 'fisica',
  company_name: '',
  state_registration: '',
  relationship_type: 'comprador',
  payment_method: null,
}

export const relationshipTypeLabels: Record<RelationshipType, string> = {
  fornecedor: 'Fornecedor',
  comprador: 'Comprador',
  ambos: 'Ambos',
}

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  pix: 'Pix',
  dinheiro: 'Dinheiro',
  transferencia: 'Transferência',
}
