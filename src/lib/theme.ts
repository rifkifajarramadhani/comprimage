import type { ThemePreference } from '#/lib/settings.ts'

/** localStorage key mirrored by the no-FOUC inline script in __root.tsx. */
export const THEME_STORAGE_KEY = 'comprimage-theme'

/**
 * Attribute on <html> carrying the raw preference (not the resolved register).
 * Set by the no-FOUC script before paint and kept current by `applyTheme`, so
 * the header theme switch can mark its active segment in CSS — correct on the
 * first frame, before React hydrates. Also mirrored in styles.css.
 */
export const THEME_PREF_ATTR = 'data-theme-pref'

export type ResolvedTheme = 'light' | 'dark'

/** theme-color meta content per register (matches styles.css canvas). */
const THEME_COLOR: Record<ResolvedTheme, string> = {
  dark: '#171514',
  light: '#fdfcfc',
}

/**
 * Mirror the theme preference into a standalone localStorage key that the
 * blocking inline script in __root.tsx reads before paint (the zustand store
 * persists under a different key with a nested JSON shape). Safe on the server.
 */
export function cacheThemePreference(pref: ThemePreference): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(THEME_STORAGE_KEY, pref)
  } catch {
    // Storage can throw in private mode / when disabled — theme just won't persist.
  }
}

function prefersDark(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )
}

/** Resolve a preference to a concrete register, following the OS for `system`. */
export function resolveTheme(pref: ThemePreference): ResolvedTheme {
  if (pref === 'system') return prefersDark() ? 'dark' : 'light'
  return pref
}

/**
 * Apply a theme preference to the document: sets the `light`/`dark` class on
 * <html> (shadcn's `dark:` variants key off `.dark`), records the preference
 * itself in `data-theme-pref`, and syncs the theme-color meta tag. Safe to call
 * on the server (no-ops without `document`).
 */
export function applyTheme(pref: ThemePreference): ResolvedTheme {
  const resolved = resolveTheme(pref)
  if (typeof document === 'undefined') return resolved

  const root = document.documentElement
  root.classList.remove('light', 'dark')
  root.classList.add(resolved)
  root.setAttribute(THEME_PREF_ATTR, pref)

  // The document ships two media-scoped theme-color tags so the static HTML is
  // correct before any script runs. Once we know the resolved register, collapse
  // them: drop `media` so the explicit value applies regardless of OS setting.
  for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
    meta.removeAttribute('media')
    meta.setAttribute('content', THEME_COLOR[resolved])
  }

  return resolved
}

/**
 * Keep a `system` preference in sync with OS changes. Returns an unsubscribe
 * function. No-op (returns a noop) when the preference is not `system`.
 */
export function watchSystemTheme(
  pref: ThemePreference,
  onChange: (resolved: ResolvedTheme) => void,
): () => void {
  if (
    pref !== 'system' ||
    typeof window === 'undefined' ||
    typeof window.matchMedia !== 'function'
  ) {
    return () => {}
  }
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const handler = () => onChange(mq.matches ? 'dark' : 'light')
  mq.addEventListener('change', handler)
  return () => mq.removeEventListener('change', handler)
}
