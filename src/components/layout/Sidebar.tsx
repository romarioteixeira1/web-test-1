import { NavLink } from 'react-router'
import { useApp } from '../../app/context'
import { navGroups } from './navigation'

export function Sidebar() {
  const { counts } = useApp()

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

      <div className="user-box">
        <div className="user-avatar">EC</div>
        <div className="user-text">
          <strong>Administrador</strong>
          <span>EcoControl</span>
        </div>
      </div>
    </nav>
  )
}
