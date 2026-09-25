export interface Company {
  trade_name: string
  legal_name: string | null
  cnpj: string | null
  state_registration: string | null
  phone: string | null
  email: string | null
  street: string | null
  number: string | null
  complement: string | null
  neighborhood: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  /** Licença ambiental de operação (LO) exigida para empresas de reciclagem. */
  license_number: string | null
  license_agency: string | null
  license_expires_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type CompanyInput = Omit<Company, 'created_at' | 'updated_at'>

export const emptyCompanyInput: CompanyInput = {
  trade_name: '',
  legal_name: '',
  cnpj: '',
  state_registration: '',
  phone: '',
  email: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  zip_code: '',
  license_number: '',
  license_agency: '',
  license_expires_at: '',
  notes: '',
}
