import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  ArrowRight,
  CheckCircle2,
  Cpu,
  Download,
  Eye,
  FileDown,
  FolderOpen,
  ImageIcon,
  Layers3,
  Maximize2,
  Repeat2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Container } from '#/components/layout/Container.tsx'
import { Dropzone } from '#/components/upload/Dropzone.tsx'
import { useImageStore } from '#/stores/image-store.ts'

export const Route = createFileRoute('/')({ component: Home })

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
      <Container className="py-12 sm:py-16">
        <section className="grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
          <div className="flex flex-col items-start gap-6">
            <h1 className="page-title max-w-[16ch] text-[2.5rem] sm:text-5xl">
              Make images lighter. Keep them looking right.
            </h1>
            <p className="page-description max-w-xl text-lg">
              Resize, compress, and convert with professional codecs. Everything
              runs locally in your browser.
            </p>
            <Link
              to="/batch"
              className="text-brand hover:text-[var(--brand-hover)] inline-flex h-11 items-center gap-2 rounded-md text-sm font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30"
            >
              <Layers3 className="size-4" aria-hidden />
              Processing a folder? Open batch mode
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>

          <Dropzone
            onImage={(image) => {
              setSource(image)
              navigate({ to: '/resize' })
            }}
          />
        </section>

        <nav
          aria-label="Choose an image tool"
          className="border-border mt-10 grid overflow-hidden rounded-xl border sm:grid-cols-3"
        >
          {TOOLS.map((tool, index) => (
            <Link
              key={tool.to}
              to={tool.to}
              className={`group hover:bg-surface focus-visible:bg-brand-soft flex min-h-24 items-center gap-4 px-5 py-4 outline-none transition-colors ${
                index > 0
                  ? 'border-border border-t sm:border-t-0 sm:border-l'
                  : ''
              }`}
            >
              <span className="bg-brand-soft text-brand group-hover:bg-primary group-hover:text-primary-foreground flex size-11 shrink-0 items-center justify-center rounded-lg transition-colors">
                <tool.icon className="size-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="text-foreground block font-semibold">
                  {tool.title}
                </span>
                <span className="text-muted-foreground mt-1 block text-sm">
                  {tool.body}
                </span>
              </span>
              <ArrowRight
                className="text-muted-foreground ml-auto size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          ))}
        </nav>
      </Container>

      <div className="border-border bg-surface-subtle border-y">
        <Container className="grid gap-10 py-14 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <div>
            <span className="bg-brand-soft text-brand flex size-11 items-center justify-center rounded-lg">
              <Eye className="size-5" aria-hidden />
            </span>
            <h2 className="section-title mt-5">Built for visible quality</h2>
            <p className="text-body-text mt-3 max-w-md leading-7">
              A smaller file only matters if the image still looks right. The
              pipeline protects detail at every step.
            </p>
          </div>
          <div className="border-border grid divide-y border-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {QUALITY_POINTS.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="flex flex-col gap-3 px-1 py-5 sm:px-6"
              >
                <Icon className="text-brand size-5" aria-hidden />
                <h3 className="text-foreground font-semibold">{title}</h3>
                <p className="text-muted-foreground text-sm leading-6">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </div>

      <Container className="py-14 sm:py-18">
        <section className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <span className="bg-success-soft text-success flex size-11 items-center justify-center rounded-lg">
              <ShieldCheck className="size-5" aria-hidden />
            </span>
            <h2 className="section-title mt-5">Private by design</h2>
            <p className="text-body-text mt-3 max-w-lg leading-7">
              Nothing is uploaded. Your files stay with you from the moment you
              open them until you save the result.
            </p>
            <Link
              to="/about"
              className="text-brand mt-5 inline-flex items-center gap-2 text-sm font-semibold hover:underline"
            >
              How local processing works
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <ol className="grid gap-4 sm:grid-cols-4">
            {PRIVACY_STEPS.map(({ icon: Icon, title, body }, index) => (
              <li key={title} className="relative flex gap-3 sm:flex-col">
                <span className="border-success/30 bg-success-soft text-success flex size-10 shrink-0 items-center justify-center rounded-lg border">
                  <Icon className="size-4" aria-hidden />
                </span>
                <div>
                  <div className="text-foreground flex items-center gap-2 text-sm font-semibold">
                    {title}
                    <CheckCircle2
                      className="text-success size-3.5"
                      aria-hidden
                    />
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">{body}</p>
                </div>
                {index < PRIVACY_STEPS.length - 1 && (
                  <span
                    className="bg-border absolute top-5 left-10 hidden h-px w-[calc(100%-2.5rem)] sm:block"
                    aria-hidden
                  />
                )}
              </li>
            ))}
          </ol>
        </section>
      </Container>
    </>
  )
}
