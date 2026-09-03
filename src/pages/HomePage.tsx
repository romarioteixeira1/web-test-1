import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { getCustomerStats } from '../api/customers'
import type { CustomerStats } from '../../shared/customer'

function formatDate(value: string) {
  const date = new Date(value.includes(' ') ? value.replace(' ', 'T') + 'Z' : value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('pt-BR')
}

export function HomePage() {
  const [stats, setStats] = useState<CustomerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getCustomerStats()
      .then((data) => {
        if (!cancelled) setStats(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Falha ao carregar dados')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-medium text-text-strong">Painel</h1>
          <p className="text-sm">Visão geral do sistema de clientes</p>
        </div>
        <Link
          to="/clientes"
          state={{ openCreate: true }}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white"
        >
          Novo cadastro
        </Link>
      </div>

      {loading && <p className="text-sm">Carregando...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {stats && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border p-5">
              <p className="text-sm">Total de clientes</p>
              <p className="mt-1 text-3xl font-semibold text-text-strong">{stats.total}</p>
            </div>
            <div className="rounded-lg border border-border p-5">
              <p className="text-sm">Clientes ativos</p>
              <p className="mt-1 text-3xl font-semibold text-emerald-500">{stats.active}</p>
            </div>
            <div className="rounded-lg border border-border p-5">
              <p className="text-sm">Clientes inativos</p>
              <p className="mt-1 text-3xl font-semibold text-red-500">{stats.inactive}</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-text-strong">Cadastros recentes</h2>
              <Link to="/clientes" className="text-sm text-accent hover:underline">
                Ver todos
              </Link>
            </div>

            {stats.recent.length === 0 ? (
              <p className="text-sm">Nenhum cliente cadastrado ainda.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="bg-surface text-text-strong">
                    <tr>
                      <th className="px-4 py-3 font-medium">Nome</th>
                      <th className="px-4 py-3 font-medium">Contato</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Cadastro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recent.map((customer) => (
                      <tr key={customer.id} className="border-t border-border">
                        <td className="px-4 py-3 text-text-strong">{customer.name}</td>
                        <td className="px-4 py-3">{customer.email || customer.phone || '—'}</td>
                        <td className="px-4 py-3">
                          <span
                            className={
                              customer.status === 'active'
                                ? 'rounded-full bg-emerald-500/15 px-2 py-1 text-xs font-medium text-emerald-500'
                                : 'rounded-full bg-red-500/15 px-2 py-1 text-xs font-medium text-red-500'
                            }
                          >
                            {customer.status === 'active' ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">{formatDate(customer.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  )
}
