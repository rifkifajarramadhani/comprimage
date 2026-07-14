import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import type { EncodeOptions, ResizeOptions } from '#/types/image.ts'
import type { ProcessOptions } from '#/lib/process.ts'
import { useSettingsStore } from '#/stores/settings-store.ts'
import { ToolWorkspace } from '#/components/ToolWorkspace.tsx'
import { ResizeControls } from '#/components/controls/ResizeControls.tsx'
import { FormatSelect } from '#/components/controls/FormatSelect.tsx'
import { CompressControls } from '#/components/controls/CompressControls.tsx'
import { createSeoHead } from '#/lib/seo.ts'

export const Route = createFileRoute('/resize')({
  component: ResizePage,
  head: () =>
    createSeoHead({
      path: '/resize',
      title: 'Resize Images Online Privately | Comprimage',
      description:
        'Resize images in your browser while preserving aspect ratio and preventing unwanted upscaling. Your files never leave your device.',
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
      title="Resize images"
      description="Change dimensions while keeping the result crisp. Aspect ratio stays locked and upscaling is blocked by default."
      options={options}
      controls={
        <div className="grid gap-5">
          <ResizeControls options={resize} onChange={setResize} />
          <div className="border-border border-t" />
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
