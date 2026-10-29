import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.tsx'
import { AppProvider } from './app/AppProvider.tsx'
import { AuthGate } from './app/AuthGate.tsx'
import { setupPwa } from './pwa/pwa.ts'

setupPwa()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthGate>
        <AppProvider>
          <App />
        </AppProvider>
      </AuthGate>
    </BrowserRouter>
  </StrictMode>,
)
