import { Route, Routes } from 'react-router'
import { AdminLayout } from './components/layout/AdminLayout'
import { CashFlowPage } from './pages/CashFlowPage'
import { CollectionsPage } from './pages/CollectionsPage'
import { CompanyPage } from './pages/CompanyPage'
import { CustomerDetailPage } from './pages/CustomerDetailPage'
import { CustomersPage } from './pages/CustomersPage'
import { HomePage } from './pages/HomePage'
import { MaterialDetailPage } from './pages/MaterialDetailPage'
import { MaterialsPage } from './pages/MaterialsPage'
import { PaymentMethodsPage } from './pages/PaymentMethodsPage'
import { ReportsPage } from './pages/ReportsPage'
import { TransactionReceiptPage } from './pages/TransactionReceiptPage'
import { TransactionsPage } from './pages/TransactionsPage'

function App() {
  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/empresa" element={<CompanyPage />} />
        <Route path="/clientes" element={<CustomersPage />} />
        <Route path="/clientes/:id" element={<CustomerDetailPage />} />
        <Route path="/materiais" element={<MaterialsPage />} />
        <Route path="/materiais/:id" element={<MaterialDetailPage />} />
        <Route path="/formas-pagamento" element={<PaymentMethodsPage />} />
        <Route path="/coletas" element={<CollectionsPage />} />
        <Route path="/transacoes" element={<TransactionsPage />} />
        <Route path="/transacoes/:id/comprovante" element={<TransactionReceiptPage />} />
        <Route path="/relatorios" element={<ReportsPage />} />
        <Route path="/caixa" element={<CashFlowPage />} />
      </Routes>
    </AdminLayout>
  )
}

export default App
