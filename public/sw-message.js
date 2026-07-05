// Imported into the generated Workbox service worker (see scripts/generate-sw.mjs).
// Lets the page activate a waiting worker on demand for the prompt-to-update flow.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
