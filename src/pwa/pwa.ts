import { useSyncExternalStore } from 'react'

/** Chrome's install prompt event; not in the DOM typings yet. */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type PwaState = {
  /** A new version is installed and waiting for the page to say "go". */
  updateReady: boolean
  /** The browser offered to install the app (Chrome, Edge, Android). */
  canInstall: boolean
}

let state: PwaState = { updateReady: false, canInstall: false }
let waitingWorker: ServiceWorker | null = null
let installEvent: BeforeInstallPromptEvent | null = null
let updateRequested = false
const listeners = new Set<() => void>()

function setState(patch: Partial<PwaState>) {
  state = { ...state, ...patch }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Registers /sw.js (production builds only; the dev server has none) and listens for install offers. */
export function setupPwa() {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    installEvent = event as BeforeInstallPromptEvent
    setState({ canInstall: true })
  })
  window.addEventListener('appinstalled', () => {
    installEvent = null
    setState({ canInstall: false })
  })

  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return

  // Only reload when the user asked for the update; the very first install also changes the controller.
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (updateRequested) window.location.reload()
  })

  window.addEventListener('load', async () => {
    const registration = await navigator.serviceWorker.register('/sw.js').catch(() => null)
    if (!registration) return

    const offerUpdate = (worker: ServiceWorker) => {
      waitingWorker = worker
      setState({ updateReady: true })
    }
    if (registration.waiting && navigator.serviceWorker.controller) offerUpdate(registration.waiting)
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing
      worker?.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) offerUpdate(worker)
      })
    })

    // An installed app can stay open for days; look for a new version whenever it comes back.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') void registration.update()
    })
  })
}

export function applyUpdate() {
  if (!waitingWorker) return
  updateRequested = true
  waitingWorker.postMessage('SKIP_WAITING')
}

export async function installApp() {
  if (!installEvent) return
  await installEvent.prompt()
  await installEvent.userChoice
  installEvent = null
  setState({ canInstall: false })
}

export function usePwa() {
  return useSyncExternalStore(subscribe, () => state)
}

export function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

/** iPhone/iPad Safari has no install prompt: people add the app from the Share menu. */
export function isIos() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}
