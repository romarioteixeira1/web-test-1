import { useState } from 'react'
import { IconClose } from '../components/layout/icons'
import { applyUpdate, installApp, isIos, isStandalone, usePwa } from './pwa'

/** Remembers "Agora não" on the install offer, so it isn't shown on every visit. */
const DISMISS_KEY = 'ecocontrol-install-dismissed'

function wasDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * One banner at a time, above the content: a new version is ready, or (on phones)
 * an offer to install the app on the home screen.
 */
export function PwaBanner() {
  const { updateReady, canInstall } = usePwa()
  const [dismissed, setDismissed] = useState(wasDismissed)
  const phone = window.matchMedia('(max-width: 900px)').matches
  const offerInstall = phone && !dismissed && !isStandalone()

  function dismiss() {
    setDismissed(true)
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      // Blocked storage: it just shows again next visit.
    }
  }

  if (updateReady) {
    return (
      <div className="pwa-banner print:hidden" role="status">
        <img src="/icons/icon-192.png" alt="" width={36} height={36} />
        <div className="pwa-banner-text">
          <strong>Nova versão disponível</strong>
          <span>Atualize para usar as últimas melhorias.</span>
        </div>
        <button type="button" className="btn" onClick={applyUpdate}>
          Atualizar
        </button>
      </div>
    )
  }

  if (offerInstall && (canInstall || isIos())) {
    return (
      <div className="pwa-banner print:hidden" role="region" aria-label="Instalar aplicativo">
        <img src="/icons/icon-192.png" alt="" width={36} height={36} />
        <div className="pwa-banner-text">
          <strong>Instale o EcoControl</strong>
          {canInstall ? (
            <span>Abra direto da tela inicial, em tela cheia.</span>
          ) : (
            <span>Toque em Compartilhar e depois em “Adicionar à Tela de Início”.</span>
          )}
        </div>
        {canInstall && (
          <button type="button" className="btn" onClick={() => void installApp()}>
            Instalar
          </button>
        )}
        <button type="button" className="icon" aria-label="Agora não" title="Agora não" onClick={dismiss}>
          <IconClose />
        </button>
      </div>
    )
  }

  return null
}
