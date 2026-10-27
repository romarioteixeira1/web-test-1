import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'
import { Topbar } from './Topbar'
import { Footer } from './Footer'
import { HelpChat } from '../assistant/HelpChat'
import { PwaBanner } from '../../pwa/PwaBanner'

type Props = {
  children: ReactNode
}

export function AdminLayout({ children }: Props) {
  const { pathname } = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const [helpOpen, setHelpOpen] = useState(false)

  // The main area keeps its scroll between screens, so each new screen starts at the top.
  // On small screens the window scrolls instead of the main area.
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'instant' })
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  function backToTop() {
    mainRef.current?.scrollTo({ top: 0 })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="app">
      <Sidebar />
      <div className="content">
        <Topbar />
        <main className="main" ref={mainRef}>
          <PwaBanner />
          {children}
          <Footer onOpenHelp={() => setHelpOpen(true)} onBackToTop={backToTop} />
        </main>
        <HelpChat open={helpOpen} onOpenChange={setHelpOpen} />
      </div>
      <MobileNav />
    </div>
  )
}
