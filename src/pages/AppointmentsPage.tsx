import { useEffect, useState } from 'react'
import * as api from '../api/appointments'
import * as customersApi from '../api/customers'
import { AppointmentFormModal } from '../components/appointments/AppointmentFormModal'
import { AppointmentTable } from '../components/appointments/AppointmentTable'
import { VehicleFormModal } from '../components/appointments/VehicleFormModal'
import {
  appointmentStatusLabels,
  type AppointmentInput,
  type AppointmentStatus,
  type AppointmentWithDetails,
  type Vehicle,
  type VehicleInput,
} from '../../shared/appointment'
import type { Customer } from '../../shared/customer'

type ModalState = { mode: 'create' } | { mode: 'edit'; appointment: AppointmentWithDetails } | null
type VehicleModalState = { mode: 'create' } | { mode: 'edit'; vehicle: Vehicle } | null

const filterClass =
  'w-full rounded-md border border-border bg-bg px-3 py-2 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20 sm:w-48'
const primaryButton =
  'rounded-md bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-accent-strong hover:shadow-md active:scale-95 disabled:opacity-60'

const today = () => new Date().toISOString().slice(0, 10)

export function AppointmentsPage() {
  const [tab, setTab] = useState<'agenda' | 'frota'>('agenda')
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [from, setFrom] = useState(today())
  const [to, setTo] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [vehicleFilter, setVehicleFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalState>(null)
  const [vehicleModal, setVehicleModal] = useState<VehicleModalState>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setLoadError(null)
    try {
      const [appointmentsData, customersData, vehiclesData] = await Promise.all([
        api.listAppointments({
          from: from || undefined,
          to: to || undefined,
          status: statusFilter || undefined,
          vehicleId: vehicleFilter ? Number(vehicleFilter) : undefined,
        }),
        customersApi.listCustomers(),
        api.listVehicles(),
      ])
      setAppointments(appointmentsData)
      setCustomers(customersData)
      setVehicles(vehiclesData)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Falha ao carregar agenda')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, statusFilter, vehicleFilter])

  async function handleSubmit(input: AppointmentInput) {
    setSubmitting(true)
    setFormError(null)
    try {
      if (modal?.mode === 'edit') {
        await api.updateAppointment(modal.appointment.id, input)
      } else {
        await api.createAppointment(input)
      }
      setModal(null)
      await load()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Falha ao salvar agendamento')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(a: AppointmentWithDetails) {
    if (!window.confirm(`Excluir o agendamento de ${a.customer_name} em ${a.scheduled_date} ${a.scheduled_time}?`)) return
    await api.deleteAppointment(a.id)
    await load()
  }

  async function handleStatusChange(a: AppointmentWithDetails, status: AppointmentStatus) {
    try {
      await api.updateAppointmentStatus(a.id, status)
      await load()
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Falha ao atualizar status')
    }
  }

  async function handleSendReminder(a: AppointmentWithDetails) {
    setNotice(null)
    try {
      await api.sendAppointmentReminder(a.id)
      setNotice(`Lembrete enviado para ${a.customer_name}.`)
    } catch (err) {
      setNotice(`Não foi possível enviar o lembrete: ${err instanceof Error ? err.message : 'erro desconhecido'}`)
    }
    await load()
  }

  async function handleVehicleSubmit(input: VehicleInput) {
    setSubmitting(true)
    setFormError(null)
    try {
      if (vehicleModal?.mode === 'edit') {
        await api.updateVehicle(vehicleModal.vehicle.id, input)
      } else {
        await api.createVehicle(input)
      }
      setVehicleModal(null)
      await load()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Falha ao salvar veículo')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleVehicleDelete(v: Vehicle) {
    if (!window.confirm(`Excluir o veículo ${v.plate}? Agendamentos existentes ficarão sem veículo.`)) return
    await api.deleteVehicle(v.id)
    await load()
  }

  const tabClass = (active: boolean) =>
    `border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
      active ? 'border-accent text-accent' : 'border-transparent hover:text-text-strong'
    }`

  return (
    <section className="flex w-full flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-medium text-text-strong">Agenda</h2>
          <p className="text-sm">Coletas no cliente, entregas no pátio, frota e lembretes automáticos</p>
        </div>
        {tab === 'agenda' ? (
          <button type="button" onClick={() => setModal({ mode: 'create' })} className={primaryButton}>
            Novo agendamento
          </button>
        ) : (
          <button type="button" onClick={() => setVehicleModal({ mode: 'create' })} className={primaryButton}>
            Novo veículo
          </button>
        )}
      </div>

      <div className="flex border-b border-border">
        <button type="button" className={tabClass(tab === 'agenda')} onClick={() => setTab('agenda')}>
          Agendamentos
        </button>
        <button type="button" className={tabClass(tab === 'frota')} onClick={() => setTab('frota')}>
          Frota
        </button>
      </div>

      {notice && <p className="text-sm text-text-strong">{notice}</p>}
      {loading && <p className="text-sm">Carregando...</p>}
      {loadError && <p className="text-sm text-red-500">{loadError}</p>}

      {tab === 'agenda' && (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <label className="flex flex-col gap-1 text-xs">
              De
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={filterClass} />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              Até
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={filterClass} />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              Status
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={filterClass}>
                <option value="">Todos</option>
                {Object.entries(appointmentStatusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs">
              Veículo
              <select value={vehicleFilter} onChange={(e) => setVehicleFilter(e.target.value)} className={filterClass}>
                <option value="">Todos</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.plate}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {!loading && !loadError && (
            <AppointmentTable
              appointments={appointments}
              onEdit={(appointment) => setModal({ mode: 'edit', appointment })}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
              onSendReminder={handleSendReminder}
            />
          )}
        </>
      )}

      {tab === 'frota' && !loading && !loadError && (
        <div className="overflow-x-auto rounded-lg border border-border">
          {vehicles.length === 0 ? (
            <p className="py-12 text-center text-sm">Nenhum veículo cadastrado ainda.</p>
          ) : (
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-surface text-text-strong">
                <tr>
                  <th className="px-4 py-3 font-medium">Placa</th>
                  <th className="px-4 py-3 font-medium">Descrição</th>
                  <th className="px-4 py-3 font-medium">Motorista</th>
                  <th className="px-4 py-3 font-medium">Telefone</th>
                  <th className="px-4 py-3 font-medium">Situação</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v.id} className="border-t border-border transition-colors hover:bg-surface">
                    <td className="px-4 py-3 font-medium text-text-strong">{v.plate}</td>
                    <td className="px-4 py-3">{v.description || '—'}</td>
                    <td className="px-4 py-3">{v.driver_name || '—'}</td>
                    <td className="px-4 py-3">{v.driver_phone || '—'}</td>
                    <td className="px-4 py-3">{v.active ? 'Ativo' : 'Inativo'}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setVehicleModal({ mode: 'edit', vehicle: v })}
                        className="mr-3 font-medium transition-colors hover:text-accent"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleVehicleDelete(v)}
                        className="font-medium transition-colors hover:text-red-500"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {modal && (
        <AppointmentFormModal
          title={modal.mode === 'edit' ? 'Editar agendamento' : 'Novo agendamento'}
          initialValue={modal.mode === 'edit' ? modal.appointment : undefined}
          customers={customers}
          vehicles={vehicles}
          submitting={submitting}
          error={formError}
          onSubmit={handleSubmit}
          onCancel={() => {
            setModal(null)
            setFormError(null)
          }}
        />
      )}

      {vehicleModal && (
        <VehicleFormModal
          title={vehicleModal.mode === 'edit' ? 'Editar veículo' : 'Novo veículo'}
          initialValue={
            vehicleModal.mode === 'edit'
              ? { ...vehicleModal.vehicle, active: Boolean(vehicleModal.vehicle.active) }
              : undefined
          }
          submitting={submitting}
          error={formError}
          onSubmit={handleVehicleSubmit}
          onCancel={() => {
            setVehicleModal(null)
            setFormError(null)
          }}
        />
      )}
    </section>
  )
}
