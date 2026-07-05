import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppSettings, ThemePreference } from '#/lib/settings.ts'
import type { OutputFormat } from '#/types/image.ts'
import {
  DEFAULT_SETTINGS,
  clampConcurrency,
  maxConcurrency,
} from '#/lib/settings.ts'
import { applyTheme, cacheThemePreference } from '#/lib/theme.ts'
import { imagePool } from '#/workers/imagePool.ts'

/**
 * Persisted user preferences: theme, worker concurrency, and the defaults that
 * seed the tool controls. Mutations also drive their side effects — theme
 * changes re-paint the document, concurrency changes resize the shared worker
 * pool — so both the single-tool and batch flows stay in sync automatically.
 *
 * Follows the selector-per-field consumption style of stores/imageStore.ts.
 */
interface SettingsStore extends AppSettings {
  setTheme: (theme: ThemePreference) => void
  setConcurrency: (concurrency: number) => void
  setDefaultFormat: (format: OutputFormat) => void
  setDefaultQuality: (quality: number) => void
  setPreventUpscale: (preventUpscale: boolean) => void
  reset: () => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      setTheme: (theme) => {
        applyTheme(theme)
        cacheThemePreference(theme)
        set({ theme })
      },
      setConcurrency: (concurrency) => {
        const clamped = clampConcurrency(concurrency, maxConcurrency())
        imagePool.setSize(clamped)
        set({ concurrency: clamped })
      },
      setDefaultFormat: (defaultFormat) => set({ defaultFormat }),
      setDefaultQuality: (defaultQuality) => set({ defaultQuality }),
      setPreventUpscale: (preventUpscale) => set({ preventUpscale }),
      reset: () => {
        applyTheme(DEFAULT_SETTINGS.theme)
        cacheThemePreference(DEFAULT_SETTINGS.theme)
        imagePool.setSize(DEFAULT_SETTINGS.concurrency)
        set({ ...DEFAULT_SETTINGS })
      },
    }),
    {
      name: 'comprimage-settings',
      // Only persist the data, not the action functions.
      partialize: (s) => ({
        theme: s.theme,
        concurrency: s.concurrency,
        defaultFormat: s.defaultFormat,
        defaultQuality: s.defaultQuality,
        preventUpscale: s.preventUpscale,
      }),
    },
  ),
)
