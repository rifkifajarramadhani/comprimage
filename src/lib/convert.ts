import type { OutputFormat } from '#/types/image.ts'

interface FormatMeta {
  format: OutputFormat
  label: string
  ext: string
  /** Whether the format is lossy by default (has a meaningful quality knob). */
  lossy: boolean
  /** Whether the format additionally supports a lossless encode mode. */
  canLossless: boolean
  /** Whether chroma subsampling is a meaningful knob for this format. */
  hasSubsampling: boolean
  /**
   * Whether the format needs the WASM codec path (no native canvas encoder).
   * AVIF/JXL are only encodable via @jsquash, so they are gated on WASM support.
   */
  requiresWasm: boolean
}

/**
 * Output formats offered by the toolkit. AVIF and JPEG XL require the WASM
 * codecs (no native canvas encoder) and are filtered by runtime support.
 */
export const FORMATS: Array<FormatMeta> = [
  {
    format: 'image/jpeg',
    label: 'JPG',
    ext: 'jpg',
    lossy: true,
    canLossless: false,
    hasSubsampling: true,
    requiresWasm: false,
  },
  {
    format: 'image/png',
    label: 'PNG',
    ext: 'png',
    lossy: false,
    canLossless: true,
    hasSubsampling: false,
    requiresWasm: false,
  },
  {
    format: 'image/webp',
    label: 'WebP',
    ext: 'webp',
    lossy: true,
    canLossless: true,
    hasSubsampling: false,
    requiresWasm: false,
  },
  {
    format: 'image/avif',
    label: 'AVIF',
    ext: 'avif',
    lossy: true,
    canLossless: true,
    hasSubsampling: true,
    requiresWasm: true,
  },
  {
    format: 'image/jxl',
    label: 'JPEG XL',
    ext: 'jxl',
    lossy: true,
    canLossless: true,
    hasSubsampling: false,
    requiresWasm: true,
  },
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
