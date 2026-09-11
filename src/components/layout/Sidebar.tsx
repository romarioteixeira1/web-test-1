import { NavLink } from 'react-router'
import { navItems } from './navigation'

type Props = {
  open: boolean
  onNavigate: () => void
}

export function Sidebar({ open, onNavigate }: Props) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={onNavigate}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-64 -translate-x-full flex-col border-r border-border bg-surface transition-transform duration-200 md:translate-x-0 ${
          open ? 'translate-x-0' : ''
        }`}
      >
        <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-accent-soft text-accent'
                    : 'text-text hover:bg-bg hover:text-text-strong'
                }`
              }
            >
              <Icon className="size-5 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border px-6 py-4 text-xs">
          Deploy com <code className="rounded bg-bg px-1.5 py-0.5">npm run deploy</code>
        </div>
      </aside>
    </>
  )
}
