import type { Company, CompanyInput } from '../../shared/company'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error ?? `Erro ${res.status}`)
  }

  return res.json() as Promise<T>
}

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
