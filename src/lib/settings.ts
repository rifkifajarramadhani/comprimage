import type { OutputFormat } from '#/types/image.ts'
import { DEFAULT_QUALITY } from '#/lib/compress.ts'

/** User-facing theme preference. `system` follows the OS setting. */
export type ThemePreference = 'system' | 'light' | 'dark'

/** Persisted application preferences (see stores/settings-store.ts). */
export interface AppSettings {
  theme: ThemePreference
  /** Number of Web Workers in the processing pool. */
  concurrency: number
  /** Default output format seeded into the tool controls. */
  defaultFormat: OutputFormat
  /** Default encode quality (0–1) seeded into the tool controls. */
  defaultQuality: number
  /** Default for the resize "prevent upscaling" toggle. */
  preventUpscale: boolean
}

/** Hard ceiling on the worker pool regardless of the machine's core count. */
export const MAX_CONCURRENCY = 8

/**
 * The device's suggested worker count: hardware concurrency clamped to
 * [1, MAX_CONCURRENCY]. Falls back to 4 when the API is unavailable (SSR/old).
 */
export function maxConcurrency(): number {
  const cores =
    typeof navigator !== 'undefined' && navigator.hardwareConcurrency
      ? navigator.hardwareConcurrency
      : 4
  return clampConcurrency(cores, MAX_CONCURRENCY)
}

/** Clamp a requested worker count to [1, max], coercing non-finite input. */
export function clampConcurrency(
  n: number,
  max: number = MAX_CONCURRENCY,
): number {
  if (!Number.isFinite(n)) return 1
  return Math.max(1, Math.min(Math.floor(n), Math.max(1, Math.floor(max))))
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  concurrency: maxConcurrency(),
  defaultFormat: 'image/webp',
  defaultQuality: DEFAULT_QUALITY,
  preventUpscale: true,
}
