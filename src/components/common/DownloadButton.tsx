import { Download } from 'lucide-react'
import type { ProcessResult, SourceImage } from '#/types/image.ts'
import { Button } from '#/components/ui/button.tsx'
import { downloadBlob } from '#/lib/download.ts'
import { withExtension } from '#/lib/convert.ts'

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
      disabled={disabled || !result}
      onClick={() => {
        if (!result) return
        downloadBlob(result.blob, withExtension(source.file.name, result.format))
      }}
    >
      <Download />
      Download
    </Button>
  )
}
