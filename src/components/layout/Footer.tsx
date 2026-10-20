import { Link } from 'react-router'
import { useApp } from '../../app/context'
import { dateOnly } from '../../lib/format'
import { IconChat, IconChevron } from './icons'
import { BrandLogo } from './BrandLogo'
import { navGroups } from './navigation'

type Props = {
  onOpenHelp: () => void
  onBackToTop: () => void
}

/** Page footer at the end of every screen: company card, the full menu, help and a back-to-top link. */
export function Footer({ onOpenHelp, onBackToTop }: Props) {
  const { company, counts } = useApp()
  const year = new Date().getFullYear()
  const place = [company?.city, company?.state].filter(Boolean).join(' / ')

  const stats = counts
    ? [
        { value: counts.customers, label: 'clientes' },
        { value: counts.materials, label: 'materiais' },
        { value: counts.paymentMethods, label: 'formas de pagamento' },
      ]
    : []

  return (
    <footer className="footer print:hidden">
      <div className="footer-band">
        <div className="footer-band-text">
          <strong>Cada quilo conta.</strong>
          <span>Registre suas compras, vendas e coletas e acompanhe o resultado do seu negócio de reciclagem.</span>
        </div>
        {stats.length > 0 && (
          <dl className="footer-stats">
            {stats.map((s) => (
              <div key={s.label}>
                <dt>{s.label}</dt>
                <dd className="mono">{s.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <div className="footer-grid">
        <div className="footer-brand">
          <BrandLogo compact />
          <p>Gestão completa para o seu negócio de materiais recicláveis.</p>

          {company ? (
            <Link to="/empresa" className="footer-company">
              <strong>{company.trade_name}</strong>
              {company.cnpj && <span>CNPJ {company.cnpj}</span>}
              {place && <span>{place}</span>}
              {company.license_number && (
                <span>
                  Licença {company.license_number}
                  {company.license_expires_at && ` · válida até ${dateOnly(company.license_expires_at)}`}
                </span>
              )}
            </Link>
          ) : (
            company === null && (
              <Link to="/empresa" className="footer-company empty">
                <strong>Sua empresa ainda não foi cadastrada</strong>
                <span>Cadastre para os dados aparecerem nos comprovantes.</span>
              </Link>
            )
          )}
        </div>

        {navGroups.map((group) => (
          <nav key={group.title} className="footer-col" aria-label={group.title}>
            <h2>{group.title}</h2>
            <ul>
              {group.items.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to}>{label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="footer-col">
          <h2>AJUDA</h2>
          <p>Dúvidas sobre alguma tela? O assistente explica o passo a passo.</p>
          <button type="button" className="btn ghost footer-help" onClick={onOpenHelp}>
            <IconChat size={16} />
            Falar com o assistente
          </button>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {year} EcoControl · Gestão de recicláveis</span>
        <span className="footer-motto">♻ Transformando resíduo em recurso</span>
        <button type="button" className="footer-top" onClick={onBackToTop}>
          Voltar ao topo
          <IconChevron size={14} />
        </button>
      </div>
    </footer>
  )
}
