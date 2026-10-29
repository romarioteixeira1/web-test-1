export type MaterialStatus = 'active' | 'inactive'

export const materialCategories = ['Papel', 'Plástico', 'Metal', 'Vidro', 'Eletrônico'] as const
export type MaterialCategory = (typeof materialCategories)[number]

export interface MaterialType {
  id: number
  parent_id: number | null
  name: string
  category: MaterialCategory | null
  unit: string
  status: MaterialStatus
  created_at: string
  updated_at: string
}

export type MaterialTypeInput = Omit<MaterialType, 'id' | 'created_at' | 'updated_at'>

export const emptyMaterialTypeInput: MaterialTypeInput = {
  parent_id: null,
  name: '',
  category: 'Papel',
  unit: 'kg',
  status: 'active',
}

export interface MaterialWithPrice extends MaterialType {
  buy_price: number | null
  sell_price: number | null
  price_effective_at: string | null
}

export interface MaterialPrice {
  id: number
  material_type_id: number
  buy_price: number
  sell_price: number
  effective_at: string
  created_at: string
}

export type MaterialPriceInput = Omit<MaterialPrice, 'id' | 'material_type_id' | 'created_at'>

export const emptyMaterialPriceInput: MaterialPriceInput = {
  buy_price: 0,
  sell_price: 0,
  effective_at: new Date().toISOString().slice(0, 10),
}

export const commonUnits = ['kg', 'g', 'ton', 'unidade', 'litro']

export function orderMaterialHierarchy<T extends { id: number; parent_id: number | null }>(items: T[]) {
  const byParent = new Map<number | null, T[]>()
  for (const item of items) {
    const list = byParent.get(item.parent_id) ?? []
    list.push(item)
    byParent.set(item.parent_id, list)
  }

  const ordered: { item: T; depth: number }[] = []
  function walk(parentId: number | null, depth: number) {
    for (const item of byParent.get(parentId) ?? []) {
      ordered.push({ item, depth })
      walk(item.id, depth + 1)
    }
  }
  walk(null, 0)
  return ordered
}
