import {
  HeadContent,
  Link,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { ArrowLeft, ImageOff } from 'lucide-react'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'
import { Container } from '../components/layout/Container.tsx'
import { SiteHeader } from '../components/layout/SiteHeader.tsx'
import { SiteFooter } from '../components/layout/SiteFooter.tsx'
import { AppInit } from '../components/AppInit.tsx'
import { PwaUpdater } from '../components/pwa/PwaUpdater.tsx'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'theme-color', content: '#ffffff' },
      {
        name: 'description',
        content:
          'Fast, privacy-first, 100% client-side image toolkit — resize, compress, and convert with modern codecs (MozJPEG, WebP, AVIF, JPEG XL) for strong compression at minimal quality loss, without uploading anything.',
      },
      { title: 'Comprimage — Image Toolkit' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'manifest', href: '/manifest.json' },
      {
        rel: 'icon',
        href: '/comprimage-mark.svg',
        type: 'image/svg+xml',
      },
      { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFoundPage,
})

function NotFoundPage() {
  return (
    <Container className="py-16 sm:py-24">
      <div className="mx-auto flex max-w-xl flex-col items-center text-center">
        <span className="bg-brand-soft text-brand flex size-14 items-center justify-center rounded-xl">
          <ImageOff className="size-7" aria-hidden />
        </span>
        <h1 className="page-title mt-6">Page not found</h1>
        <p className="page-description mt-4">
          That URL doesn&apos;t match anything here. Check the address or head
          back to the home page.
        </p>
        <Link
          to="/"
          className="bg-primary text-primary-foreground mt-8 inline-flex h-11 items-center gap-2 rounded-md px-5 text-sm font-semibold shadow-[var(--control-shadow)]"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to home
        </Link>
      </div>
    </Container>
  )
}

// Runs before first paint: resolve the persisted theme (mirrored to a standalone
// key by the settings store) and set the register class on <html> so there is no
// dark→light flash on reload. Kept dependency-free — it can't import modules.
const NO_FOUC_SCRIPT = `(function(){try{var p=localStorage.getItem('comprimage-theme')||'system';var d=p==='dark'||(p!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var c=document.documentElement.classList;c.remove('light','dark');c.add(d?'dark':'light');var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',d?'#151722':'#ffffff');}catch(e){}})();`

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: NO_FOUC_SCRIPT }} />
      </head>
      <body>
        <AppInit />
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </div>
        <PwaUpdater />
        {import.meta.env.DEV && (
          <TanStackDevtools
            config={{ position: 'bottom-right' }}
            plugins={[
              {
                name: 'Tanstack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
              TanStackQueryDevtools,
            ]}
          />
        )}
        <Scripts />
      </body>
    </html>
  )
}
