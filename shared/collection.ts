export type CollectionType = 'material' | 'servico'

export interface Collection {
  id: number
  customer_id: number
  type: CollectionType
  material_type: string | null
  weight_kg: number | null
  description: string
  amount: number
  collected_at: string
  scheduled_at: string | null
  notes: string | null
  created_at: string
}

export type CollectionInput = Omit<Collection, 'id' | 'customer_id' | 'created_at'>

export const emptyCollectionInput: CollectionInput = {
  type: 'material',
  material_type: '',
  weight_kg: null,
  description: '',
  amount: 0,
  collected_at: new Date().toISOString().slice(0, 10),
  scheduled_at: '',
  notes: '',
}

export const materialTypes = ['Papelão', 'Plástico', 'Metal', 'Vidro', 'Eletrônico', 'Óleo', 'Outro']
