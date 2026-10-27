import { useState } from 'react'
import { useLocation } from 'react-router'
import { useAuth } from '../../app/auth'
import { ChangePasswordModal } from '../auth/ChangePasswordModal'
import { useApp } from '../../app/context'
import { useTheme } from '../../app/theme'
import { BrandLogo } from './BrandLogo'
import { IconChevron, IconKey, IconLogout, IconMoon, IconSearch, IconSun } from './icons'
import { findNavItem } from './navigation'

export function Topbar() {
  const { pathname } = useLocation()
  const { searchPlaceholder, query, setQuery } = useApp()
  const { theme, toggleTheme } = useTheme()
  const current = findNavItem(pathname)
  const isHome = pathname === '/'
  const themeLabel = theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'
  const { user, logout } = useAuth()
  const logoutLabel = `Sair (${user.name})`
  const [passwordOpen, setPasswordOpen] = useState(false)

  return (
    <header className="topbar print:hidden">
      <span className="topbar-brand">
        <BrandLogo compact />
      </span>
      <div className="crumbs">
        <span>{isHome ? 'EcoControl' : current ? capitalize(current.group) : 'EcoControl'}</span>
        <IconChevron size={14} />
        <strong>{current?.label ?? 'Início'}</strong>
      </div>

      <div className="topbar-actions">
        {isHome ? (
          <span className="status-pill">
            <span className="dot" />
            Tudo em dia
          </span>
        ) : (
          searchPlaceholder && (
            <div className="search">
              <IconSearch size={16} />
              <input
                className="inp"
                type="search"
                aria-label="Buscar"
                placeholder={searchPlaceholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          )
        )}
        <button type="button" className="icon theme-toggle" aria-label={themeLabel} title={themeLabel} onClick={toggleTheme}>
          {theme === 'dark' ? <IconSun /> : <IconMoon />}
        </button>
        <button
          type="button"
          className="icon logout-button"
          aria-label="Trocar senha"
          title="Trocar senha"
          onClick={() => setPasswordOpen(true)}
        >
          <IconKey />
        </button>
        <button type="button" className="icon logout-button" aria-label={logoutLabel} title={logoutLabel} onClick={() => void logout()}>
          <IconLogout />
        </button>
      </div>
      {passwordOpen && <ChangePasswordModal onClose={() => setPasswordOpen(false)} />}
    </header>
  )
}

function capitalize(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase()
}
