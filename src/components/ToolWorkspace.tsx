import { RotateCcw } from 'lucide-react'
import type { ProcessOptions } from '#/lib/process.ts'
import { useImageProcessor } from '#/hooks/use-image-processor.ts'
import { useImageStore } from '#/stores/image-store.ts'
import { Container } from '#/components/layout/Container.tsx'
import { Dropzone } from '#/components/upload/Dropzone.tsx'
import { BeforeAfter } from '#/components/preview/BeforeAfter.tsx'
import { Stats } from '#/components/statistics/Stats.tsx'
import { DownloadButton } from '#/components/common/DownloadButton.tsx'
import { Button } from '#/components/ui/button.tsx'

/**
 * Shared workspace for the resize / compress / convert tools. Owns the source
 * image + processing, and renders the controls the specific tool passes in.
 */
export function ToolWorkspace({
  eyebrow,
  title,
  description,
  options,
  controls,
}: {
  eyebrow: string
  title: string
  description: string
  /** Built by the tool from its own control state. */
  options: ProcessOptions
  /** The tool's control panel. */
  controls: React.ReactNode
}) {
  // Source lives in a shared store so it carries over from the home dropzone
  // and persists when switching between resize / compress / convert. The store
  // owns the object-URL lifecycle (release on replace/clear).
  const source = useImageStore((s) => s.source)
  const setSource = useImageStore((s) => s.setSource)
  const clearSource = useImageStore((s) => s.clearSource)
  const { result, isProcessing, error } = useImageProcessor(source, options)

  return (
    <section className="atmos-glow">
      <Container className="py-12 sm:py-16">
        <header className="mb-10 max-w-2xl">
          <p className="kicker mb-3">{eyebrow}</p>
          <h1 className="display-title text-5xl sm:text-6xl">{title}</h1>
          <p className="text-charcoal mt-4 text-lg">{description}</p>
        </header>

        {!source ? (
          <Dropzone onImage={setSource} />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <aside className="surface-card h-fit p-6">
              <div className="mb-5 flex items-center justify-between">
                <span className="kicker">Options</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSource}
                >
                  <RotateCcw />
                  New image
                </Button>
              </div>
              {controls}
              <div className="mt-6">
                <DownloadButton
                  source={source}
                  result={result}
                  disabled={isProcessing}
                />
              </div>
              {error && (
                <p
                  className="mt-3 text-sm"
                  style={{ color: 'var(--accent-red)' }}
                >
                  {error}
                </p>
              )}
            </aside>

            <div className="grid gap-4">
              {result && <Stats source={source} result={result} />}
              <BeforeAfter source={source} result={result} />
            </div>
          </div>
        )}
      </Container>
    </section>
  )
}
