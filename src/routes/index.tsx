import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowRight, Maximize2, Minimize2, Repeat } from 'lucide-react'
import { Container } from '#/components/layout/Container.tsx'
import { Dropzone } from '#/components/upload/Dropzone.tsx'

export const Route = createFileRoute('/')({ component: Home })

const TOOLS = [
  {
    to: '/resize',
    icon: Maximize2,
    title: 'Resize',
    body: 'Scale by width, height, longest edge, or percentage — aspect ratio locked, upscaling blocked.',
  },
  {
    to: '/compress',
    icon: Minimize2,
    title: 'Compress',
    body: 'Shrink file size at full resolution with a live quality slider and instant savings.',
  },
  {
    to: '/convert',
    icon: Repeat,
    title: 'Convert',
    body: 'Move between JPG, PNG, WebP and AVIF, right in your browser.',
  },
] as const

function Home() {
  const navigate = useNavigate()

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
            Image tools that never leave your device
          </h1>
          <p className="text-charcoal mx-auto mt-6 max-w-2xl text-lg">
            Resize, compress, and convert images entirely in your browser. No
            uploads, no accounts, no waiting.
          </p>

          <div className="mx-auto mt-10 max-w-xl text-left">
            <Dropzone
              onImage={() =>
                navigate({ to: '/resize' })
              }
            />
            <p className="text-ash mt-3 text-center text-sm">
              Drop an image to start resizing, or pick a tool below.
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
              <h2 className="text-ink mt-4 text-xl font-medium">{tool.title}</h2>
              <p className="text-charcoal mt-2 flex-1 text-sm">{tool.body}</p>
              <span className="text-mute group-hover:text-ink mt-4 inline-flex items-center gap-1 text-sm transition-colors">
                Open <ArrowRight className="size-4" />
              </span>
            </Link>
          ))}
        </div>
      </Container>
    </>
  )
}
