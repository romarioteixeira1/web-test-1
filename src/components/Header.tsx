import { Link } from 'react-router'

export function Header() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link to="/" className="text-lg font-semibold text-text-strong">
          Cadastro de Clientes
        </Link>
        <nav className="text-sm">
          <Link to="/clientes" className="hover:text-accent">
            Clientes
          </Link>
        </nav>
      </div>
    </header>
  )
}
