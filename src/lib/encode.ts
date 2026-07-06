import type { EncodeOptions, OutputFormat } from '#/types/image.ts'
import type { AnyCanvas } from './canvas.ts'
import { canvasToBlob, getImageData } from './canvas.ts'
import { formatMeta } from './convert.ts'
import { ssim } from './ssim.ts'

/**
 * WASM-codec encoders (@jsquash). These beat the browser's native
 * `canvas.toBlob` encoders on quality-per-byte — MozJPEG, libwebp, libaom
 * (AVIF), OxiPNG, and libjxl — and expose effort/lossless/subsampling knobs the
 * platform never did. They also let us *encode* AVIF and JPEG-XL in browsers
 * whose canvas can't.
 *
 * Each codec's `.wasm` is fetched lazily on first use via a dynamic `import()`,
 * so a session that only makes WebP never downloads the AVIF/JXL binaries. Vite
 * resolves each codec's `import.meta.url`-relative wasm as an asset (this relies
 * on the `optimizeDeps.exclude` entries in vite.config.ts).
 *
 * If a codec fails to load (offline first-run, unsupported engine), the caller
 * falls back to native `canvasToBlob` — see {@link encodeCanvas}.
 */

/** 0–1 effort → integer in [min, max]. Higher effort = more work = smaller file. */
function scaleEffort(effort: number, min: number, max: number): number {
  const clamped = Math.min(1, Math.max(0, effort))
  return Math.round(min + clamped * (max - min))
}

function toBlob(buffer: ArrayBuffer, type: OutputFormat): Blob {
  return new Blob([buffer], { type })
}

async function encodeWithCodec(
  data: ImageData,
  opts: EncodeOptions,
): Promise<Blob> {
  const quality = Math.round(opts.quality * 100)
  const effort = opts.effort ?? 0.6
  const lossless = opts.lossless ?? false
  const wants444 = opts.subsampling === '444'

  switch (opts.format) {
    case 'image/jpeg': {
      const { default: encode } = await import('@jsquash/jpeg/encode')
      // chroma_subsample: 1 = 4:4:4 (no subsampling), 2 = 4:2:0.
      const buffer = await encode(data, {
        quality,
        auto_subsample: false,
        chroma_subsample: wants444 ? 1 : 2,
        progressive: true,
        optimize_coding: true,
      })
      return toBlob(buffer, 'image/jpeg')
    }
    case 'image/webp': {
      const { default: encode } = await import('@jsquash/webp/encode')
      const buffer = await encode(data, {
        quality,
        lossless: lossless ? 1 : 0,
        method: scaleEffort(effort, 0, 6),
      })
      return toBlob(buffer, 'image/webp')
    }
    case 'image/avif': {
      const { default: encode } = await import('@jsquash/avif/encode')
      // subsample: 1 = 4:2:0, 3 = 4:4:4. speed: 0 slowest/best … 10 fastest.
      const buffer = await encode(data, {
        quality,
        lossless,
        subsample: wants444 ? 3 : 1,
        speed: scaleEffort(1 - effort, 0, 9),
      })
      return toBlob(buffer, 'image/avif')
    }
    case 'image/jxl': {
      const { default: encode } = await import('@jsquash/jxl/encode')
      const buffer = await encode(data, {
        quality,
        lossless,
        effort: scaleEffort(effort, 1, 9),
      })
      return toBlob(buffer, 'image/jxl')
    }
    case 'image/png': {
      // PNG is lossless: quality is ignored. Encode then run OxiPNG to squeeze.
      const [{ default: encodePng }, { default: optimise }] = await Promise.all(
        [import('@jsquash/png/encode'), import('@jsquash/oxipng/optimise')],
      )
      const raw = await encodePng(data)
      const buffer = await optimise(raw, { level: scaleEffort(effort, 1, 6) })
      return toBlob(buffer, 'image/png')
    }
  }
}

/** Decode an encoded blob back to pixels (for the auto-mode SSIM comparison). */
async function decodeBlob(
  blob: Blob,
  format: OutputFormat,
): Promise<ImageData> {
  const buffer = await blob.arrayBuffer()
  switch (format) {
    case 'image/jpeg':
      return (await import('@jsquash/jpeg/decode')).default(buffer)
    case 'image/webp':
      return (await import('@jsquash/webp/decode')).default(buffer)
    case 'image/avif': {
      const data = await (await import('@jsquash/avif/decode')).default(buffer)
      if (!data) throw new Error('AVIF decode returned no data.')
      return data
    }
    case 'image/jxl':
      return (await import('@jsquash/jxl/decode')).default(buffer)
    case 'image/png':
      return (await import('@jsquash/png/decode')).default(buffer)
  }
}

/** Bounds and iteration cap for the target-quality binary search. */
const AUTO_MIN_Q = 0.4
const AUTO_MAX_Q = 0.95
const AUTO_ITERATIONS = 6

/**
 * Find the smallest quality whose re-encode still scores at/above the target
 * SSIM, by binary-searching the quality range. Each probe encodes then decodes a
 * candidate and scores it against the source pixels. Returns the best passing
 * result (or the highest-quality probe if none clears the bar).
 */
async function autoEncode(
  source: ImageData,
  opts: EncodeOptions,
): Promise<{ blob: Blob; quality: number }> {
  const target = opts.auto!.targetSsim
  let lo = AUTO_MIN_Q
  let hi = AUTO_MAX_Q
  let best: { blob: Blob; quality: number } | null = null
  let fallback: { blob: Blob; quality: number } | null = null

  for (let i = 0; i < AUTO_ITERATIONS; i++) {
    const quality = (lo + hi) / 2
    const blob = await encodeWithCodec(source, { ...opts, quality })
    const score = ssim(source, await decodeBlob(blob, opts.format))
    fallback = { blob, quality }

    if (score >= target) {
      best = { blob, quality } // good enough — try to go smaller
      hi = quality
    } else {
      lo = quality // too degraded — need more quality
    }
  }

  // `fallback` is always set (loop runs ≥1×); prefer the best passing probe.
  return best ?? fallback!
}

/**
 * Encode a canvas to a Blob using the WASM codec for its format, falling back to
 * the native `canvasToBlob` encoder if the codec can't be loaded/run. Returns
 * the actual quality used (which differs from `opts.quality` in auto mode).
 * Reading `ImageData` back from the canvas is what the WASM codecs consume.
 */
export async function encodeCanvas(
  canvas: AnyCanvas,
  opts: EncodeOptions,
): Promise<{ blob: Blob; quality: number }> {
  try {
    const data = getImageData(canvas)
    const meta = formatMeta(opts.format)
    // Auto mode only applies to lossy encodes (lossless has fixed output).
    if (opts.auto && meta.lossy && !opts.lossless) {
      return await autoEncode(data, opts)
    }
    return { blob: await encodeWithCodec(data, opts), quality: opts.quality }
  } catch (err) {
    // WASM unavailable or codec threw — degrade to the browser encoder so the
    // pipeline still produces a file. Native path ignores effort/lossless.
    if (import.meta.env.DEV) {
      console.warn(`[encode] ${opts.format} codec failed, using canvas:`, err)
    }
    const blob = await canvasToBlob(canvas, opts.format, opts.quality)
    return { blob, quality: opts.quality }
  }
}

/**
 * Whether the WASM encode path is usable at all. WebAssembly is required; when
 * absent we fall back to native canvas encoding (which can't do AVIF/JXL).
 */
export function supportsWasmEncode(): boolean {
  return typeof WebAssembly !== 'undefined'
}
