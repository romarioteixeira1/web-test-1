import { useState, type FormEvent } from 'react'
import { MIN_PASSWORD_LENGTH, type User } from '../../shared/auth'
import { login, setupAccount } from '../api/auth'
import { errorMessage } from '../lib/format'

type Props = {
  /** `setup` creates the first account, while no one can sign in yet. */
  mode: 'login' | 'setup'
  onSignedIn: (user: User) => void
}

export function LoginPage({ mode, onSignedIn }: Props) {
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isSetup = mode === 'setup'

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (isSetup) {
      if (password.length < MIN_PASSWORD_LENGTH) {
        setError(`A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`)
        return
      }
      if (password !== confirm) {
        setError('As senhas não conferem.')
        return
      }
    }

    setSubmitting(true)
    setError(null)
    try {
      const user = isSetup ? await setupAccount({ name, username, password }) : await login({ username, password })
      onSignedIn(user)
    } catch (err) {
      setError(errorMessage(err, 'Não foi possível entrar.'))
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-screen">
      <main className="auth-login">
        <div className="auth-logo" role="img" aria-label="EcoControl">
          <span className="auth-logo-mark" aria-hidden="true">
            <RecycleIcon />
          </span>
          <span aria-hidden="true">EcoControl</span>
        </div>

        <div className="auth-title">
          <h1>{isSetup ? 'Criar acesso' : 'Entrar'}</h1>
          <p>
            {isSetup
              ? 'Primeiro acesso: crie o usuário e a senha de administrador do EcoControl.'
              : 'Que bom ter você de volta ao EcoControl'}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isSetup && (
            <>
              <label htmlFor="auth-name">Seu nome</label>
              <input
                id="auth-name"
                autoComplete="name"
                placeholder="Seu nome completo"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </>
          )}

          <label htmlFor="auth-username">Usuário</label>
          <input
            id="auth-username"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            autoFocus={!isSetup}
            placeholder="Seu usuário"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <label htmlFor="auth-password">Senha</label>
          <input
            id="auth-password"
            type="password"
            autoComplete={isSetup ? 'new-password' : 'current-password'}
            placeholder={isSetup ? `Mínimo de ${MIN_PASSWORD_LENGTH} caracteres` : 'Sua senha'}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {isSetup && (
            <>
              <label htmlFor="auth-confirm">Confirme a senha</label>
              <input
                id="auth-confirm"
                type="password"
                autoComplete="new-password"
                placeholder="Repita a senha"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </>
          )}

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting ? 'Entrando…' : isSetup ? 'Criar acesso e entrar' : 'Entrar'}
          </button>
        </form>

        <p className="auth-note">
          <LockIcon />
          <span>Seus dados de acesso ficam protegidos.</span>
        </p>
      </main>
    </div>
  )
}

function RecycleIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 19H4.8a1.8 1.8 0 0 1-1.6-2.7L6 11.5" />
      <path d="M11 19h8.2a1.8 1.8 0 0 0 1.6-2.7l-1.3-2.3" />
      <path d="M14 16l-3 3 3 3" />
      <path d="M8.3 7.4l1.6-2.8a1.8 1.8 0 0 1 3.1 0l3.7 6.4" />
      <path d="M15.4 11.2l1.3-4.2 4.2 1.3" />
      <path d="M4.4 9.9L8.3 7.4 9.6 11.6" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  )
}
