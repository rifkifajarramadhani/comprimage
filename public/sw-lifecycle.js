let isUpgrade = false
const reloadClientsMessage = 'comprimage:reload-clients'

// During install, registration.active is null for a first-time registration
// and points to the previous worker for an update.
self.addEventListener('install', () => {
  isUpgrade = Boolean(self.registration.active)
})

self.addEventListener('activate', () => {
  if (!isUpgrade) return

  // Queue work back to this worker. Message events are delivered once the new
  // worker is active, after Workbox's clientsClaim activation handler settles.
  self.registration.active?.postMessage({ type: reloadClientsMessage })
})

self.addEventListener('message', (event) => {
  if (event.data?.type !== reloadClientsMessage) return

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      const sameOriginWindows = windows.filter(
        (client) => new URL(client.url).origin === self.location.origin,
      )

      await Promise.allSettled(
        sameOriginWindows.map((client) => client.navigate(client.url)),
      )
    })(),
  )
})
