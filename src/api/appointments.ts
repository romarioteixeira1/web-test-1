import type {
  AppointmentInput,
  AppointmentStatus,
  AppointmentWithDetails,
  Vehicle,
  VehicleInput,
} from '../../shared/appointment'

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

export function listAppointments(filters?: { from?: string; to?: string; status?: string; vehicleId?: number }) {
  const params = new URLSearchParams()
  if (filters?.from) params.set('from', filters.from)
  if (filters?.to) params.set('to', filters.to)
  if (filters?.status) params.set('status', filters.status)
  if (filters?.vehicleId) params.set('vehicle_id', String(filters.vehicleId))
  const search = params.toString() ? `?${params.toString()}` : ''
  return request<AppointmentWithDetails[]>(`/api/appointments${search}`)
}

export function createAppointment(input: AppointmentInput) {
  return request<AppointmentWithDetails>('/api/appointments', { method: 'POST', body: JSON.stringify(input) })
}

export function updateAppointment(id: number, input: AppointmentInput) {
  return request<AppointmentWithDetails>(`/api/appointments/${id}`, { method: 'PUT', body: JSON.stringify(input) })
}

export function updateAppointmentStatus(id: number, status: AppointmentStatus) {
  return request<AppointmentWithDetails>(`/api/appointments/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export function deleteAppointment(id: number) {
  return request<void>(`/api/appointments/${id}`, { method: 'DELETE' })
}

export function sendAppointmentReminder(id: number) {
  return request<{ ok: true }>(`/api/appointments/${id}/reminder`, { method: 'POST' })
}

export function listVehicles() {
  return request<Vehicle[]>('/api/vehicles')
}

export function createVehicle(input: VehicleInput) {
  return request<Vehicle>('/api/vehicles', { method: 'POST', body: JSON.stringify(input) })
}

export function updateVehicle(id: number, input: VehicleInput) {
  return request<Vehicle>(`/api/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(input) })
}

export function deleteVehicle(id: number) {
  return request<void>(`/api/vehicles/${id}`, { method: 'DELETE' })
}
