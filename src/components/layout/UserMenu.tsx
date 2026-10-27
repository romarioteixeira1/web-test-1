import { useEffect, useId, useRef, useState } from 'react'
import { useAuth } from '../../app/auth'
import { ChangePasswordModal } from '../auth/ChangePasswordModal'
import { IconKey, IconLogout } from './icons'

/** Top bar button with the signed-in user's initials and name, opening a menu to change the password or sign out. */
export function UserMenu() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="user-menu" ref={rootRef}>
      <button
        type="button"
        className="user-menu-button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        title={`Conectado como ${user.name}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="user-avatar">{initials(user.name)}</span>
        <span className="user-menu-name truncate">{user.name}</span>
      </button>

      {open && (
        <div className="user-menu-panel animate-scale-in" id={menuId} role="menu">
          <div className="user-menu-head">
            <strong className="truncate">{user.name}</strong>
            <span className="truncate">@{user.username}</span>
          </div>
          <button
            type="button"
            role="menuitem"
            className="user-menu-item"
            onClick={() => {
              setOpen(false)
              setPasswordOpen(true)
            }}
          >
            <IconKey />
            Trocar senha
          </button>
          <button type="button" role="menuitem" className="user-menu-item" onClick={() => void logout()}>
            <IconLogout />
            Sair
          </button>
        </div>
      )}

      {passwordOpen && <ChangePasswordModal onClose={() => setPasswordOpen(false)} />}
    </div>
  )
}

/** "Romario Teixeira" → "RT", "Romario" → "RO". */
function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length > 1) return (words[0][0] + words[words.length - 1][0]).toUpperCase()
  return (words[0] ?? '?').slice(0, 2).toUpperCase()
}
