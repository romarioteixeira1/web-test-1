import type { ComponentType, ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { listCustomers } from '../api/customers'
import { listMaterials } from '../api/materials'
import { listPaymentMethods } from '../api/paymentMethods'
import { useLoader } from '../app/hooks'
import { CategoryChart, CustomerDonut, MarginChart } from '../components/dashboard/DashboardCharts'
import { IconBox, IconCard, IconTrend, IconUsers } from '../components/layout/icons'
import { Hero } from '../components/ui/Hero'
import { ErrorBox, Loading } from '../components/ui/ListCard'
import { brl, plural } from '../lib/format'
import { averageMargin } from '../lib/metrics'

const quickActions = [
  { to: '/clientes', label: 'Novo cliente' },
  { to: '/materiais', label: 'Novo material' },
  { to: '/formas-pagamento', label: 'Nova forma' },
]

export function HomePage() {
  const navigate = useNavigate()
  const { data, loading, error, reload } = useLoader(
    () => Promise.all([listCustomers(), listMaterials(), listPaymentMethods()]),
    [],
  )
  const [customers, materials, methods] = data ?? [[], [], []]

  const suppliers = customers.filter((c) => c.relationship_type !== 'comprador').length
  const buyers = customers.filter((c) => c.relationship_type !== 'fornecedor').length
  const categories = new Set(materials.map((m) => m.category).filter(Boolean)).size
  const activeMethods = methods.filter((m) => m.active).length
  const avg = averageMargin(materials)
  const priced = materials.filter((m) => m.buy_price != null && m.sell_price != null).length

  const todayText = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  const today = todayText.charAt(0).toUpperCase() + todayText.slice(1)

  return (
    <div className="page">
      <Hero
        title="Bem-vindo ao EcoControl"
        subtitle="Gestão completa para o seu negócio de materiais recicláveis."
        aside={
          <div className="quick">
            {quickActions.map((q) => (
              <button
                key={q.to}
                type="button"
                className="qa"
                onClick={() => navigate(q.to, { state: { openCreate: true } })}
              >
                <span className="qa-dot" aria-hidden="true">
                  +
                </span>
                {q.label}
              </button>
            ))}
          </div>
        }
      >
        <span className="hero-date order-first">{today}</span>
      </Hero>

      {error && <ErrorBox message={error} onRetry={() => reload()} />}
      {loading && <Loading />}

      {data && (
        <>
          <div className="kpis">
            <Kpi
              icon={IconUsers}
              accent="#185A1F"
              label="Clientes"
              value={customers.length}
              detail={`${plural(suppliers, 'fornecedor', 'fornecedores')} · ${plural(buyers, 'comprador', 'compradores')}`}
              onClick={() => navigate('/clientes')}
            />
            <Kpi
              icon={IconBox}
              accent="#237A2C"
              label="Materiais"
              value={materials.length}
              detail={plural(categories, 'categoria', 'categorias')}
              onClick={() => navigate('/materiais')}
            />
            <Kpi
              icon={IconCard}
              accent="#2E9A30"
              label="Formas de pagamento"
              value={`${activeMethods}/${methods.length}`}
              detail="ativas agora"
              onClick={() => navigate('/formas-pagamento')}
            />
            <Kpi
              icon={IconTrend}
              accent="#5DBB3A"
              label="Margem média / kg"
              value={avg == null ? '—' : brl(avg)}
              tone={avg != null && avg < 0 ? 'neg' : undefined}
              detail={`entre ${plural(priced, 'material', 'materiais')} com preço`}
              onClick={() => navigate('/materiais')}
            />
          </div>

          <div className="charts">
            <MarginChart materials={materials} />
            <CustomerDonut customers={customers} />
            <CategoryChart materials={materials} />
          </div>
        </>
      )}
    </div>
  )
}

function Kpi({
  icon: Icon,
  accent,
  label,
  value,
  detail,
  tone,
  onClick,
}: {
  icon: ComponentType<{ size?: number }>
  accent: string
  label: string
  value: ReactNode
  detail: string
  tone?: 'neg'
  onClick: () => void
}) {
  return (
    <button type="button" className="kpi" style={{ ['--k' as string]: accent }} onClick={onClick}>
      <span className="kpi-icon">
        <Icon size={22} />
      </span>
      <span className="kpi-text">
        <span className="l">{label}</span>
        <span className={`v mono ${tone ?? ''}`}>{value}</span>
        <span className="s">{detail}</span>
      </span>
    </button>
  )
}
