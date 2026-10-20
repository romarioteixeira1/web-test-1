import { useEffect, useId, useRef, type FormEvent, type ReactNode } from 'react'
import { IconClose } from '../layout/icons'

type Props = {
  title: string
  subtitle?: string
  submitLabel: string
  submitting?: boolean
  error?: string | null
  wide?: boolean
  onSubmit: () => void
  onClose: () => void
  children: ReactNode
}

/**
 * Form dialog: closes with the X, "Cancelar", a click on the backdrop or Esc,
 * and moves focus to the first field when it opens.
 */
export function Modal({ title, subtitle = 'Campos com * são obrigatórios.', submitLabel, submitting, error, wide, onSubmit, onClose, children }: Props) {
  const titleId = useId()
  const bodyRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    const first = bodyRef.current?.querySelector<HTMLElement>('input:not([type=hidden]):not(:disabled), select:not(:disabled), textarea:not(:disabled)')
    first?.focus()

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      previouslyFocused?.focus?.()
    }
  }, [])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!submitting) onSubmit()
  }

  return (
    <div
      className="overlay animate-fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className={`modal animate-scale-in ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="modal-head">
          <div>
            <h2 id={titleId}>{title}</h2>
            <span>{subtitle}</span>
          </div>
          <button type="button" className="icon" aria-label="Fechar" onClick={onClose}>
            <IconClose />
          </button>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body" ref={bodyRef}>
            {children}
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="modal-foot">
            <button type="button" className="btn ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn" disabled={submitting}>
              {submitting ? 'Salvando…' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

type FieldProps = {
  label: string
  htmlFor: string
  hint?: string
  className?: string
  children: ReactNode
}

export function Field({ label, htmlFor, hint, className = '', children }: FieldProps) {
  return (
    <div className={`field ${className}`}>
      <label className="lbl" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint && <span className="hint">{hint}</span>}
    </div>
  )
}

export function ChoiceGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: readonly (readonly [T, string])[]
  onChange: (value: T) => void
}) {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }} role="group" aria-label={label}>
      {options.map(([key, text]) => (
        <button key={key} type="button" className="choice" aria-pressed={value === key} onClick={() => onChange(key)}>
          {text}
        </button>
      ))}
    </div>
  )
}
