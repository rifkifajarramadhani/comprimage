import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import type { EncodeOptions, ResizeOptions } from '#/types/image.ts'
import type { ProcessOptions } from '#/lib/process.ts'
import { useSettingsStore } from '#/stores/settings-store.ts'
import { ToolWorkspace } from '#/components/ToolWorkspace.tsx'
import { ResizeControls } from '#/components/controls/ResizeControls.tsx'
import { FormatSelect } from '#/components/controls/FormatSelect.tsx'
import { CompressControls } from '#/components/controls/CompressControls.tsx'
import { seo } from '#/lib/site.ts'

export const Route = createFileRoute('/resize')({
  component: ResizePage,
  head: () =>
    seo({
      path: '/resize',
      title: 'Resize images in your browser — Comprimage',
      description:
        'Resize images by width, height, longest edge, or percentage, with aspect ratio locked and progressive downscaling that keeps edges crisp. 100% client-side — nothing is uploaded.',
    }),
})

function ResizePage() {
  const settings = useSettingsStore.getState()
  const [resize, setResize] = useState<ResizeOptions>({
    mode: 'width',
    value: 1280,
    keepAspectRatio: true,
    preventUpscaling: settings.preventUpscale,
  })
  const [encode, setEncode] = useState<EncodeOptions>({
    format: settings.defaultFormat,
    quality: settings.defaultQuality,
  })

  const options: ProcessOptions = { resize, encode }

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
          <FormatSelect
            value={encode.format}
            onChange={(format) => setEncode((e) => ({ ...e, format }))}
          />
          <CompressControls value={encode} onChange={setEncode} />
        </div>
      }
    />
  )
}
