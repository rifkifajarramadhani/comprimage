import Download from 'lucide-react/dist/esm/icons/download'
import type { ProcessResult, SourceImage } from '#/types/image.ts'
import { Button } from '#/components/ui/button.tsx'
import { downloadBlob } from '#/lib/download.ts'
import { formatMeta, withExtension } from '#/lib/convert.ts'

export function DownloadButton({
  source,
  result,
  disabled,
}: {
  source: SourceImage
  result: ProcessResult | null
  disabled?: boolean
}) {
  return (
    <Button
      size="lg"
      className="w-full"
      disabled={disabled || !result}
      onClick={() => {
        if (!result) return
        downloadBlob(
          result.blob,
          withExtension(source.file.name, result.format),
        )
      }}
    >
      <Download data-icon="inline-start" />
      {result
        ? `Download ${formatMeta(result.format).label}`
        : 'Preparing download…'}
    </Button>
  )
}
