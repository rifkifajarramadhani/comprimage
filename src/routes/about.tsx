import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { Container } from '#/components/layout/Container.tsx'
import { seo } from '#/lib/site.ts'

export const Route = createFileRoute('/about')({
  component: AboutPage,
  head: () =>
    seo({
      path: '/about',
      title: 'How Comprimage works — strong compression, minimal quality loss',
      description:
        'Comprimage uses modern WASM image codecs (MozJPEG, WebP, AVIF, JPEG XL), progressive resizing, and a perceptual target-quality mode to shrink images with minimal visible quality loss — all client-side.',
    }),
})

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="surface-card p-6 sm:p-8">
      <div className="mb-5 max-w-2xl">
        <h2 className="text-ink text-lg font-medium">{title}</h2>
        {description && <p className="text-ash mt-1 text-sm">{description}</p>}
      </div>
      {children}
    </section>
  )
}

function Point({
  term,
  children,
}: {
  term: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="text-ink font-medium">{term}</div>
      <p className="text-charcoal mt-1 text-sm">{children}</p>
    </div>
  )
}

function AboutPage() {
  return (
    <section className="atmos-glow">
      <Container className="py-12 sm:py-16">
        <header className="mb-10 max-w-2xl">
          <p className="kicker mb-3">About</p>
          <h1 className="display-title text-5xl sm:text-6xl">
            Small files, without the mush
          </h1>
          <p className="text-charcoal mt-4 text-lg">
            Comprimage is a private, 100% client-side image toolkit. It leans on
            the same codecs used by professional image pipelines to cut file
            size hard while keeping images looking right — and it never sends
            your photos anywhere.
          </p>
        </header>

        <div className="grid max-w-3xl gap-6">
          <Section
            title="How it works"
            description="Every image runs through the same three-step pipeline, entirely on your device."
          >
            <div className="grid gap-4">
              <Point term="1 · Decode">
                Your image is decoded to raw pixels in the browser — no server,
                no upload.
              </Point>
              <Point term="2 · Progressive resize">
                When you scale down, we step the image down in halves rather
                than in one jump. A single large resize undersamples and leaves
                jagged, shimmering edges (aliasing and moiré); halving
                repeatedly keeps the resampler in its sweet spot and preserves
                detail.
              </Point>
              <Point term="3 · Modern-codec encode">
                The pixels are re-encoded by a WebAssembly build of a
                best-in-class codec, running in a background thread so the page
                stays responsive.
              </Point>
            </div>
          </Section>

          <Section
            title="Why quality holds up"
            description="The difference between a good compressor and a bad one is mostly the encoder."
          >
            <div className="grid gap-4">
              <Point term="Better encoders than the browser's">
                Instead of the browser's built-in encoder, Comprimage uses
                MozJPEG, libwebp, AVIF (libaom) and libjxl. At the same visible
                quality these routinely produce noticeably smaller files — and
                they can encode AVIF and JPEG XL even where the browser cannot.
              </Point>
              <Point term="Target-quality auto mode">
                Rather than guessing a quality number, pick a target and
                Comprimage searches for the smallest file that still matches the
                original closely — judged by SSIM, a perceptual similarity score
                rather than raw pixel error.
              </Point>
              <Point term="Sharp resizing">
                Progressive downscaling means thumbnails and previews keep their
                edges and fine texture instead of turning soft or shimmery.
              </Point>
            </div>
          </Section>

          <Section
            title="Formats & controls"
            description="Sensible defaults, with the knobs there when you want them."
          >
            <div className="grid gap-4">
              <Point term="Formats">
                JPG, PNG, WebP, AVIF and JPEG XL — lossy or lossless where the
                format supports it.
              </Point>
              <Point term="Fine control">
                Adjust quality, encode effort (more CPU for a smaller file),
                chroma subsampling, and lossless mode per format.
              </Point>
            </div>
          </Section>

          <Section
            title="Privacy by design"
            description="The strongest privacy guarantee is not sending data at all."
          >
            <div className="grid gap-4">
              <Point term="Nothing leaves your browser">
                All decoding, resizing and encoding happen locally. There is no
                account, no server, and no analytics on your images.
              </Point>
              <Point term="Works offline">
                Installed as a PWA, Comprimage keeps working with no network —
                codecs are cached after first use.
              </Point>
            </div>
          </Section>

          <div>
            <Link
              to="/compress"
              className="text-mute hover:text-ink inline-flex items-center gap-1 text-sm transition-colors"
            >
              Try it on an image <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </Container>
    </section>
  )
}
