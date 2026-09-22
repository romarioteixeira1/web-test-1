import { useState, type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

type Props = {
  children: ReactNode
}

export function AdminLayout({ children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="h-svh print:h-auto">
      <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      <div className="flex h-svh flex-col md:pl-64 print:h-auto print:pl-0">
        <Topbar onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="flex flex-1 flex-col overflow-y-auto print:overflow-visible">{children}</main>
      </div>
    </div>
  )
}
