import type { Company, CompanyInput } from '../../shared/company'
import { request } from './http'

/** Returns null while the company hasn't been registered yet. */
export function getCompany() {
  return request<Company | null>('/api/company')
}

export function saveCompany(input: CompanyInput) {
  return request<Company>('/api/company', {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}
