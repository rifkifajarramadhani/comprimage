// Generates the production service worker with Workbox after `vite build`.
// vite-plugin-pwa skips SSR/environment builds, and TanStack Start builds every
// environment through that path, so the plugin never emits sw.js. Running
// workbox-build's generateSW directly against the static client output is
// deterministic and framework-agnostic.
import { generateSW } from 'workbox-build'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { createWorkboxConfig } from './sw-config.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const swDest = resolve(root, 'dist/client/sw.js')

const { count, size, warnings } = await generateSW(
  createWorkboxConfig({
    globDirectory: resolve(root, 'dist/client'),
    swDest,
  }),
)

for (const warning of warnings) console.warn(warning)
console.log(
  `[generate-sw] Precached ${count} files, ${(size / 1024).toFixed(1)} KiB -> dist/client/sw.js`,
)
