import { useState } from 'react'
import type { MaterialPriceInput } from '../../../shared/material'
import { parseDecimal, signedBrl, todayIso } from '../../lib/format'
import { Field, Modal } from '../ui/Modal'

type Props = {
  unit: string
  submitting?: boolean
  error?: string | null
  onSubmit: (input: MaterialPriceInput) => void
  onCancel: () => void
}

export function PriceFormModal({ unit, submitting, error, onSubmit, onCancel }: Props) {
  const [buyText, setBuyText] = useState('')
  const [sellText, setSellText] = useState('')
  const [effectiveAt, setEffectiveAt] = useState(todayIso())
  const [invalid, setInvalid] = useState(false)

  const buy = parseDecimal(buyText)
  const sell = parseDecimal(sellText)
  const margin = (sell ?? 0) - (buy ?? 0)

  function handleSubmit() {
    if (buy == null || sell == null || buy < 0 || sell < 0 || !effectiveAt) {
      setInvalid(true)
      document.getElementById('price-buy')?.focus()
      return
    }
    onSubmit({ buy_price: buy, sell_price: sell, effective_at: effectiveAt })
  }

  return (
    <Modal
      title="Novo preço"
      submitLabel="Cadastrar"
      submitting={submitting}
      error={invalid ? 'Informe os dois preços, maiores ou iguais a zero (ex.: 1,50).' : error}
      onSubmit={handleSubmit}
      onClose={onCancel}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label={`Preço de compra (R$/${unit}) *`} htmlFor="price-buy">
          <input
            id="price-buy"
            className={`inp mono ${invalid ? 'invalid' : ''}`}
            inputMode="decimal"
            placeholder="0,00"
            value={buyText}
            onChange={(e) => {
              setBuyText(e.target.value)
              setInvalid(false)
            }}
          />
        </Field>
        <Field label={`Preço de venda (R$/${unit}) *`} htmlFor="price-sell">
          <input
            id="price-sell"
            className={`inp mono ${invalid ? 'invalid' : ''}`}
            inputMode="decimal"
            placeholder="0,00"
            value={sellText}
            onChange={(e) => {
              setSellText(e.target.value)
              setInvalid(false)
            }}
          />
        </Field>
      </div>

      <Field label="Vigente a partir de *" htmlFor="price-date">
        <input
          id="price-date"
          type="date"
          className="inp"
          value={effectiveAt}
          onChange={(e) => setEffectiveAt(e.target.value)}
        />
      </Field>

      <div className="margin-box">
        <span className="lbl">Margem por {unit}</span>
        <strong className={`mono ${margin >= 0 ? 'pos' : 'neg'}`}>{signedBrl(margin)}</strong>
      </div>
    </Modal>
  )
}
