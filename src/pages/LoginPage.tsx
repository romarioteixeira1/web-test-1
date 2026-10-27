import { useState, type FormEvent } from 'react'
import { MIN_PASSWORD_LENGTH, type User } from '../../shared/auth'
import { login, setupAccount } from '../api/auth'
import { BrandLogo } from '../components/layout/BrandLogo'
import { Field } from '../components/ui/Modal'
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
      <form className="auth-card" onSubmit={handleSubmit}>
        <BrandLogo />
        <div className="auth-head">
          <h1>{isSetup ? 'Criar acesso' : 'Entrar'}</h1>
          <p>
            {isSetup
              ? 'Primeiro acesso: crie o usuário e a senha de administrador do EcoControl.'
              : 'Use seu usuário e senha para acessar o EcoControl.'}
          </p>
        </div>

        {isSetup && (
          <Field label="Seu nome" htmlFor="auth-name">
            <input
              id="auth-name"
              className="inp"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
        )}
        <Field label="Usuário" htmlFor="auth-username">
          <input
            id="auth-username"
            className="inp"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            autoFocus={!isSetup}
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </Field>
        <Field
          label="Senha"
          htmlFor="auth-password"
          hint={isSetup ? `Mínimo de ${MIN_PASSWORD_LENGTH} caracteres.` : undefined}
        >
          <input
            id="auth-password"
            className="inp"
            type="password"
            autoComplete={isSetup ? 'new-password' : 'current-password'}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        {isSetup && (
          <Field label="Confirme a senha" htmlFor="auth-confirm">
            <input
              id="auth-confirm"
              className="inp"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </Field>
        )}

        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? 'Entrando…' : isSetup ? 'Criar acesso e entrar' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
