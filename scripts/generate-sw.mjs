// Generates the production service worker with Workbox after `vite build`.
// vite-plugin-pwa skips SSR/environment builds, and TanStack Start builds every
// environment through that path, so the plugin never emits sw.js. Running
// workbox-build's generateSW directly against the static client output is
// deterministic and framework-agnostic.
import { generateSW } from 'workbox-build'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const swDest = resolve(root, 'dist/client/sw.js')

const { count, size, warnings } = await generateSW({
  globDirectory: resolve(root, 'dist/client'),
  globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,json}'],
  swDest,
  // Prompt-to-update: a new build waits until the user clicks Reload (which
  // posts SKIP_WAITING, handled by the imported sw-message.js), rather than
  // auto-reloading and dropping in-progress work. clientsClaim lets the newly
  // activated worker take control so the page reloads once on confirmation.
  clientsClaim: true,
  skipWaiting: false,
  importScripts: ['/sw-message.js'],
  cleanupOutdatedCaches: true,
  // Route/worker chunks can exceed the 2 MiB default.
  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
  // Serve the prerendered home document for uncached navigations (offline / deep
  // links); the client router then hydrates and resolves the actual route.
  navigateFallback: '/index.html',
  runtimeCaching: [
    {
      // Google Fonts stylesheet + font files, so type still renders offline.
      urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    {
      // @jsquash codec `.wasm` binaries are loaded lazily per format. Cache each
      // on first use so subsequent (and offline) encodes don't refetch it — and
      // so the install stays lean instead of precaching every codec upfront.
      urlPattern: /\.wasm$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'jsquash-codecs',
        expiration: { maxEntries: 12, maxAgeSeconds: 60 * 60 * 24 * 365 },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
  ],
})

for (const warning of warnings) console.warn(warning)
console.log(
  `[generate-sw] Precached ${count} files, ${(size / 1024).toFixed(1)} KiB -> dist/client/sw.js`,
)
