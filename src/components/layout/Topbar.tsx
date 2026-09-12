import { useEffect, useState, type FormEvent } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { navItems } from './navigation'
import { IconMenu, IconSearch } from './icons'

type Props = {
  onOpenSidebar: () => void
}

export function Topbar({ onOpenSidebar }: Props) {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const current = navItems.find((item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to),
  )

  const [term, setTerm] = useState(location.pathname === '/clientes' ? (searchParams.get('busca') ?? '') : '')

  useEffect(() => {
    if (location.pathname === '/clientes') {
      setTerm(searchParams.get('busca') ?? '')
    }
  }, [location.pathname, searchParams])

  function goToSearch(value: string) {
    const params = new URLSearchParams()
    if (value.trim()) params.set('busca', value.trim())
    navigate({ pathname: '/clientes', search: params.toString() })
  }

  useEffect(() => {
    const currentQuery = location.pathname === '/clientes' ? (searchParams.get('busca') ?? '') : ''
    if (term === currentQuery) return
    const timeout = setTimeout(() => goToSearch(term), 300)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    goToSearch(term)
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border bg-bg px-4 sm:px-6">
      <button
        type="button"
        onClick={onOpenSidebar}
        className="rounded-md p-2 transition-colors hover:bg-surface hover:text-accent md:hidden"
        aria-label="Abrir menu"
      >
        <IconMenu className="size-5" />
      </button>
      <h1 className="text-base font-medium text-text-strong">{current?.label ?? 'Painel'}</h1>

      <form onSubmit={handleSubmit} className="ml-auto w-full max-w-xs">
        <label className="relative block">
          <IconSearch className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            type="search"
            placeholder="Buscar por nome, CPF/CNPJ..."
            className="w-full rounded-md border border-border bg-surface py-2 pr-3 pl-9 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </label>
      </form>
    </header>
  )
}
