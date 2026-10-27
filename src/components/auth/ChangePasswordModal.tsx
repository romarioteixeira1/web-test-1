import { useState } from 'react'
import { MIN_PASSWORD_LENGTH } from '../../../shared/auth'
import { changePassword } from '../../api/auth'
import { useToast } from '../../app/context'
import { errorMessage } from '../../lib/format'
import { Field, Modal } from '../ui/Modal'

export function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const toast = useToast()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!current) return setError('Informe a senha atual.')
    if (next.length < MIN_PASSWORD_LENGTH) {
      return setError(`A nova senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`)
    }
    if (next !== confirm) return setError('As senhas novas não conferem.')

    setSubmitting(true)
    setError(null)
    try {
      await changePassword({ current_password: current, new_password: next })
      toast('Senha alterada')
      onClose()
    } catch (err) {
      setError(errorMessage(err, 'Não foi possível trocar a senha.'))
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title="Trocar senha"
      subtitle="Os outros aparelhos conectados vão precisar entrar de novo."
      submitLabel="Trocar senha"
      submitting={submitting}
      error={error}
      onSubmit={handleSubmit}
      onClose={onClose}
    >
      <Field label="Senha atual" htmlFor="password-current">
        <input
          id="password-current"
          className="inp"
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
        />
      </Field>
      <Field label="Nova senha" htmlFor="password-new" hint={`Mínimo de ${MIN_PASSWORD_LENGTH} caracteres.`}>
        <input
          id="password-new"
          className="inp"
          type="password"
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
        />
      </Field>
      <Field label="Confirme a nova senha" htmlFor="password-confirm">
        <input
          id="password-confirm"
          className="inp"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </Field>
    </Modal>
  )
}
