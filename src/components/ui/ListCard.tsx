import { useEffect, useRef, type ReactNode } from 'react'
import { plural } from '../../lib/format'

type Props = {
  title: string
  count?: number
  actions?: ReactNode
  children: ReactNode
  className?: string
}

/**
 * Copies each column's header text onto its cells as `data-label`. On phones the CSS turns every
 * row into a card and shows that label next to each value (see "tabelas viram cartões" in components.css).
 */
function labelCells(wrap: HTMLElement) {
  for (const table of wrap.querySelectorAll('table')) {
    const headers = [...table.querySelectorAll('thead th')].map((th) => th.textContent?.trim() ?? '')
    for (const row of table.querySelectorAll('tbody tr, tfoot tr')) {
      let column = 0
      for (const cell of (row as HTMLTableRowElement).cells) {
        const label = headers[column] ?? ''
        if (cell.dataset.label !== label) cell.dataset.label = label
        column += cell.colSpan
      }
    }
  }
}

/** White card with a title row (title + item count + filters) and a scrollable table area. */
export function ListCard({ title, count, actions, children, className = '' }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)

  // Rows come and go as the list filters, so relabel whenever the table's DOM changes.
  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    labelCells(wrap)
    const observer = new MutationObserver(() => labelCells(wrap))
    observer.observe(wrap, { childList: true, subtree: true, characterData: true })
    return () => observer.disconnect()
  }, [])

  return (
    <section className={`card list ${className}`}>
      <div className="card-head">
        <div className="card-title">
          <h2>{title}</h2>
          {count != null && <span className="pill mono">{plural(count, 'item', 'itens')}</span>}
        </div>
        {actions}
      </div>
      <div className="table-wrap" ref={wrapRef}>
        {children}
      </div>
    </section>
  )
}

type SegmentedProps<T extends string> = {
  label: string
  value: T
  options: readonly (readonly [T, string])[]
  onChange: (value: T) => void
}

export function Segmented<T extends string>({ label, value, options, onChange }: SegmentedProps<T>) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map(([key, text]) => (
        <button key={key} type="button" aria-pressed={value === key} onClick={() => onChange(key)}>
          {text}
        </button>
      ))}
    </div>
  )
}

export function EmptyState({ title = 'Nada encontrado', message = 'Ajuste a busca ou cadastre um novo item.' }) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      {message}
    </div>
  )
}

export function Loading({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div className="loading" role="status">
      <span className="spinner" aria-hidden="true" />
      {label}
    </div>
  )
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="error-box" role="alert">
      <span>Não foi possível carregar os dados. {message}</span>
      {onRetry && (
        <button type="button" className="btn ghost" onClick={onRetry}>
          Tentar de novo
        </button>
      )}
    </div>
  )
}
