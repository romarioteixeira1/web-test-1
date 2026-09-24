import type { MaterialWithPrice } from '../../shared/material'

export function marginOf(m: MaterialWithPrice) {
  return m.buy_price != null && m.sell_price != null ? m.sell_price - m.buy_price : null
}

/** Average sell − buy across materials that have both prices; null when none do. */
export function averageMargin(materials: MaterialWithPrice[]) {
  const margins = materials.map(marginOf).filter((m): m is number => m != null)
  if (!margins.length) return null
  return margins.reduce((sum, m) => sum + m, 0) / margins.length
}
