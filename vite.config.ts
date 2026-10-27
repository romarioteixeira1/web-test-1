import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

/** Files from public/ the app needs offline, besides the build's own output. */
const PUBLIC_PRECACHE = ['/manifest.webmanifest', '/favicon.png', '/icons/icon-192.png', '/eco-logo.png']

/**
 * Writes /sw.js from pwa/sw.js with this build's file list, so every deploy
 * gets its own cache and the old one is dropped when the new version takes over.
 */
function pwaServiceWorker(): Plugin {
  return {
    name: 'ecocontrol-pwa-service-worker',
    applyToEnvironment: (environment) => environment.name === 'client',
    generateBundle(_options, bundle) {
      const files = Object.keys(bundle)
        // Dotfiles (e.g. Cloudflare's .assetsignore) are build config, never served.
        .filter((file) => file !== 'index.html' && !file.endsWith('.map') && !file.startsWith('.'))
        .map((file) => `/${file}`)
      const precache = ['/', ...files, ...PUBLIC_PRECACHE]

      const template = readFileSync('pwa/sw.js', 'utf8')
      const hash = createHash('sha256').update(template).update(precache.join())
      for (const output of Object.values(bundle)) {
        hash.update(output.type === 'chunk' ? output.code : output.source)
      }
      const version = hash.digest('hex').slice(0, 12)

      const source = template
        .replace('__VERSION__', version)
        .replace('__PRECACHE__', JSON.stringify(precache))
      this.emitFile({ type: 'asset', fileName: 'sw.js', source })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), cloudflare(), pwaServiceWorker()],
})
