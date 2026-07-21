import { useCallback, useRef, useState } from 'react'
import Info from 'lucide-react/dist/esm/icons/info'
import Loader2 from 'lucide-react/dist/esm/icons/loader-circle'
import Minus from 'lucide-react/dist/esm/icons/minus'
import MoveHorizontal from 'lucide-react/dist/esm/icons/move-horizontal'
import Plus from 'lucide-react/dist/esm/icons/plus'
import type { ProcessResult, SourceImage } from '#/types/image.ts'
import { formatMeta } from '#/lib/convert.ts'
import { formatBytes } from '#/lib/format.ts'
import { Button } from '#/components/ui/button.tsx'

function sourceFormat(type: string): string {
  const value = type.split('/')[1] ?? type
  return value === 'jpeg' ? 'JPG' : value.toUpperCase()
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function BeforeAfter({
  source,
  result,
}: {
  source: SourceImage
  result: ProcessResult | null
}) {
  const [split, setSplit] = useState(50)
  const [zoom, setZoom] = useState(1)
  const viewportRef = useRef<HTMLDivElement>(null)

  const updateSplit = useCallback((clientX: number) => {
    const bounds = viewportRef.current?.getBoundingClientRect()
    if (!bounds || bounds.width === 0) return
    setSplit(clamp(((clientX - bounds.left) / bounds.width) * 100, 0, 100))
  }, [])

  const zoomBy = (delta: number) =>
    setZoom((current) => clamp(current + delta, 0.5, 2.5))

  return (
    <section
      aria-label="Image comparison"
      className="surface-subtle overflow-hidden"
    >
      <div className="divide-border grid grid-cols-2 divide-x border-b border-border">
        <div className="flex min-h-12 items-center justify-between gap-3 px-4">
          <span className="text-foreground text-sm font-semibold">
            Original
          </span>
          <span className="text-muted-foreground mono truncate text-xs">
            {source.width} × {source.height} · {sourceFormat(source.type)} ·{' '}
            {formatBytes(source.size)}
          </span>
        </div>
        <div className="flex min-h-12 items-center justify-between gap-3 px-4">
          <span className="text-foreground text-sm font-semibold">Result</span>
          <span className="text-muted-foreground mono truncate text-xs">
            {result
              ? `${result.width} × ${result.height} · ${formatMeta(result.format).label} · ${formatBytes(result.size)}`
              : 'Preparing…'}
          </span>
        </div>
      </div>

      <div
        ref={viewportRef}
        data-testid="comparison-viewport"
        className="bg-surface relative min-h-[360px] touch-none overflow-hidden sm:min-h-[520px]"
        onWheel={(event) => {
          event.preventDefault()
          zoomBy(event.deltaY < 0 ? 0.1 : -0.1)
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden p-3">
          <img
            src={source.url}
            alt="Original image preview"
            className="max-h-full max-w-full object-contain transition-transform duration-150"
            style={{ transform: `scale(${zoom})` }}
          />
        </div>

        {result ? (
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: `inset(0 0 0 ${split}%)` }}
          >
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden p-3">
              <img
                src={result.url}
                alt="Result image preview"
                className="max-h-full max-w-full object-contain transition-transform duration-150"
                style={{ transform: `scale(${zoom})` }}
              />
            </div>
          </div>
        ) : (
          <div
            role="status"
            className="bg-surface/90 text-muted-foreground absolute inset-0 flex flex-col items-center justify-center gap-3 text-sm"
          >
            <Loader2 className="size-5 animate-spin" aria-hidden />
            Preparing result…
            <span className="sr-only">Image processing is in progress.</span>
          </div>
        )}

        {result && (
          <button
            type="button"
            role="slider"
            aria-label="Before and after comparison"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(split)}
            data-testid="comparison-divider"
            className="group absolute inset-y-0 z-10 w-9 -translate-x-1/2 cursor-col-resize touch-none outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            style={{ left: `${split}%` }}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId)
              updateSplit(event.clientX)
            }}
            onPointerMove={(event) => {
              if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                updateSplit(event.clientX)
              }
            }}
            onPointerUp={(event) => {
              event.currentTarget.releasePointerCapture(event.pointerId)
            }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowLeft') {
                setSplit((value) => clamp(value - 2, 0, 100))
                event.preventDefault()
              } else if (event.key === 'ArrowRight') {
                setSplit((value) => clamp(value + 2, 0, 100))
                event.preventDefault()
              } else if (event.key === 'Home') {
                setSplit(0)
                event.preventDefault()
              } else if (event.key === 'End') {
                setSplit(100)
                event.preventDefault()
              }
            }}
          >
            <span className="bg-background absolute inset-y-0 left-1/2 w-px -translate-x-1/2" />
            <span className="border-line-strong bg-background text-foreground group-focus-visible:border-primary absolute top-1/2 left-1/2 flex size-10 -translate-1/2 items-center justify-center rounded-full border">
              <MoveHorizontal className="size-4" aria-hidden />
            </span>
          </button>
        )}
      </div>

      <div className="border-border text-muted-foreground flex flex-col gap-3 border-t px-4 py-3 text-xs sm:flex-row sm:items-center">
        <p className="flex items-center gap-2">
          <Info className="size-4 shrink-0" aria-hidden />
          Drag the divider to compare · Scroll to zoom · Hover to focus
        </p>
        <div className="ml-auto flex items-center">
          <Button
            variant="outline"
            size="icon-sm"
            className="rounded-r-none"
            onClick={() => zoomBy(-0.1)}
            aria-label="Zoom out"
          >
            <Minus aria-hidden />
          </Button>
          <output
            className="border-border flex h-9 min-w-14 items-center justify-center border-y px-2 text-foreground"
            aria-live="polite"
          >
            {Math.round(zoom * 100)}%
          </output>
          <Button
            variant="outline"
            size="icon-sm"
            className="rounded-l-none"
            onClick={() => zoomBy(0.1)}
            aria-label="Zoom in"
          >
            <Plus aria-hidden />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="ml-3"
            onClick={() => setZoom(1)}
          >
            Fit
          </Button>
        </div>
      </div>
    </section>
  )
}
