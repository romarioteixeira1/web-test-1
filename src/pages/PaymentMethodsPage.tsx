import { useState } from 'react'
import * as api from '../api/paymentMethods'
import { useApp, useTopbarSearch } from '../app/context'
import { useLoader, useOpenCreateOnArrival } from '../app/hooks'
import { PaymentMethodFormModal } from '../components/paymentMethods/PaymentMethodFormModal'
import { Hero, HeroButton } from '../components/ui/Hero'
import { EmptyState, ErrorBox, ListCard, Loading, Segmented } from '../components/ui/ListCard'
import { RowActions, Switch } from '../components/ui/RowActions'
import type { PaymentMethodInput, PaymentMethodRecord } from '../../shared/payment-method'
import { abbreviation, errorMessage, matches, share } from '../lib/format'

type ModalState = { mode: 'create' } | { mode: 'edit'; method: PaymentMethodRecord } | null
type Filter = 'all' | 'on' | 'off'

const filters = [
  ['all', 'Todas'],
  ['on', 'Ativas'],
  ['off', 'Inativas'],
] as const

export function PaymentMethodsPage() {
  const { toast, refreshCounts, setQuery } = useApp()
  const query = useTopbarSearch('Buscar forma de pagamento')
  const openCreate = useOpenCreateOnArrival()
  const [filter, setFilter] = useState<Filter>('all')
  const [modal, setModal] = useState<ModalState>(openCreate ? { mode: 'create' } : null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [toggling, setToggling] = useState<number | null>(null)

  const { data, setData, loading, error, reload } = useLoader(
    () => api.listPaymentMethods(),
    [],
    'Falha ao carregar formas de pagamento',
  )
  const methods = data ?? []

  const active = methods.filter((m) => m.active).length
  const upfront = methods.filter((m) => m.kind === 'a_vista').length
  const onTerm = methods.length - upfront

  const visible = methods.filter(
    (m) => (filter === 'all' || (filter === 'on') === m.active) && matches(query, m.name),
  )

  async function handleSubmit(input: PaymentMethodInput) {
    setSubmitting(true)
    setFormError(null)
    try {
      if (modal?.mode === 'edit') {
        await api.updatePaymentMethod(modal.method.id, input)
        toast('Alterações salvas')
      } else {
        await api.createPaymentMethod(input)
        toast('Forma de pagamento cadastrada')
        setFilter('all')
        setQuery('')
      }
      setModal(null)
      refreshCounts()
      await reload({ silent: true })
    } catch (err) {
      setFormError(errorMessage(err, 'Falha ao salvar forma de pagamento'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggle(method: PaymentMethodRecord, next: boolean) {
    setToggling(method.id)
    try {
      const updated = await api.setPaymentMethodActive(method.id, next)
      setData((list) => list?.map((m) => (m.id === updated.id ? updated : m)) ?? list)
      toast(next ? `${method.name} ativada` : `${method.name} desativada`)
    } catch (err) {
      toast(errorMessage(err, 'Falha ao alterar status'), 'error')
    } finally {
      setToggling(null)
    }
  }

  async function handleDelete(method: PaymentMethodRecord) {
    if (!window.confirm(`Excluir "${method.name}"?`)) return
    try {
      await api.deletePaymentMethod(method.id)
      toast('Forma de pagamento excluída')
      refreshCounts()
      await reload({ silent: true })
    } catch (err) {
      toast(errorMessage(err, 'Falha ao excluir forma de pagamento'), 'error')
    }
  }

  return (
    <div className="page fill">
      <Hero
        chip="ECOCONTROL · CADASTROS"
        title="Formas de pagamento"
        subtitle="Defina como você paga fornecedores e recebe de compradores."
        stats={[
          { label: 'Ativas', value: `${active}/${methods.length}`, share: share(active, methods.length) },
          { label: 'À vista', value: upfront, share: share(upfront, methods.length) },
          { label: 'A prazo', value: onTerm, share: share(onTerm, methods.length) },
        ]}
      >
        <HeroButton label="Nova forma" onClick={() => setModal({ mode: 'create' })} />
      </Hero>

      {error ? (
        <ErrorBox message={error} onRetry={() => reload()} />
      ) : (
        <ListCard
          title="Formas cadastradas"
          count={visible.length}
          actions={<Segmented label="Filtrar por status" value={filter} options={filters} onChange={setFilter} />}
        >
          {loading ? (
            <Loading />
          ) : (
            <>
              <table>
                <colgroup>
                  <col style={{ width: '32%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '24%' }} />
                  <col style={{ width: '18%' }} />
                  <col style={{ width: 104 }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Forma de pagamento</th>
                    <th>Prazo</th>
                    <th>Usar em</th>
                    <th>Status</th>
                    <th className="center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((m) => {
                    const uses = [m.use_purchases && 'Compras', m.use_sales && 'Vendas'].filter(Boolean) as string[]
                    return (
                      <tr key={m.id}>
                        <td>
                          <div className="cell-main">
                            <div className={`badge ${m.active ? 'tone-green' : 'tone-gray'}`}>{abbreviation(m.name)}</div>
                            <strong className="truncate">{m.name}</strong>
                          </div>
                        </td>
                        <td className="mono">{m.kind === 'a_prazo' ? `${m.term_days} dias` : 'À vista'}</td>
                        <td>
                          <span className="inline-flex gap-1.5">
                            {(uses.length ? uses : ['—']).map((u) => (
                              <span key={u} className="tag neutral">
                                {u}
                              </span>
                            ))}
                          </span>
                        </td>
                        <td>
                          <div className="status">
                            <Switch
                              checked={m.active}
                              label={`Ativar ${m.name}`}
                              disabled={toggling === m.id}
                              onChange={(next) => handleToggle(m, next)}
                            />
                            <span className={m.active ? 'pos' : 'text-muted'}>{m.active ? 'Ativa' : 'Inativa'}</span>
                          </div>
                        </td>
                        <RowActions
                          name={m.name}
                          onEdit={() => setModal({ mode: 'edit', method: m })}
                          onDelete={() => handleDelete(m)}
                        />
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {visible.length === 0 && <EmptyState />}
            </>
          )}
        </ListCard>
      )}

      {modal && (
        <PaymentMethodFormModal
          mode={modal.mode}
          initialValue={modal.mode === 'edit' ? modal.method : undefined}
          submitting={submitting}
          error={formError}
          onSubmit={handleSubmit}
          onCancel={() => {
            setModal(null)
            setFormError(null)
          }}
        />
      )}
    </div>
  )
}
