import { useEffect, useState } from 'react'
import type { OutputFormat } from '#/types/image.ts'
import { FORMATS } from '#/lib/convert.ts'
import { supportsAvifEncode } from '#/lib/canvas.ts'
import { Label } from '#/components/ui/label.tsx'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select.tsx'

export function FormatSelect({
  value,
  onChange,
  label = 'Output format',
}: {
  value: OutputFormat
  onChange: (format: OutputFormat) => void
  label?: string
}) {
  const [avifOk, setAvifOk] = useState(false)

  useEffect(() => {
    supportsAvifEncode().then(setAvifOk)
  }, [])

  const options = FORMATS.filter(
    (f) => f.format !== 'image/avif' || avifOk,
  )

  return (
    <div className="grid gap-2">
      <Label htmlFor="format">{label}</Label>
      <Select value={value} onValueChange={(v) => onChange(v as OutputFormat)}>
        <SelectTrigger id="format" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((f) => (
            <SelectItem key={f.format} value={f.format}>
              {f.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
