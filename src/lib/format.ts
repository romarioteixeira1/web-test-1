/** Formatting and parsing helpers shared by every screen (pt-BR). */

export function brl(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/** Signed currency for margins: "+ R$ 1,20" / "− R$ 0,50". */
export function signedBrl(value: number) {
  return `${value >= 0 ? '+' : '−'} ${brl(Math.abs(value))}`
}

export function decimal(value: number, maxDigits = 2) {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: maxDigits })
}

export function weight(value: number, unit = 'kg') {
  return `${decimal(value, 1)} ${unit}`
}

/** Text shown in a price input: 1.5 -> "1,50". */
export function toDecimalInput(value: number | null | undefined) {
  return value == null ? '' : value.toFixed(2).replace('.', ',')
}

/** Parses "1.234,56", "1234,56" or "1234.56" into a number. Returns null for blank or invalid input. */
export function parseDecimal(text: string): number | null {
  const raw = text.trim().replace(/\s|R\$/g, '')
  if (!raw) return null
  const normalized = raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw
  const n = Number(normalized)
  return Number.isFinite(n) ? n : null
}

/** "2026-09-24" -> "24/09/2026" without timezone shifts. */
export function dateOnly(value: string) {
  const [year, month, day] = value.slice(0, 10).split('-')
  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
}

/** SQLite "YYYY-MM-DD HH:MM:SS" (UTC) or ISO string -> local date. */
export function dateFromDb(value: string) {
  const date = new Date(value.includes(' ') ? value.replace(' ', 'T') + 'Z' : value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('pt-BR')
}

export function dateTime(value: string | null) {
  if (!value) return '—'
  const date = new Date(value.includes(' ') ? value.replace(' ', 'T') + 'Z' : value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export function todayIso() {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

export function daysAgoIso(days: number) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

export function initials(name: string) {
  const words = name.split(/\s+/).filter((w) => w.length > 2)
  const picked = (words.length ? words : name.split(/\s+/)).slice(0, 2)
  return picked.map((w) => w[0]?.toUpperCase() ?? '').join('') || '?'
}

export function abbreviation(name: string) {
  return name.replace(/[^A-Za-zÀ-ú0-9]/g, '').slice(0, 2).toUpperCase() || '?'
}

export function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`
}

/** Share of a total as a bar width (6–100%), so small values stay visible. */
export function share(value: number, total: number) {
  if (!total) return 6
  return Math.max(6, Math.min(100, Math.round((value / total) * 100)))
}

export function matches(query: string, ...fields: (string | null | undefined)[]) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return fields.some((f) => f?.toLowerCase().includes(q))
}

export function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback
}
