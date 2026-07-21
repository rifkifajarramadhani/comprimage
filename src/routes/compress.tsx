import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import type { EncodeOptions } from '#/types/image.ts'
import type { ProcessOptions } from '#/lib/process.ts'
import { useSettingsStore } from '#/stores/settings-store.ts'
import { ToolWorkspace } from '#/components/ToolWorkspace.tsx'
import { FormatSelect } from '#/components/controls/FormatSelect.tsx'
import { CompressControls } from '#/components/controls/CompressControls.tsx'
import { createSeoHead } from '#/lib/seo.ts'

export const Route = createFileRoute('/compress')({
  component: CompressPage,
  head: () =>
    createSeoHead({
      path: '/compress',
      title: 'Compress Images Online Privately | Comprimage',
      description:
        'Reduce image file size with modern JPEG, WebP, AVIF, PNG, and JPEG XL codecs. Preview quality before saving; nothing is uploaded.',
    }),
})

function CompressPage() {
  const settings = useSettingsStore.getState()
  const [encode, setEncode] = useState<EncodeOptions>({
    format: settings.defaultFormat,
    quality: settings.defaultQuality,
  })

  // Compress keeps the source dimensions (no resize) — just re-encodes.
  const options: ProcessOptions = { encode }

  return (
    <ToolWorkspace
      title="Compress images"
      command="comprimage compress"
      description="Reduce file size at the same dimensions and see the result update as you tune quality."
      options={options}
      controls={
        <div className="grid gap-5">
          <p className="terminal-label">[ output ]</p>
          <FormatSelect
            value={encode.format}
            onChange={(format) => setEncode((e) => ({ ...e, format }))}
            label="Encode as"
          />
          <CompressControls value={encode} onChange={setEncode} />
        </div>
      }
    />
  )
}
