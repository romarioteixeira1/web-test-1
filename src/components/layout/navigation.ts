import { IconCalendar, IconDashboard, IconReceipt, IconRecycle, IconUsers } from './icons'

export const navItems = [
  { to: '/', label: 'Painel', icon: IconDashboard, end: true },
  { to: '/clientes', label: 'Clientes', icon: IconUsers, end: false },
  { to: '/materiais', label: 'Materiais', icon: IconRecycle, end: false },
  { to: '/transacoes', label: 'Transações', icon: IconReceipt, end: false },
  { to: '/agenda', label: 'Agenda', icon: IconCalendar, end: false },
]
