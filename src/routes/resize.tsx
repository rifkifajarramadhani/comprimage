import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import type { OutputFormat, ResizeOptions } from '#/types/image.ts'
import type { ProcessOptions } from '#/lib/process.ts'
import { DEFAULT_QUALITY, supportsQuality } from '#/lib/compress.ts'
import { ToolWorkspace } from '#/components/ToolWorkspace.tsx'
import { ResizeControls } from '#/components/controls/ResizeControls.tsx'
import { FormatSelect } from '#/components/controls/FormatSelect.tsx'
import { CompressControls } from '#/components/controls/CompressControls.tsx'

export const Route = createFileRoute('/resize')({ component: ResizePage })

function ResizePage() {
  const [resize, setResize] = useState<ResizeOptions>({
    mode: 'width',
    value: 1280,
    keepAspectRatio: true,
    preventUpscaling: true,
  })
  const [format, setFormat] = useState<OutputFormat>('image/jpeg')
  const [quality, setQuality] = useState(DEFAULT_QUALITY)

  const options: ProcessOptions = {
    resize,
    encode: { format, quality },
  }

  return (
    <ToolWorkspace
      eyebrow="Resize"
      title="Resize images"
      description="Scale by width, height, longest edge, or percentage — with aspect ratio locked and upscaling blocked by default."
      options={options}
      controls={
        <div className="grid gap-5">
          <ResizeControls options={resize} onChange={setResize} />
          <div style={{ borderTop: '1px solid var(--hairline)' }} />
          <FormatSelect value={format} onChange={setFormat} />
          <CompressControls
            quality={quality}
            onQualityChange={setQuality}
            disabled={!supportsQuality(format)}
          />
        </div>
      }
    />
  )
}
