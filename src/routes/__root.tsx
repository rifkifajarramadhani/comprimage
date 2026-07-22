import {
  HeadContent,
  Link,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left'
import ImageOff from 'lucide-react/dist/esm/icons/image-off'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import { Container } from '../components/layout/Container.tsx'
import { SiteHeader } from '../components/layout/SiteHeader.tsx'
import { SiteFooter } from '../components/layout/SiteFooter.tsx'
import { AppInit } from '../components/AppInit.tsx'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      // theme-color is not declared here: the router's head merge dedupes meta
      // by `name`, which would drop one of the two media variants. They are
      // rendered directly into <head> in RootDocument instead.
      {
        name: 'description',
        content:
          'Fast, privacy-first, 100% client-side image toolkit — resize, compress, and convert with modern codecs (MozJPEG, WebP, AVIF, JPEG XL) for strong compression at minimal quality loss, without uploading anything.',
      },
      { title: 'Comprimage — Image Toolkit' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      {
        rel: 'icon',
        href: '/comprimage-mark.svg',
        type: 'image/svg+xml',
        sizes: 'any',
      },
      {
        rel: 'icon',
        href: '/favicon.ico',
        type: 'image/x-icon',
        sizes: '16x16 32x32 48x48 64x64',
      },
      {
        rel: 'apple-touch-icon',
        href: '/apple-touch-icon.png',
        type: 'image/png',
        sizes: '180x180',
      },
      { rel: 'manifest', href: '/site.webmanifest' },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFoundPage,
})

function NotFoundPage() {
  return (
    <Container className="py-16 sm:py-24">
      <div className="mx-auto flex max-w-xl flex-col items-center text-center">
        <span className="border-border text-muted-foreground flex size-14 items-center justify-center rounded-sm border">
          <ImageOff className="size-7" aria-hidden />
        </span>
        <p className="terminal-label mt-6">[ error 404 ]</p>
        <h1 className="command-title mt-4">
          <span className="command-prompt" aria-hidden>
            ${' '}
          </span>
          page not found
          <span className="command-caret" aria-hidden />
        </h1>
        <p className="page-description mt-4">
          That URL doesn&apos;t match anything here. Check the address or head
          back to the home page.
        </p>
        <Link
          to="/"
          className="border-primary text-brand hover:bg-brand-soft mt-8 inline-flex h-11 items-center gap-2 rounded-sm border px-5 text-sm font-semibold"
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
// dark→light flash on reload. It also records the raw preference in
// `data-theme-pref`, which is what marks the active segment of the header theme
// switch in CSS — so that segment is right on the first frame too, without
// waiting for hydration. Kept dependency-free — it can't import modules.
const NO_FOUC_SCRIPT = `(function(){try{var p=localStorage.getItem('comprimage-theme');if(p!=='light'&&p!=='dark')p='system';var d=p==='dark'||(p!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;var c=r.classList;c.remove('light','dark');c.add(d?'dark':'light');r.setAttribute('data-theme-pref',p);var m=document.querySelectorAll('meta[name="theme-color"]');for(var i=0;i<m.length;i++){m[i].removeAttribute('media');m[i].setAttribute('content',d?'#171514':'#fdfcfc');}}catch(e){}})();`

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        {/* Both registers are declared so the static HTML is already correct
            for either OS setting; the script below then collapses them to the
            user's explicit preference before first paint. */}
        <meta
          name="theme-color"
          content="#fdfcfc"
          media="(prefers-color-scheme: light)"
        />
        <meta
          name="theme-color"
          content="#171514"
          media="(prefers-color-scheme: dark)"
        />
        <script dangerouslySetInnerHTML={{ __html: NO_FOUC_SCRIPT }} />
      </head>
      <body>
        <AppInit />
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </div>
        {import.meta.env.DEV && (
          <TanStackDevtools
            config={{ position: 'bottom-right' }}
            plugins={[
              {
                name: 'Tanstack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
            ]}
          />
        )}
        <Scripts />
      </body>
    </html>
  )
}
