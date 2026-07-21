import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right'
import Cpu from 'lucide-react/dist/esm/icons/cpu'
import Download from 'lucide-react/dist/esm/icons/download'
import Eye from 'lucide-react/dist/esm/icons/eye'
import FileDown from 'lucide-react/dist/esm/icons/file-down'
import FolderOpen from 'lucide-react/dist/esm/icons/folder-open'
import ImageIcon from 'lucide-react/dist/esm/icons/image'
import Maximize2 from 'lucide-react/dist/esm/icons/maximize-2'
import Repeat2 from 'lucide-react/dist/esm/icons/repeat-2'
import Sparkles from 'lucide-react/dist/esm/icons/sparkles'
import { Container } from '#/components/layout/Container.tsx'
import { Dropzone } from '#/components/upload/Dropzone.tsx'
import { useImageStore } from '#/stores/image-store.ts'
import { createSeoHead, WEBSITE_JSON_LD } from '#/lib/seo.ts'

export const Route = createFileRoute('/')({
  component: Home,
  head: () => {
    const seo = createSeoHead({
      path: '/',
      title: 'Image Compressor, Resizer & Converter | Comprimage',
      description:
        'Compress, resize, and convert JPG, PNG, WebP, AVIF, and JPEG XL images privately in your browser. No uploads, with fast local processing.',
    })

    return {
      ...seo,
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify(WEBSITE_JSON_LD),
        },
      ],
    }
  },
})

const TOOLS = [
  {
    to: '/resize',
    icon: Maximize2,
    title: 'Resize',
    body: 'Change dimensions and resolution',
  },
  {
    to: '/compress',
    icon: FileDown,
    title: 'Compress',
    body: 'Reduce file size with smart options',
  },
  {
    to: '/convert',
    icon: Repeat2,
    title: 'Convert',
    body: 'Change format without extra steps',
  },
] as const

const QUALITY_POINTS = [
  {
    icon: Cpu,
    title: 'Modern codecs',
    body: 'MozJPEG, WebP, AVIF, and JPEG XL run through WebAssembly.',
  },
  {
    icon: Sparkles,
    title: 'Smart defaults',
    body: 'Balanced settings get you close before you touch a control.',
  },
  {
    icon: Eye,
    title: 'Preview first',
    body: 'Compare the original and result before you save anything.',
  },
] as const

const PRIVACY_STEPS = [
  { icon: FolderOpen, title: 'Choose files', body: 'From your device' },
  { icon: Cpu, title: 'Process locally', body: 'Inside your browser' },
  { icon: ImageIcon, title: 'Review results', body: 'Before you export' },
  { icon: Download, title: 'Save', body: 'Back to your device' },
] as const

function Home() {
  const navigate = useNavigate()
  const setSource = useImageStore((s) => s.setSource)

  return (
    <>
      <Container className="py-10 sm:py-14">
        <section className="grid gap-10 lg:grid-cols-[1.18fr_0.82fr] lg:gap-12">
          <div className="flex min-w-0 flex-col">
            <p className="terminal-label">[ image optimization, locally ]</p>
            <h1 className="command-title mt-5">
              <span className="command-prompt" aria-hidden>
                ${' '}
              </span>
              comprimage optimize
              <span className="command-caret" aria-hidden />
            </h1>
            <p className="text-body-text mt-5 max-w-2xl text-base leading-7">
              Make images lighter. Keep them looking right.
              <br />
              Resize, compress, and convert with professional codecs.
              <br />
              Everything runs locally in your browser.
            </p>
            <Link
              to="/batch"
              className="text-brand mt-6 inline-flex w-fit items-center gap-2 rounded-sm text-sm font-medium outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/30"
            >
              Processing a folder? Open batch mode
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Dropzone
              className="mt-8"
              onImage={(image) => {
                setSource(image)
                navigate({ to: '/resize' })
              }}
            />
          </div>

          <nav
            aria-label="Choose an image tool"
            className="border-border lg:border-l lg:pl-8"
          >
            <p className="terminal-label mb-6">[ tools ]</p>
            <div className="border-border divide-border divide-y border-y">
              {TOOLS.map((tool) => (
                <Link
                  key={tool.to}
                  to={tool.to}
                  className="group hover:bg-surface focus-visible:bg-brand-soft flex min-h-28 items-center gap-5 px-2 py-5 outline-none transition-colors sm:px-4"
                >
                  <span className="border-line-strong text-foreground group-hover:border-primary group-hover:text-brand flex size-12 shrink-0 items-center justify-center rounded-sm border transition-colors">
                    <tool.icon className="size-5" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="text-foreground block font-semibold">
                      {tool.title}
                    </span>
                    <span className="text-muted-foreground mt-2 block text-xs leading-5">
                      {tool.body}
                    </span>
                  </span>
                  <ArrowRight
                    className="text-muted-foreground ml-auto size-4 shrink-0 transition-transform group-hover:translate-x-1 group-hover:text-brand"
                    aria-hidden
                  />
                </Link>
              ))}
            </div>
          </nav>
        </section>
      </Container>

      <div className="border-border border-y">
        <Container className="grid gap-10 py-10 lg:grid-cols-2 lg:gap-0">
          <section className="lg:border-border lg:border-r lg:pr-10">
            <h2 className="terminal-label">[ built for visible quality ]</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-3">
              {QUALITY_POINTS.map(({ icon: Icon, title, body }) => (
                <article key={title} className="flex flex-col gap-3">
                  <Icon className="text-foreground size-5" aria-hidden />
                  <h3 className="text-foreground text-sm font-semibold">
                    {title}
                  </h3>
                  <p className="text-muted-foreground text-xs leading-5">
                    {body}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="lg:pl-10">
            <h2 className="terminal-label">[ private by design ]</h2>
            <ol className="mt-6 grid gap-5 sm:grid-cols-4">
              {PRIVACY_STEPS.map(({ icon: Icon, title, body }, index) => (
                <li key={title} className="relative flex gap-3 sm:flex-col">
                  <span className="border-border text-foreground flex size-10 shrink-0 items-center justify-center rounded-sm border">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <div>
                    <div className="text-foreground flex items-center gap-2 text-xs font-semibold">
                      <span className="text-brand">{index + 1}</span> {title}
                    </div>
                    <p className="text-muted-foreground mt-1 text-xs leading-5">
                      {body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            <Link
              to="/about"
              className="text-brand mt-7 inline-flex items-center gap-2 text-xs font-semibold hover:underline"
            >
              How local processing works
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </section>
        </Container>
      </div>
    </>
  )
}
