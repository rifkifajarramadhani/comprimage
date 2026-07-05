/** Shared types for the image-processing pipeline. */

export type OutputFormat = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif'

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
  /** 0–1 for lossy formats (jpeg/webp/avif). Ignored for png. */
  quality: number
}
