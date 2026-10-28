import { useState, type FormEvent } from 'react'
import { MIN_PASSWORD_LENGTH, type User } from '../../shared/auth'
import { login, register, setupAccount } from '../api/auth'
import { BrandLogo } from '../components/layout/BrandLogo'
import { errorMessage } from '../lib/format'

type Props = {
  /** `setup` creates the first account, while no one can sign in yet. */
  mode: 'login' | 'setup'
  onSignedIn: (user: User) => void
}

const copy = {
  login: { title: 'Entrar', lead: 'Que bom ter você de volta ao EcoControl', submit: 'Entrar' },
  register: { title: 'Criar conta', lead: 'Cadastre-se para começar a usar o EcoControl.', submit: 'Criar conta e entrar' },
  setup: {
    title: 'Criar acesso',
    lead: 'Primeiro acesso: crie o usuário e a senha de administrador do EcoControl.',
    submit: 'Criar acesso e entrar',
  },
}

export function LoginPage({ mode, onSignedIn }: Props) {
  const [registering, setRegistering] = useState(false)
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const view = mode === 'setup' ? 'setup' : registering ? 'register' : 'login'
  /** Setup and sign-up both create an account, so both ask for a name and a confirmed password. */
  const isSetup = view !== 'login'
  const text = copy[view]

  function switchTo(next: boolean) {
    setRegistering(next)
    setPassword('')
    setConfirm('')
    setError(null)
  }

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
      const user =
        view === 'setup'
          ? await setupAccount({ name, username, password })
          : view === 'register'
            ? await register({ name, username, password })
            : await login({ username, password })
      onSignedIn(user)
    } catch (err) {
      setError(errorMessage(err, 'Não foi possível entrar.'))
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-screen">
      <main className="auth-login">
        <BrandLogo />

        <div className="auth-title">
          <h1>{text.title}</h1>
          <p>{text.lead}</p>
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
            {submitting ? 'Entrando…' : text.submit}
          </button>
        </form>

        <p className="auth-note">
          <LockIcon />
          <span>Seus dados de acesso ficam protegidos.</span>
        </p>

        {view !== 'setup' && (
          <p className="auth-switch">
            {registering ? 'Já tem uma conta?' : 'Não tem uma conta?'}
            <button type="button" onClick={() => switchTo(!registering)}>
              {registering ? 'Entrar' : 'Criar conta'}
            </button>
          </p>
        )}
      </main>
    </div>
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
