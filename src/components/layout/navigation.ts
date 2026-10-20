import type { ComponentType } from 'react'
import {
  IconBox,
  IconBuilding,
  IconCard,
  IconChart,
  IconHome,
  IconReceipt,
  IconTruck,
  IconUsers,
  IconWallet,
} from './icons'

export type CountKey = 'customers' | 'materials' | 'paymentMethods'

export type NavItem = {
  to: string
  label: string
  icon: ComponentType<{ size?: number }>
  end?: boolean
  count?: CountKey
}

export const navGroups: { title: string; items: NavItem[] }[] = [
  {
    title: 'CADASTROS',
    items: [
      { to: '/', label: 'Início', icon: IconHome, end: true },
      { to: '/empresa', label: 'Minha empresa', icon: IconBuilding },
      { to: '/clientes', label: 'Clientes', icon: IconUsers, count: 'customers' },
      { to: '/materiais', label: 'Materiais', icon: IconBox, count: 'materials' },
      { to: '/formas-pagamento', label: 'Formas de pagamento', icon: IconCard, count: 'paymentMethods' },
    ],
  },
  {
    title: 'OPERAÇÕES',
    items: [
      { to: '/coletas', label: 'Coletas', icon: IconTruck },
      { to: '/transacoes', label: 'Transações', icon: IconReceipt },
    ],
  },
  {
    title: 'ANÁLISES',
    items: [
      { to: '/relatorios', label: 'Relatórios', icon: IconChart },
      { to: '/caixa', label: 'Fluxo de caixa', icon: IconWallet },
    ],
  },
]

export const navItems = navGroups.flatMap((group) => group.items.map((item) => ({ ...item, group: group.title })))

export function findNavItem(pathname: string) {
  return navItems.find((item) => (item.end ? pathname === item.to : pathname.startsWith(item.to)))
}
