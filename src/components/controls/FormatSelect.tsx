import type { OutputFormat } from '#/types/image.ts'
import { FORMATS } from '#/lib/convert.ts'
import { supportsWasmEncode } from '#/lib/encode.ts'
import { Label } from '#/components/ui/label.tsx'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select.tsx'

export function FormatSelect({
  value,
  onChange,
  label = 'Output format',
  hideLabel = false,
  id = 'format',
}: {
  value: OutputFormat
  onChange: (format: OutputFormat) => void
  label?: string
  hideLabel?: boolean
  id?: string
}) {
  // AVIF/JXL are WASM-only; hide them if WebAssembly is unavailable.
  const wasmOk = supportsWasmEncode()
  const options = FORMATS.filter((f) => !f.requiresWasm || wasmOk)

  return (
    <div className="grid gap-2">
      {!hideLabel && <Label htmlFor={id}>{label}</Label>}
      <Select value={value} onValueChange={(v) => onChange(v as OutputFormat)}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((f) => (
              <SelectItem key={f.format} value={f.format}>
                {f.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}
