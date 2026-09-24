import { useLocation } from 'react-router'
import { useApp } from '../../app/context'
import { IconChevron, IconSearch } from './icons'
import { findNavItem } from './navigation'

export function Topbar() {
  const { pathname } = useLocation()
  const { searchPlaceholder, query, setQuery } = useApp()
  const current = findNavItem(pathname)
  const isHome = pathname === '/'

  return (
    <header className="topbar print:hidden">
      <div className="crumbs">
        <span>{isHome ? 'EcoControl' : current ? capitalize(current.group) : 'EcoControl'}</span>
        <IconChevron size={14} />
        <strong>{current?.label ?? 'Início'}</strong>
      </div>

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
    </header>
  )
}

function capitalize(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase()
}
