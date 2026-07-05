import type { OutputFormat } from '#/types/image.ts'

interface FormatMeta {
  format: OutputFormat
  label: string
  ext: string
  lossy: boolean
}

/** Output formats offered by the toolkit. AVIF is filtered by runtime support. */
export const FORMATS: Array<FormatMeta> = [
  { format: 'image/jpeg', label: 'JPG', ext: 'jpg', lossy: true },
  { format: 'image/png', label: 'PNG', ext: 'png', lossy: false },
  { format: 'image/webp', label: 'WebP', ext: 'webp', lossy: true },
  { format: 'image/avif', label: 'AVIF', ext: 'avif', lossy: true },
]

export function formatMeta(format: OutputFormat): FormatMeta {
  return FORMATS.find((f) => f.format === format) ?? FORMATS[0]
}

export function isLossy(format: OutputFormat): boolean {
  return formatMeta(format).lossy
}

/** Replace a filename's extension with the output format's extension. */
export function withExtension(filename: string, format: OutputFormat): string {
  const base = filename.replace(/\.[^./\\]+$/, '')
  return `${base}.${formatMeta(format).ext}`
}
