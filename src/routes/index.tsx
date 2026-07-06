import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowRight, Maximize2, Minimize2, Repeat } from 'lucide-react'
import { Container } from '#/components/layout/Container.tsx'
import { Dropzone } from '#/components/upload/Dropzone.tsx'
import { useImageStore } from '#/stores/image-store.ts'

export const Route = createFileRoute('/')({ component: Home })

const TOOLS = [
  {
    to: '/resize',
    icon: Maximize2,
    title: 'Resize',
    body: 'Scale by width, height, longest edge, or percentage — with progressive downscaling that keeps edges crisp.',
  },
  {
    to: '/compress',
    icon: Minimize2,
    title: 'Compress',
    body: 'Shrink file size at full resolution with modern codecs and a target-quality mode that finds the sweet spot for you.',
  },
  {
    to: '/convert',
    icon: Repeat,
    title: 'Convert',
    body: 'Move between JPG, PNG, WebP, AVIF and JPEG XL, right in your browser.',
  },
] as const

const HIGHLIGHTS = [
  {
    title: 'Modern codecs',
    body: 'MozJPEG, WebP, AVIF and JPEG XL — smaller files at the same visible quality.',
  },
  {
    title: 'Auto quality',
    body: 'Target a visual quality and we search for the smallest file that still looks right.',
  },
  {
    title: 'Progressive resizing',
    body: 'Multi-step downscaling suppresses the aliasing a single resize leaves behind.',
  },
  {
    title: 'Never uploaded',
    body: 'Every byte is processed on your device — it works offline and nothing is sent anywhere.',
  },
] as const

function Home() {
  const navigate = useNavigate()
  const setSource = useImageStore((s) => s.setSource)

  return (
    <>
      <section className="atmos-glow">
        <Container className="py-20 text-center sm:py-28">
          <p className="badge-pill mx-auto mb-6">
            <span
              className="inline-block size-2 rounded-full"
              style={{ background: 'var(--accent-green)' }}
            />
            100% client-side · images never uploaded
          </p>
          <h1 className="display-title mx-auto max-w-4xl text-5xl sm:text-7xl">
            Strong compression, barely any quality loss
          </h1>
          <p className="text-charcoal mx-auto mt-6 max-w-2xl text-lg">
            Resize, compress, and convert with state-of-the-art codecs (MozJPEG,
            WebP, AVIF, JPEG XL) and progressive resizing — dramatically smaller
            files that still look right. All in your browser, nothing uploaded.
          </p>

          <div className="mx-auto mt-10 max-w-xl text-left">
            <Dropzone
              onImage={(image) => {
                setSource(image)
                navigate({ to: '/resize' })
              }}
            />
            <p className="text-ash mt-3 text-center text-sm">
              Drop an image to start, or{' '}
              <Link to="/about" className="underline underline-offset-4">
                see how it works
              </Link>
              .
            </p>
          </div>
        </Container>
      </section>

      <Container className="pb-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {TOOLS.map((tool) => (
            <Link
              key={tool.to}
              to={tool.to}
              className="feature-card group flex flex-col p-6"
            >
              <tool.icon className="text-ink size-6" />
              <h2 className="text-ink mt-4 text-xl font-medium">
                {tool.title}
              </h2>
              <p className="text-charcoal mt-2 flex-1 text-sm">{tool.body}</p>
              <span className="text-mute group-hover:text-ink mt-4 inline-flex items-center gap-1 text-sm transition-colors">
                Open <ArrowRight className="size-4" />
              </span>
            </Link>
          ))}
        </div>
      </Container>

      <Container className="pb-16">
        <div className="mb-5 flex items-end justify-between">
          <p className="kicker">Why it holds up</p>
          <Link
            to="/about"
            className="text-mute hover:text-ink inline-flex items-center gap-1 text-sm transition-colors"
          >
            Learn more <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HIGHLIGHTS.map((h) => (
            <div key={h.title} className="surface-card p-5">
              <h3 className="text-ink font-medium">{h.title}</h3>
              <p className="text-charcoal mt-2 text-sm">{h.body}</p>
            </div>
          ))}
        </div>
      </Container>
    </>
  )
}
