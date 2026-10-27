import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User } from '../../shared/auth'
import { getSession, logout as logoutRequest } from '../api/auth'
import { UNAUTHORIZED_EVENT } from '../api/http'
import { BrandLogo } from '../components/layout/BrandLogo'
import { errorMessage } from '../lib/format'
import { LoginPage } from '../pages/LoginPage'
import { AuthContext } from './auth'

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'signed-out'; needsSetup: boolean }
  | { status: 'signed-in'; user: User }

/** Shows the login screen until there is a session, then renders the app. */
export function AuthGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ status: 'loading' })

  const check = useCallback(() => {
    getSession()
      .then((session) =>
        setState(
          session.user
            ? { status: 'signed-in', user: session.user }
            : { status: 'signed-out', needsSetup: session.needs_setup },
        ),
      )
      .catch((err) => setState({ status: 'error', message: errorMessage(err, 'Não foi possível abrir o EcoControl.') }))
  }, [])

  useEffect(check, [check])

  // Any API call answering 401 means the session ended (expired, or signed out in another tab).
  useEffect(() => {
    function onUnauthorized() {
      setState((current) => (current.status === 'signed-in' ? { status: 'signed-out', needsSetup: false } : current))
    }
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
  }, [])

  const logout = useCallback(async () => {
    await logoutRequest().catch(() => undefined)
    setState({ status: 'signed-out', needsSetup: false })
  }, [])

  function retry() {
    setState({ status: 'loading' })
    check()
  }

  const user = state.status === 'signed-in' ? state.user : null
  const value = useMemo(() => (user ? { user, logout } : null), [user, logout])

  if (value) return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>

  if (state.status === 'signed-out') {
    return (
      <LoginPage
        mode={state.needsSetup ? 'setup' : 'login'}
        onSignedIn={(user) => setState({ status: 'signed-in', user })}
      />
    )
  }

  return (
    <div className="auth-screen">
      <div className="auth-card auth-status">
        <BrandLogo />
        {state.status !== 'error' ? (
          <p className="hint" role="status">
            Carregando…
          </p>
        ) : (
          <>
            <p className="auth-error" role="alert">
              {state.message}
            </p>
            <button type="button" className="btn" onClick={retry}>
              Tentar de novo
            </button>
          </>
        )}
      </div>
    </div>
  )
}
