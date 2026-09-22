import { IconChart, IconDashboard, IconReceipt, IconRecycle, IconTruck, IconUsers } from './icons'

export const navItems = [
  { to: '/', label: 'Painel', icon: IconDashboard, end: true },
  { to: '/clientes', label: 'Clientes', icon: IconUsers, end: false },
  { to: '/coletas', label: 'Coletas', icon: IconTruck, end: false },
  { to: '/materiais', label: 'Materiais', icon: IconRecycle, end: false },
  { to: '/transacoes', label: 'Transações', icon: IconReceipt, end: false },
  { to: '/relatorios', label: 'Relatórios', icon: IconChart, end: false },
]
