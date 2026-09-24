import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

type Props = {
  children: ReactNode
}

export function AdminLayout({ children }: Props) {
  return (
    <div className="app">
      <Sidebar />
      <div className="content">
        <Topbar />
        <main className="main">{children}</main>
      </div>
    </div>
  )
}
