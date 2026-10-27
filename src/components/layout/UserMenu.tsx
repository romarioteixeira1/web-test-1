import { useEffect, useId, useRef, useState } from 'react'
import { userRoleLabels } from '../../../shared/auth'
import { useAuth } from '../../app/auth'
import { initials } from '../../lib/format'
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
            <span className="truncate">
              @{user.username} · {userRoleLabels[user.role]}
            </span>
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