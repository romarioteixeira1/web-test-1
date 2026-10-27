import { Link } from 'react-router'
import { useApp } from '../../app/context'
import { IconChat, IconChevron } from './icons'
import { BrandLogo } from './BrandLogo'

type Props = {
  onOpenHelp: () => void
  onBackToTop: () => void
}

/** Compact page footer at the end of every screen: company, help and a back-to-top link. */
export function Footer({ onOpenHelp, onBackToTop }: Props) {
  const { company } = useApp()
  const year = new Date().getFullYear()
  const place = [company?.city, company?.state].filter(Boolean).join(' / ')

  return (
    <footer className="footer print:hidden">
      <div className="footer-brand">
        <BrandLogo compact />
        {company ? (
          <Link to="/empresa" className="footer-company">
            <strong>{company.trade_name}</strong>
            {company.cnpj && <span>CNPJ {company.cnpj}</span>}
            {place && <span>{place}</span>}
          </Link>
        ) : (
          company === null && (
            <Link to="/empresa" className="footer-company footer-company-empty">
              <strong>Cadastre sua empresa</strong>
            </Link>
          )
        )}
      </div>

      <div className="footer-actions">
        <span className="footer-copy">© {year} EcoControl</span>
        <button type="button" className="footer-link" onClick={onOpenHelp}>
          <IconChat size={14} />
          Ajuda
        </button>
        <button type="button" className="footer-link footer-top" onClick={onBackToTop}>
          Topo
          <IconChevron size={14} />
        </button>
      </div>
    </footer>
  )
}
