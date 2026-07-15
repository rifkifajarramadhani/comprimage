import { afterEach, describe, expect, it, vi } from 'vitest'
import { createWorkboxConfig, isSameOriginNavigation } from './sw-config.mjs'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('service worker configuration', () => {
  it('keeps HTML out of the precache', () => {
    const config = createWorkboxConfig({
      globDirectory: '/tmp/dist',
      swDest: '/tmp/dist/sw.js',
    })

    expect(config.globPatterns).not.toContain(expect.stringContaining('html'))
    expect(config.globIgnores).toContain('sw-lifecycle.js')
  })

  it('uses network-first caching for same-origin navigations', () => {
    const config = createWorkboxConfig({
      globDirectory: '/tmp/dist',
      swDest: '/tmp/dist/sw.js',
    })
    const navigationCache = config.runtimeCaching[0]

    expect(navigationCache).toMatchObject({
      handler: 'NetworkFirst',
      options: {
        cacheName: 'comprimage-documents',
        expiration: { maxEntries: 8 },
        cacheableResponse: { statuses: [200] },
      },
    })
    expect(navigationCache.options).not.toHaveProperty('networkTimeoutSeconds')
    expect(config).toMatchObject({
      clientsClaim: true,
      skipWaiting: true,
      cleanupOutdatedCaches: true,
      navigationPreload: true,
      importScripts: ['/sw-lifecycle.js'],
    })
  })

  it('matches only same-origin navigation requests', () => {
    vi.stubGlobal('location', new URL('https://comprimage.example/'))

    expect(
      isSameOriginNavigation({
        request: { mode: 'navigate' },
        url: new URL('https://comprimage.example/resize'),
      }),
    ).toBe(true)
    expect(
      isSameOriginNavigation({
        request: { mode: 'no-cors' },
        url: new URL('https://comprimage.example/styles.css'),
      }),
    ).toBe(false)
    expect(
      isSameOriginNavigation({
        request: { mode: 'navigate' },
        url: new URL('https://external.example/'),
      }),
    ).toBe(false)
  })
})
