import { useState } from 'react'
import { MIN_PASSWORD_LENGTH, userRoleLabels, type UserInput, type UserRole } from '../../../shared/auth'
import { ChoiceGroup, Field, Modal } from '../ui/Modal'
import { PasswordInput } from '../ui/PasswordInput'

const roleOptions = Object.entries(userRoleLabels) as [UserRole, string][]

const emptyUserInput: UserInput = { name: '', username: '', role: 'operador', password: '' }

type Props = {
  mode: 'create' | 'edit'
  initialValue?: Omit<UserInput, 'password'>
  /** Editing your own account: the role can't change, so you can't lock yourself out. */
  isSelf?: boolean
  submitting?: boolean
  error?: string | null
  onSubmit: (input: UserInput) => void
  onCancel: () => void
}

export function UserFormModal({ mode, initialValue, isSelf, submitting, error, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<UserInput>(
    initialValue
      ? { name: initialValue.name, username: initialValue.username, role: initialValue.role, password: '' }
      : emptyUserInput,
  )
  const [confirm, setConfirm] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const isEdit = mode === 'edit'

  function set<K extends keyof UserInput>(key: K, value: UserInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    setLocalError(null)
  }

  function handleSubmit() {
    if (!form.name.trim()) return setLocalError('Preencha o nome.')
    if (!form.username.trim()) return setLocalError('Preencha o usuário.')
    if (/\s/.test(form.username.trim())) return setLocalError('O usuário não pode ter espaços.')
    if (form.password || !isEdit) {
      if (form.password.length < MIN_PASSWORD_LENGTH) {
        return setLocalError(`A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`)
      }
      if (form.password !== confirm) return setLocalError('As senhas não conferem.')
    }
    onSubmit({ ...form, name: form.name.trim(), username: form.username.trim() })
  }

  return (
    <Modal
      title={isEdit ? 'Editar usuário' : 'Novo usuário'}
      submitLabel={isEdit ? 'Salvar alterações' : 'Criar usuário'}
      submitting={submitting}
      error={localError ?? error}
      onSubmit={handleSubmit}
      onClose={onCancel}
    >
      <Field label="Nome *" htmlFor="user-name">
        <input
          id="user-name"
          className="inp"
          autoComplete="off"
          placeholder="Ex.: Maria Souza"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
        />
      </Field>
      <Field label="Usuário *" htmlFor="user-username" hint="É o que a pessoa digita para entrar. Sem espaços.">
        <input
          id="user-username"
          className="inp"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="Ex.: maria"
          value={form.username}
          onChange={(e) => set('username', e.target.value)}
        />
      </Field>

      <div className="field">
        <span className="lbl">Perfil</span>
        {isSelf ? (
          <span className="hint">Você é administrador. Seu próprio perfil não pode ser alterado aqui.</span>
        ) : (
          <>
            <ChoiceGroup label="Perfil" value={form.role} options={roleOptions} onChange={(v) => set('role', v)} />
            <span className="hint">
              {form.role === 'admin'
                ? 'Usa o app inteiro e também cria, edita e exclui usuários.'
                : 'Usa o app inteiro, menos a tela de usuários.'}
            </span>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field
          label={isEdit ? 'Nova senha' : 'Senha inicial *'}
          htmlFor="user-password"
          hint={isEdit ? 'Deixe em branco para manter a atual.' : `Mínimo de ${MIN_PASSWORD_LENGTH} caracteres.`}
        >
          <PasswordInput
            id="user-password"
            className="inp"
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
          />
        </Field>
        <Field label={isEdit ? 'Confirme a nova senha' : 'Confirme a senha *'} htmlFor="user-confirm">
          <PasswordInput
            id="user-confirm"
            className="inp"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value)
              setLocalError(null)
            }}
          />
        </Field>
      </div>
    </Modal>
  )
}
