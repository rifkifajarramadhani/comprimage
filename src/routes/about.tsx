import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowRight,
  Cpu,
  Eye,
  FileImage,
  LockKeyhole,
  ScanSearch,
  ShieldCheck,
} from 'lucide-react'
import { Container } from '#/components/layout/Container.tsx'
import { PageIntro } from '#/components/layout/PageIntro.tsx'

export const Route = createFileRoute('/about')({
  component: AboutPage,
  head: () => ({
    meta: [
      {
        title:
          'How Comprimage works — strong compression, minimal quality loss',
      },
      {
        name: 'description',
        content:
          'Comprimage uses modern WASM image codecs, progressive resizing, and perceptual target quality to shrink images locally in your browser.',
      },
    ],
  }),
})

const PIPELINE = [
  {
    icon: FileImage,
    title: 'Decode',
    body: 'Your browser opens the source into raw pixels. No server or upload is involved.',
  },
  {
    icon: ScanSearch,
    title: 'Resize carefully',
    body: 'Large reductions happen in progressive steps to protect edges and fine texture.',
  },
  {
    icon: Cpu,
    title: 'Encode locally',
    body: 'A WebAssembly codec runs in a background worker so the interface stays responsive.',
  },
] as const

const DETAILS = [
  {
    icon: Eye,
    title: 'Quality-aware compression',
    body: 'Auto quality searches for the smallest result that still meets a perceptual SSIM target instead of relying on a guessed slider value.',
  },
  {
    icon: Cpu,
    title: 'Professional codecs',
    body: 'MozJPEG, libwebp, AVIF, and JPEG XL provide modern output formats and fine control over effort, subsampling, and lossless modes.',
  },
  {
    icon: LockKeyhole,
    title: 'A stronger privacy model',
    body: 'The app never receives your image data because there is no upload endpoint. Installed as a PWA, the processing tools also work offline.',
  },
] as const

function AboutPage() {
  return (
    <Container className="py-10 sm:py-12">
      <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:h-fit">
          <PageIntro
            title="Small files, without the mush"
            description="Comprimage pairs modern codecs with careful resizing so you can reduce image weight without giving up the detail that matters."
          />
          <div className="bg-success-soft text-success mt-7 flex items-start gap-3 rounded-xl p-4 text-sm leading-6">
            <ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden />
            <p>
              Every decode, resize, comparison, and encode happens on this
              device. Your images are never sent anywhere.
            </p>
          </div>
          <Link
            to="/compress"
            className="bg-primary text-primary-foreground mt-7 inline-flex h-11 items-center gap-2 rounded-md px-5 text-sm font-semibold shadow-[var(--control-shadow)] hover:bg-[var(--brand-hover)]"
          >
            Try it on an image
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>

        <div className="flex flex-col gap-12">
          <section>
            <h2 className="section-title">A three-step local pipeline</h2>
            <p className="text-body-text mt-3 max-w-2xl leading-7">
              The order matters: decode faithfully, resize without a destructive
              jump, then encode for the chosen destination.
            </p>
            <ol className="border-border mt-6 border-y">
              {PIPELINE.map(({ icon: Icon, title, body }, index) => (
                <li
                  key={title}
                  className="border-border grid gap-4 border-b py-6 last:border-b-0 sm:grid-cols-[48px_1fr]"
                >
                  <span className="bg-brand-soft text-brand flex size-11 items-center justify-center rounded-lg">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div>
                    <h3 className="text-foreground font-semibold">
                      {index + 1}. {title}
                    </h3>
                    <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
                      {body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h2 className="section-title">Why the result holds up</h2>
            <div className="mt-6 grid gap-7 sm:grid-cols-2">
              {DETAILS.map(({ icon: Icon, title, body }, index) => (
                <article
                  key={title}
                  className={
                    index === 2 ? 'sm:col-span-2 sm:max-w-2xl' : undefined
                  }
                >
                  <Icon className="text-brand size-5" aria-hidden />
                  <h3 className="text-foreground mt-3 font-semibold">
                    {title}
                  </h3>
                  <p className="text-muted-foreground mt-2 text-sm leading-6">
                    {body}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="surface-subtle p-5 sm:p-6">
            <h2 className="text-foreground font-semibold">
              Formats and control
            </h2>
            <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
              Export JPG, PNG, WebP, AVIF, or JPEG XL. Lossy formats expose
              quality and effort controls; supported codecs also offer lossless
              output and chroma subsampling choices.
            </p>
          </section>
        </div>
      </div>
    </Container>
  )
}
