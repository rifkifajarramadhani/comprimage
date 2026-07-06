/** Shared types for the image-processing pipeline. */

export type OutputFormat =
  'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif' | 'image/jxl'

/** Chroma subsampling for lossy formats: '444' = full color, '420' = half. */
export type ChromaSubsampling = '444' | '420'

/** A source image the user has added, with its decoded intrinsic dimensions. */
export interface SourceImage {
  /** Stable id for React keys / queue tracking. */
  id: string
  file: File
  /** Object URL for previewing the original (revoke when discarded). */
  url: string
  width: number
  height: number
  /** Original file size in bytes. */
  size: number
  /** Original MIME type, e.g. "image/jpeg". */
  type: string
}

/** The result of processing a SourceImage. */
export interface ProcessResult {
  blob: Blob
  url: string
  width: number
  height: number
  /** Output size in bytes. */
  size: number
  format: OutputFormat
  /** Quality (0–1) auto mode settled on, if it was used. */
  chosenQuality?: number
}

/** How the resize target is expressed. */
export type ResizeMode = 'width' | 'height' | 'percentage' | 'longest-edge'

export interface ResizeOptions {
  mode: ResizeMode
  /** Target value: px for width/height/longest-edge, percent (1–100+) for percentage. */
  value: number
  /** Keep the source aspect ratio (ignored for percentage/longest-edge, which always do). */
  keepAspectRatio: boolean
  /** For mode 'width' or 'height' with keepAspectRatio off, the other dimension. */
  secondaryValue?: number
  /** Never scale above the source's intrinsic size. */
  preventUpscaling: boolean
}

export interface EncodeOptions {
  format: OutputFormat
  /** 0–1 for lossy formats (jpeg/webp/avif/jxl). Ignored for png. */
  quality: number
  /** Encode losslessly (webp/avif/jxl). PNG is always lossless. */
  lossless?: boolean
  /** 0–1 encode effort: higher trades CPU for a smaller file. Codec-mapped. */
  effort?: number
  /** Chroma subsampling for lossy formats (jpeg/avif). Defaults to '420'. */
  subsampling?: ChromaSubsampling
  /**
   * When set, ignore `quality` and instead search for the smallest quality
   * whose output stays above this perceptual score (0–1 SSIM). See process.ts.
   */
  auto?: { targetSsim: number }
}
