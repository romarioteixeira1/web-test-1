import { useState } from 'react'
import {
  commonUnits,
  emptyMaterialTypeInput,
  materialCategories,
  type MaterialCategory,
  type MaterialPriceInput,
  type MaterialTypeInput,
  type MaterialWithPrice,
} from '../../../shared/material'
import { parseDecimal, signedBrl, toDecimalInput, todayIso } from '../../lib/format'
import { Field, Modal } from '../ui/Modal'

type Props = {
  mode: 'create' | 'edit'
  initialValue?: MaterialWithPrice
  submitting?: boolean
  error?: string | null
  onSubmit: (input: MaterialTypeInput, price: MaterialPriceInput | null) => void
  onCancel: () => void
}

export function MaterialFormModal({ mode, initialValue, submitting, error, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<MaterialTypeInput>(
    initialValue
      ? {
          parent_id: initialValue.parent_id,
          name: initialValue.name,
          category: initialValue.category,
          unit: initialValue.unit,
          status: initialValue.status,
        }
      : emptyMaterialTypeInput,
  )
  const [customUnit, setCustomUnit] = useState(!commonUnits.includes(form.unit))
  const [buyText, setBuyText] = useState(toDecimalInput(initialValue?.buy_price))
  const [sellText, setSellText] = useState(toDecimalInput(initialValue?.sell_price))
  const [localError, setLocalError] = useState<{ field: 'name' | 'price'; message: string } | null>(null)

  function set<K extends keyof MaterialTypeInput>(key: K, value: MaterialTypeInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const buy = parseDecimal(buyText)
  const sell = parseDecimal(sellText)
  const margin = (sell ?? 0) - (buy ?? 0)

  function handleSubmit() {
    if (!form.name.trim()) {
      setLocalError({ field: 'name', message: 'Preencha o nome antes de salvar.' })
      document.getElementById('material-name')?.focus()
      return
    }

    const hasBuy = buyText.trim() !== ''
    const hasSell = sellText.trim() !== ''
    if (hasBuy !== hasSell) {
      setLocalError({ field: 'price', message: 'Preencha os dois preços (compra e venda) ou deixe ambos em branco.' })
      return
    }
    if (hasBuy && (buy == null || sell == null || buy < 0 || sell < 0)) {
      setLocalError({ field: 'price', message: 'Informe preços válidos, maiores ou iguais a zero (ex.: 1,50).' })
      return
    }

    // A new price entry is only recorded when the prices actually changed.
    const priceChanged = hasBuy && (buy !== initialValue?.buy_price || sell !== initialValue?.sell_price)
    const price: MaterialPriceInput | null =
      priceChanged && buy != null && sell != null ? { buy_price: buy, sell_price: sell, effective_at: todayIso() } : null

    onSubmit(form, price)
  }

  return (
    <Modal
      title={mode === 'edit' ? 'Editar material' : 'Novo material'}
      submitLabel={mode === 'edit' ? 'Salvar alterações' : 'Cadastrar'}
      submitting={submitting}
      error={localError?.message ?? error}
      onSubmit={handleSubmit}
      onClose={onCancel}
    >
      <Field label="Nome do material *" htmlFor="material-name">
        <input
          id="material-name"
          className={`inp ${localError?.field === 'name' ? 'invalid' : ''}`}
          value={form.name}
          placeholder="Ex.: Papelão, PET, Alumínio…"
          onChange={(e) => {
            set('name', e.target.value)
            setLocalError(null)
          }}
        />
      </Field>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Categoria" htmlFor="material-category">
          <select
            id="material-category"
            className="inp"
            value={form.category ?? ''}
            onChange={(e) => set('category', (e.target.value || null) as MaterialCategory | null)}
          >
            {form.category == null && <option value="">Sem categoria</option>}
            {materialCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Unidade" htmlFor="material-unit">
          {customUnit ? (
            <input
              id="material-unit"
              className="inp"
              value={form.unit}
              placeholder="kg"
              onChange={(e) => set('unit', e.target.value)}
            />
          ) : (
            <select
              id="material-unit"
              className="inp"
              value={form.unit}
              onChange={(e) => {
                if (e.target.value === '__custom__') {
                  setCustomUnit(true)
                  return
                }
                set('unit', e.target.value)
              }}
            >
              {commonUnits.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
              <option value="__custom__">Outra…</option>
            </select>
          )}
        </Field>
        <Field label="Status" htmlFor="material-status">
          <select
            id="material-status"
            className="inp"
            value={form.status}
            onChange={(e) => set('status', e.target.value as MaterialTypeInput['status'])}
          >
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label={`Preço de compra (R$/${form.unit || 'kg'})`} htmlFor="material-buy">
          <input
            id="material-buy"
            className={`inp mono ${localError?.field === 'price' ? 'invalid' : ''}`}
            inputMode="decimal"
            placeholder="0,00"
            value={buyText}
            onChange={(e) => {
              setBuyText(e.target.value)
              setLocalError(null)
            }}
          />
        </Field>
        <Field label={`Preço de venda (R$/${form.unit || 'kg'})`} htmlFor="material-sell">
          <input
            id="material-sell"
            className={`inp mono ${localError?.field === 'price' ? 'invalid' : ''}`}
            inputMode="decimal"
            placeholder="0,00"
            value={sellText}
            onChange={(e) => {
              setSellText(e.target.value)
              setLocalError(null)
            }}
          />
        </Field>
      </div>

      <div className="margin-box">
        <span className="lbl">Margem por {form.unit || 'kg'}</span>
        <strong className={`mono ${margin >= 0 ? 'pos' : 'neg'}`}>{signedBrl(margin)}</strong>
      </div>
      <span className="hint -mt-2">
        Ao mudar os preços, um novo registro vigente a partir de hoje entra no histórico do material.
      </span>
    </Modal>
  )
}
