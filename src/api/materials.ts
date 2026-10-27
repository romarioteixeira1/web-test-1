import type {
  MaterialPrice,
  MaterialPriceInput,
  MaterialTypeInput,
  MaterialWithPrice,
} from '../../shared/material'
import { request } from './http'

export function listMaterials() {
  return request<MaterialWithPrice[]>('/api/materials')
}

export function getMaterial(id: number) {
  return request<MaterialWithPrice>(`/api/materials/${id}`)
}

export function createMaterial(input: MaterialTypeInput) {
  return request<MaterialWithPrice>('/api/materials', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateMaterial(id: number, input: MaterialTypeInput) {
  return request<MaterialWithPrice>(`/api/materials/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function deleteMaterial(id: number) {
  return request<void>(`/api/materials/${id}`, { method: 'DELETE' })
}

export function listMaterialPrices(materialId: number) {
  return request<MaterialPrice[]>(`/api/materials/${materialId}/prices`)
}

export function createMaterialPrice(materialId: number, input: MaterialPriceInput) {
  return request<MaterialPrice>(`/api/materials/${materialId}/prices`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function deleteMaterialPrice(priceId: number) {
  return request<void>(`/api/materials/prices/${priceId}`, { method: 'DELETE' })
}
