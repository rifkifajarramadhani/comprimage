import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    tailwindcss(),
    // SPA / static mode: emit a static SPA shell so the app deploys to any
    // static host (GitHub Pages, Cloudflare, Netlify) with no backend. All
    // image processing runs client-side, so there is nothing to render server-side.
    tanstackStart({ spa: { enabled: true } }),
    viteReact(),
  ],
})

export default config
