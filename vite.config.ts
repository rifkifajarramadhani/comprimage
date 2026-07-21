import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  // The @jsquash codecs resolve their `.wasm` binaries via `import.meta.url`.
  // esbuild's dep pre-bundling rewrites that and breaks the lookup, so exclude
  // them — each codec is dynamically imported and its wasm emitted as an asset.
  optimizeDeps: {
    exclude: [
      '@jsquash/jpeg',
      '@jsquash/png',
      '@jsquash/oxipng',
      '@jsquash/webp',
      '@jsquash/avif',
      '@jsquash/jxl',
    ],
  },
  // Pin the preview server (used by TanStack Start's prerender step) to IPv4.
  // In minimal containers `localhost` resolves to both 127.0.0.1 and ::1; the
  // preview server and the prerender fetch can otherwise pick different families,
  // producing a ConnectionRefused during `vite build`'s prerender.
  preview: { host: '127.0.0.1' },
  plugins: [
    devtools(),
    tailwindcss(),
    // Emit deterministic HTML for every public route. Navigation remains
    // client-side after hydration, while crawlers and link preview bots receive
    // complete page content and metadata without executing JavaScript.
    tanstackStart({
      prerender: {
        enabled: true,
        autoStaticPathsDiscovery: false,
        crawlLinks: false,
        failOnError: true,
      },
      pages: [
        { path: '/' },
        { path: '/resize' },
        { path: '/compress' },
        { path: '/convert' },
        { path: '/batch' },
        { path: '/about' },
        { path: '/settings', sitemap: { exclude: true } },
      ],
      sitemap: {
        enabled: true,
        host: 'https://comprimage.my.id',
      },
    }),
    viteReact(),
  ],
})

export default config
