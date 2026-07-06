import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import type { EncodeOptions } from '#/types/image.ts'
import type { ProcessOptions } from '#/lib/process.ts'
import { useSettingsStore } from '#/stores/settings-store.ts'
import { ToolWorkspace } from '#/components/ToolWorkspace.tsx'
import { FormatSelect } from '#/components/controls/FormatSelect.tsx'
import { CompressControls } from '#/components/controls/CompressControls.tsx'

export const Route = createFileRoute('/convert')({ component: ConvertPage })

function ConvertPage() {
  const settings = useSettingsStore.getState()
  const [encode, setEncode] = useState<EncodeOptions>({
    format: settings.defaultFormat,
    quality: settings.defaultQuality,
  })

  const options: ProcessOptions = { encode }

  return (
    <ToolWorkspace
      eyebrow="Convert"
      title="Convert formats"
      description="Change between JPG, PNG, WebP, AVIF and JPEG XL. AVIF and JPEG XL use built-in WASM codecs."
      options={options}
      controls={
        <div className="grid gap-5">
          <FormatSelect
            value={encode.format}
            onChange={(format) => setEncode((e) => ({ ...e, format }))}
            label="Convert to"
          />
          <CompressControls value={encode} onChange={setEncode} />
        </div>
      }
    />
  )
}
