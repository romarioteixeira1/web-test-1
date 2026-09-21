import { Route, Routes } from 'react-router'
import { AdminLayout } from './components/layout/AdminLayout'
import { AppointmentsPage } from './pages/AppointmentsPage'
import { CustomerDetailPage } from './pages/CustomerDetailPage'
import { CustomersPage } from './pages/CustomersPage'
import { HomePage } from './pages/HomePage'
import { MaterialDetailPage } from './pages/MaterialDetailPage'
import { MaterialsPage } from './pages/MaterialsPage'
import { TransactionReceiptPage } from './pages/TransactionReceiptPage'
import { TransactionsPage } from './pages/TransactionsPage'

function App() {
  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/clientes" element={<CustomersPage />} />
        <Route path="/clientes/:id" element={<CustomerDetailPage />} />
        <Route path="/materiais" element={<MaterialsPage />} />
        <Route path="/materiais/:id" element={<MaterialDetailPage />} />
        <Route path="/agenda" element={<AppointmentsPage />} />
        <Route path="/transacoes" element={<TransactionsPage />} />
        <Route path="/transacoes/:id/comprovante" element={<TransactionReceiptPage />} />
      </Routes>
    </AdminLayout>
  )
}

export default App
