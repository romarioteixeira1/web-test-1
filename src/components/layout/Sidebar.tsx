import { NavLink } from 'react-router'
import { useApp } from '../../app/context'
import { abbreviation } from '../../lib/format'
import { navGroups } from './navigation'

export function Sidebar() {
  const { counts, company } = useApp()

  return (
    <nav className="sidebar print:hidden" aria-label="Menu principal">
      <div className="brand">
        <img src="/eco-logo.png" alt="EcoControl" className="brand-logo-full" />
      </div>

      {navGroups.map((group) => (
        <div key={group.title} className="nav-group">
          <span className="nav-title">{group.title}</span>
          {group.items.map(({ to, label, icon: Icon, end, count }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav ${isActive ? 'on' : ''}`}>
              <Icon />
              <span className="nav-label">{label}</span>
              {count && counts && <span className="nav-count mono">{counts[count]}</span>}
            </NavLink>
          ))}
        </div>
      ))}

      <NavLink to="/empresa" className="user-box" title={company ? 'Dados da empresa' : 'Cadastrar empresa'}>
        <div className="user-avatar">{company ? abbreviation(company.trade_name) : 'EC'}</div>
        <div className="user-text">
          <strong className="truncate">{company?.trade_name ?? 'Administrador'}</strong>
          <span>{company === null ? 'Cadastre sua empresa' : company ? 'Minha empresa' : 'EcoControl'}</span>
        </div>
      </NavLink>
    </nav>
  )
}
