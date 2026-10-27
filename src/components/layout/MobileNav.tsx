import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router'
import { useAuth } from '../../app/auth'
import { useApp } from '../../app/context'
import { installApp, usePwa } from '../../pwa/pwa'
import { IconClose, IconDownload, IconGrid } from './icons'
import { findNavItem, navGroupsFor, navItems } from './navigation'

/** Screens that get their own tab; everything else lives under "Mais". */
const tabPaths = ['/', '/clientes', '/coletas', '/transacoes']
const tabs = tabPaths.map((to) => navItems.find((item) => item.to === to)!)

/** Bottom tab bar shown instead of the sidebar on phones (see `.mobile-nav` in components.css). */
export function MobileNav() {
  const { pathname } = useLocation()
  const { counts } = useApp()
  const { user } = useAuth()
  const { canInstall } = usePwa()
  // Remember which screen the sheet was opened on, so navigating anywhere closes it.
  const [openedAt, setOpenedAt] = useState<string | null>(null)
  const moreOpen = openedAt === pathname
  const setMoreOpen = (open: boolean) => setOpenedAt(open ? pathname : null)
  const current = findNavItem(pathname)
  const inMore = !current || !tabPaths.includes(current.to)

  useEffect(() => {
    if (!moreOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpenedAt(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [moreOpen])

  return (
    <>
      {moreOpen && (
        <div className="more-backdrop animate-fade-in" onClick={() => setMoreOpen(false)}>
          <div
            className="more-sheet animate-scale-in"
            role="dialog"
            aria-modal="true"
            aria-label="Todas as telas"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="more-head">
              <strong>Menu</strong>
              <button type="button" className="more-close" onClick={() => setMoreOpen(false)} aria-label="Fechar menu">
                <IconClose size={18} />
              </button>
            </div>
            {navGroupsFor(user.role === 'admin').map((group) => (
              <div key={group.title} className="more-group">
                <span className="nav-title">{group.title}</span>
                <div className="more-grid">
                  {group.items.map(({ to, label, icon: Icon, end, count }) => (
                    <NavLink key={to} to={to} end={end} className={({ isActive }) => `more-item ${isActive ? 'on' : ''}`}>
                      <span className="more-icon">
                        <Icon size={20} />
                      </span>
                      <span className="more-label">{label}</span>
                      {count && counts && <span className="nav-count mono">{counts[count]}</span>}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
            {canInstall && (
              <button type="button" className="btn more-install" onClick={() => void installApp()}>
                <IconDownload size={18} />
                Instalar aplicativo
              </button>
            )}
          </div>
        </div>
      )}

      <nav className="mobile-nav print:hidden" aria-label="Menu principal">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `tab ${isActive ? 'on' : ''}`}>
            <Icon size={22} />
            <span>{label}</span>
          </NavLink>
        ))}
        <button
          type="button"
          className={`tab ${inMore || moreOpen ? 'on' : ''}`}
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen(!moreOpen)}
        >
          <IconGrid size={22} />
          <span>Mais</span>
        </button>
      </nav>
    </>
  )
}
