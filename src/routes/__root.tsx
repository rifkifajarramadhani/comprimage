import {
  HeadContent,
  Link,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'
import { Container } from '../components/layout/Container.tsx'
import { SiteHeader } from '../components/layout/SiteHeader.tsx'
import { SiteFooter } from '../components/layout/SiteFooter.tsx'
import { AppInit } from '../components/AppInit.tsx'
import { PwaUpdater } from '../components/pwa/PwaUpdater.tsx'

import appCss from '../styles.css?url'
import { SITE_NAME, SITE_URL, absUrl } from '../lib/site.ts'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

const ROOT_TITLE = 'Comprimage — Image Toolkit'
const ROOT_DESCRIPTION =
  'Fast, privacy-first, 100% client-side image toolkit — resize, compress, and convert with modern codecs (MozJPEG, WebP, AVIF, JPEG XL) for strong compression at minimal quality loss, without uploading anything.'
const OG_IMAGE = absUrl('/logo512.png')

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'theme-color', content: '#000000' },
      { name: 'description', content: ROOT_DESCRIPTION },
      { title: ROOT_TITLE },
      // Open Graph — defaults; routes may override og:title/og:description/og:url.
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: SITE_NAME },
      { property: 'og:title', content: ROOT_TITLE },
      { property: 'og:description', content: ROOT_DESCRIPTION },
      { property: 'og:url', content: `${SITE_URL}/` },
      { property: 'og:image', content: OG_IMAGE },
      // Twitter Card
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: ROOT_TITLE },
      { name: 'twitter:description', content: ROOT_DESCRIPTION },
      { name: 'twitter:image', content: OG_IMAGE },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'manifest', href: '/manifest.json' },
      { rel: 'icon', href: '/favicon.ico' },
      { rel: 'apple-touch-icon', href: '/logo192.png' },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFoundPage,
})

function NotFoundPage() {
  return (
    <section className="atmos-glow">
      <Container className="py-12 sm:py-16">
        <header className="max-w-2xl">
          <p className="kicker mb-3">404</p>
          <h1 className="display-title text-5xl sm:text-6xl">Page not found</h1>
          <p className="text-charcoal mt-4 text-lg">
            That URL doesn&apos;t match anything here. Check the address or head
            back to the home page.
          </p>
          <div className="mt-8">
            <Link
              to="/"
              className="text-mute hover:text-ink inline-flex items-center gap-1 text-sm transition-colors"
            >
              Back to home <ArrowRight className="size-4" />
            </Link>
          </div>
        </header>
      </Container>
    </section>
  )
}

// Runs before first paint: resolve the persisted theme (mirrored to a standalone
// key by the settings store) and set the register class on <html> so there is no
// dark→light flash on reload. Kept dependency-free — it can't import modules.
const NO_FOUC_SCRIPT = `(function(){try{var p=localStorage.getItem('comprimage-theme')||'system';var d=p==='dark'||(p!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var c=document.documentElement.classList;c.remove('light','dark');c.add(d?'dark':'light');}catch(e){}})();`

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    // NO_FOUC_SCRIPT below rewrites this class (dark/light) before React hydrates,
    // so the prerendered `dark` won't match the client for light-theme users.
    // Theme is applied purely via CSS on this class, so nothing in the DOM below
    // actually differs — suppress the expected <html>-level hydration mismatch
    // (otherwise React throws #418 and discards the prerendered tree).
    <html lang="en" className="dark" suppressHydrationWarning>
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
