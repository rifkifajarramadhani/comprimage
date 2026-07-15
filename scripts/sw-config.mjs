export function isSameOriginNavigation({ request, url }) {
  return (
    request.mode === 'navigate' && url.origin === globalThis.location.origin
  )
}

export function createWorkboxConfig({ globDirectory, swDest }) {
  return {
    globDirectory,
    // Documents are intentionally runtime-cached network-first. Precache only
    // versioned application assets and static non-HTML resources.
    globPatterns: ['**/*.{js,css,ico,png,svg,woff2,json}'],
    globIgnores: [
      'manifest.json',
      'favicon.ico',
      'apple-touch-icon.png',
      'comprimage-mark.svg',
      'icons/**',
      'sw-lifecycle.js',
    ],
    swDest,
    // Workbox claims clients during activation; the imported lifecycle script
    // then navigates existing windows so it can migrate older app bundles too.
    clientsClaim: true,
    skipWaiting: true,
    importScripts: ['/sw-lifecycle.js'],
    cleanupOutdatedCaches: true,
    navigationPreload: true,
    // Route/worker chunks can exceed the 2 MiB default.
    maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
    // No navigateFallback: this is a prerendered multi-page site. Each route
    // has its own document and nginx resolves clean URLs to the right file.
    runtimeCaching: [
      {
        // Prefer the deployed document online and retain the latest successful
        // response for repeat visits while offline.
        urlPattern: isSameOriginNavigation,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'comprimage-documents',
          expiration: { maxEntries: 8 },
          cacheableResponse: { statuses: [200] },
        },
      },
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
        // Cache lazily loaded @jsquash codec binaries after their first use.
        urlPattern: /\.wasm$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'jsquash-codecs',
          expiration: { maxEntries: 12, maxAgeSeconds: 60 * 60 * 24 * 365 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
    ],
  }
}
