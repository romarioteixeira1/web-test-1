import { useState } from 'react'
import type { Customer, RelationshipType } from '../../../shared/customer'
import { materialCategories, type MaterialWithPrice } from '../../../shared/material'
import { brl } from '../../lib/format'
import { marginOf } from '../../lib/metrics'

/** Top 7 materials by margin per kg, as horizontal bars. */
export function MarginChart({ materials }: { materials: MaterialWithPrice[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const top = materials
    .map((m) => ({ m, margin: marginOf(m) }))
    .filter((r): r is { m: MaterialWithPrice; margin: number } => r.margin != null)
    .sort((a, b) => b.margin - a.margin)
    .slice(0, 7)
  const max = Math.max(...top.map((r) => Math.abs(r.margin)), 0) || 1
  const active = hover != null ? top[hover] : null

  return (
    <section className="card chart" aria-labelledby="ch-margem">
      <div className="chart-head">
        <div>
          <h2 id="ch-margem">Margem por kg</h2>
          <span>Venda menos compra, por material</span>
        </div>
      </div>
      {top.length === 0 ? (
        <div className="empty">Nenhum material com preço de compra e venda.</div>
      ) : (
        <div className={`hbars ${active ? 'hovering' : ''}`} onMouseLeave={() => setHover(null)}>
          {top.map((r, i) => (
            <div
              key={r.m.id}
              className={`hbar ${hover === i ? 'on' : ''}`}
              onMouseEnter={() => setHover(i)}
              aria-label={`${r.m.name}: margem de ${brl(r.margin)}`}
            >
              <span className="n">{r.m.name}</span>
              <span className="t">
                <span
                  className={`f ${r.margin < 0 ? 'neg' : ''}`}
                  style={{ width: `${Math.max(2, Math.round((Math.abs(r.margin) / max) * 100))}%` }}
                />
              </span>
              <span className={`v mono ${r.margin < 0 ? 'neg' : ''}`}>{brl(r.margin)}</span>
            </div>
          ))}
        </div>
      )}
      <div className={`tip ${active ? 'on' : ''}`}>
        {active
          ? `${active.m.name} · compra ${brl(active.m.buy_price!)} · venda ${brl(active.m.sell_price!)} · margem ${brl(active.margin)}`
          : 'Passe o mouse numa barra para ver os preços.'}
      </div>
    </section>
  )
}

const segmentInfo: { key: RelationshipType; label: string; singular: string; color: string }[] = [
  { key: 'fornecedor', label: 'Fornecedores', singular: 'fornecedores', color: '#1E6B2A' },
  { key: 'comprador', label: 'Compradores', singular: 'compradores', color: '#8FD16A' },
  { key: 'ambos', label: 'Ambos', singular: 'fornecem e compram', color: '#2E9A30' },
]

/** Customers split by relationship, as a donut. "Ambos" only appears when someone has that type. */
export function CustomerDonut({ customers }: { customers: Customer[] }) {
  const [hover, setHover] = useState<RelationshipType | null>(null)
  const counts = segmentInfo
    .map((s) => ({ ...s, n: customers.filter((c) => c.relationship_type === s.key).length }))
    .filter((s) => s.key !== 'ambos' || s.n > 0)
  const total = customers.length
  const C = 2 * Math.PI * 70
  const visible = counts.filter((s) => s.n > 0)
  const gap = visible.length > 1 ? 3 : 0

  const lengths = counts.map((s) => (total ? (s.n / total) * C : 0))
  const arcs = counts.map((s, i) => ({
    ...s,
    len: Math.max(lengths[i] - gap, 0),
    offset: lengths.slice(0, i).reduce((sum, l) => sum + l, 0),
  }))

  const hovered = counts.find((s) => s.key === hover)
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0)

  return (
    <section className="card chart" aria-labelledby="ch-clientes">
      <div className="chart-head">
        <div>
          <h2 id="ch-clientes">Clientes por tipo</h2>
          <span>Quem vende e quem compra de você</span>
        </div>
      </div>
      <div className="donut-wrap" onMouseLeave={() => setHover(null)}>
        <svg
          width="190"
          height="190"
          viewBox="0 0 190 190"
          role="img"
          aria-label={`Clientes por tipo: ${counts.map((s) => `${s.n} ${s.label.toLowerCase()}`).join(', ')}`}
        >
          <circle cx="95" cy="95" r="70" fill="none" stroke="#EEF3EA" strokeWidth="24" />
          {arcs.map(
            (a) =>
              a.len > 0 && (
                <circle
                  key={a.key}
                  className="seg"
                  cx="95"
                  cy="95"
                  r="70"
                  fill="none"
                  stroke={a.color}
                  strokeWidth={hover === a.key ? 30 : 24}
                  strokeDasharray={`${a.len} ${C - a.len}`}
                  strokeDashoffset={-a.offset}
                  onMouseEnter={() => setHover(a.key)}
                />
              ),
          )}
        </svg>
        <div className="donut-center">
          <span className="v mono">{hovered ? hovered.n : total}</span>
          <span className="l">{hovered ? hovered.singular : 'clientes'}</span>
        </div>
      </div>
      <div className="legend">
        {counts.map((s) => (
          <div key={s.key} className="legend-item">
            <span className="sw" style={{ background: s.color }} />
            <span>
              <span className="l">{s.label}</span>
              <span className="v mono">
                {s.n} · {pct(s.n)}%
              </span>
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

/** Number of materials in each category, as columns. */
export function CategoryChart({ materials }: { materials: MaterialWithPrice[] }) {
  const [hover, setHover] = useState<string | null>(null)
  const uncategorized = materials.filter((m) => !m.category).length
  const cats: string[] = [...materialCategories, ...(uncategorized ? ['Sem categoria'] : [])]
  const countOf = (c: string) =>
    c === 'Sem categoria' ? uncategorized : materials.filter((m) => m.category === c).length
  const max = Math.max(...cats.map(countOf), 0) || 1
  const columns = { gridTemplateColumns: `repeat(${cats.length}, minmax(0, 1fr))` }

  const names = hover
    ? materials
        .filter((m) => (hover === 'Sem categoria' ? !m.category : m.category === hover))
        .map((m) => m.name)
        .join(', ')
    : ''
  const n = hover ? countOf(hover) : 0

  return (
    <section className="card chart" aria-labelledby="ch-cat">
      <div className="chart-head">
        <div>
          <h2 id="ch-cat">Materiais por categoria</h2>
          <span>Quantos materiais você cadastrou em cada uma</span>
        </div>
      </div>
      <div className={`vbars ${hover ? 'hovering' : ''}`} style={columns} onMouseLeave={() => setHover(null)}>
        {cats.map((c) => {
          const count = countOf(c)
          return (
            <div
              key={c}
              className={`vbar ${hover === c ? 'on' : ''}`}
              onMouseEnter={() => setHover(c)}
              aria-label={`${c}: ${count}`}
            >
              <span className="v mono">{count}</span>
              <span className="b" style={{ height: count ? `${Math.round((count / max) * 100)}%` : '2%' }} />
            </div>
          )
        })}
      </div>
      <div className="vlabels" style={columns}>
        {cats.map((c) => (
          <span key={c} title={c}>
            {c}
          </span>
        ))}
      </div>
      <div className={`tip ${hover ? 'on' : ''}`}>
        {hover
          ? `${hover}: ${n} ${n === 1 ? 'material' : 'materiais'}${names ? ` · ${names}` : ''}`
          : 'Passe o mouse numa coluna para ver os materiais.'}
      </div>
    </section>
  )
}
