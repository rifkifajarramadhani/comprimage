import { useEffect } from 'react'
import { useSettingsStore } from '#/stores/settings-store.ts'
import { applyTheme, watchSystemTheme } from '#/lib/theme.ts'
import { imagePool } from '#/workers/image-pool.ts'

/**
 * Applies persisted settings once the store has rehydrated from localStorage:
 * paints the theme, sizes the worker pool, and keeps a `system` theme preference
 * in step with OS changes. Renders nothing.
 */
export function AppInit() {
  const theme = useSettingsStore((s) => s.theme)
  const concurrency = useSettingsStore((s) => s.concurrency)

  // Re-apply theme whenever the preference changes (and on first mount, in case
  // the inline no-FOUC script and the rehydrated store disagree).
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  // Follow the OS while the preference is `system`.
  useEffect(() => watchSystemTheme(theme, () => applyTheme(theme)), [theme])

  // Size the shared worker pool to the persisted concurrency.
  useEffect(() => {
    imagePool.setSize(concurrency)
  }, [concurrency])

  return null
}
