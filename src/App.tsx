import { Route, Routes } from 'react-router'
import { AdminLayout } from './components/layout/AdminLayout'
import { CustomerDetailPage } from './pages/CustomerDetailPage'
import { CustomersPage } from './pages/CustomersPage'
import { HomePage } from './pages/HomePage'

function App() {
  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/clientes" element={<CustomersPage />} />
        <Route path="/clientes/:id" element={<CustomerDetailPage />} />
      </Routes>
    </AdminLayout>
  )
}

export default App
