import { Route, Routes } from 'react-router'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { CustomersPage } from './pages/CustomersPage'
import { HomePage } from './pages/HomePage'

function App() {
  return (
    <div className="flex min-h-svh flex-col">
      <Header />
      <main className="flex flex-1 flex-col">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/clientes" element={<CustomersPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
