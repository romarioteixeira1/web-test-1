import { useState } from 'react'
import * as api from '../api/users'
import { useAuth } from '../app/auth'
import { useApp, useTopbarSearch } from '../app/context'
import { useLoader } from '../app/hooks'
import { Hero, HeroButton } from '../components/ui/Hero'
import { EmptyState, ErrorBox, ListCard, Loading } from '../components/ui/ListCard'
import { RowActions } from '../components/ui/RowActions'
import { UserFormModal } from '../components/users/UserFormModal'
import { userRoleLabels, type UserInput, type UserRecord } from '../../shared/auth'
import { dateFromDb, errorMessage, initials, matches, share } from '../lib/format'

type ModalState = { mode: 'create' } | { mode: 'edit'; user: UserRecord } | null

export function UsersPage() {
  const { toast } = useApp()
  const { user: me } = useAuth()
  const query = useTopbarSearch('Buscar usuário')
  const [modal, setModal] = useState<ModalState>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const { data, loading, error, reload } = useLoader(() => api.listUsers(), [], 'Falha ao carregar usuários')
  const users = data ?? []
  const admins = users.filter((u) => u.role === 'admin').length
  const visible = users.filter((u) => matches(query, u.name, u.username))

  async function handleSubmit(input: UserInput) {
    setSubmitting(true)
    setFormError(null)
    try {
      if (modal?.mode === 'edit') {
        await api.updateUser(modal.user.id, input)
        toast(input.password ? 'Usuário salvo e senha redefinida' : 'Alterações salvas')
      } else {
        await api.createUser(input)
        toast(`Usuário ${input.username} criado`)
      }
      setModal(null)
      await reload({ silent: true })
    } catch (err) {
      setFormError(errorMessage(err, 'Falha ao salvar usuário'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(user: UserRecord) {
    if (!window.confirm(`Excluir o usuário "${user.name}"? Ele não vai mais conseguir entrar no app.`)) return
    try {
      await api.deleteUser(user.id)
      toast('Usuário excluído')
      await reload({ silent: true })
    } catch (err) {
      toast(errorMessage(err, 'Falha ao excluir usuário'), 'error')
    }
  }

  return (
    <div className="page fill">
      <Hero
        chip="ECOCONTROL · ACESSO"
        title="Usuários"
        subtitle="Quem pode entrar no EcoControl e o que cada pessoa pode fazer."
        stats={[
          { label: 'Usuários', value: users.length, share: 100 },
          { label: 'Administradores', value: admins, share: share(admins, users.length) },
          { label: 'Operadores', value: users.length - admins, share: share(users.length - admins, users.length) },
        ]}
      >
        <HeroButton label="Novo usuário" onClick={() => setModal({ mode: 'create' })} />
      </Hero>

      {error ? (
        <ErrorBox message={error} onRetry={() => reload()} />
      ) : (
        <ListCard title="Usuários cadastrados" count={visible.length}>
          {loading ? (
            <Loading />
          ) : (
            <>
              <table>
                <colgroup>
                  <col style={{ width: '36%' }} />
                  <col style={{ width: '22%' }} />
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: 104 }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Usuário</th>
                    <th>Perfil</th>
                    <th>Criado em</th>
                    <th className="center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((u) => {
                    const isMe = u.id === me.id
                    return (
                      <tr key={u.id}>
                        <td>
                          <div className="cell-main">
                            <div className={`badge ${u.role === 'admin' ? 'tone-dark' : 'tone-green'}`}>{initials(u.name)}</div>
                            <strong className="truncate">{u.name}</strong>
                            {isMe && <span className="tag neutral">Você</span>}
                          </div>
                        </td>
                        <td className="mono">{u.username}</td>
                        <td>
                          <span className={`tag ${u.role === 'admin' ? 'tone-dark' : 'tone-light'}`}>
                            {userRoleLabels[u.role]}
                          </span>
                        </td>
                        <td className="mono">{dateFromDb(u.created_at)}</td>
                        <RowActions
                          name={u.name}
                          onEdit={() => setModal({ mode: 'edit', user: u })}
                          onDelete={isMe ? undefined : () => handleDelete(u)}
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
        <UserFormModal
          mode={modal.mode}
          initialValue={modal.mode === 'edit' ? modal.user : undefined}
          isSelf={modal.mode === 'edit' && modal.user.id === me.id}
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
