import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { CustomersPage } from './pages/CustomersPage'

function App() {
  return (
    <div className="flex min-h-svh flex-col">
      <Header />
      <main className="flex flex-1 flex-col">
        <CustomersPage />
      </main>
      <Footer />
    </div>
  )
}

export default App
