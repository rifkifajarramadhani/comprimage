import { useEffect, useRef, useState } from 'react'
import Monitor from 'lucide-react/dist/esm/icons/monitor'
import Moon from 'lucide-react/dist/esm/icons/moon'
import Sun from 'lucide-react/dist/esm/icons/sun'
import type { ThemePreference } from '#/lib/settings.ts'
import { DEFAULT_SETTINGS } from '#/lib/settings.ts'
import { useSettingsStore } from '#/stores/settings-store.ts'
import { cn } from '#/lib/utils.ts'

const OPTIONS: Array<{
  value: ThemePreference
  label: string
  icon: typeof Monitor
}> = [
  { value: 'system', label: 'System theme', icon: Monitor },
  { value: 'light', label: 'Light theme', icon: Sun },
  { value: 'dark', label: 'Dark theme', icon: Moon },
]

/**
 * Header control for the theme preference: a three-segment radiogroup for
 * system / light / dark.
 *
 * The active segment is painted by CSS keyed on the `data-theme-pref` attribute
 * that the no-FOUC script in __root.tsx sets before first paint (see
 * `.theme-switch` in styles.css) — every route is prerendered, so a
 * React-rendered active state would flash the build-time default until
 * hydration. React drives only selection and ARIA here.
 */
export function ThemeSwitch({ className }: { className?: string }) {
  const theme = useSettingsStore((s) => s.theme)
  const setTheme = useSettingsStore((s) => s.setTheme)
  const refs = useRef<Array<HTMLButtonElement | null>>([])

  // The persisted store rehydrates synchronously, so reading it during the
  // first client render would disagree with the prerendered HTML. Report the
  // build-time default until mounted, then sync — an attribute swap only, with
  // no visual consequence since CSS already has the active segment right.
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => setHydrated(true), [])
  const selected = hydrated ? theme : DEFAULT_SETTINGS.theme

  // Roving focus: arrows move between segments and select, per the radiogroup
  // pattern; only the selected segment is in the tab order.
  function onKeyDown(event: React.KeyboardEvent, index: number) {
    const step =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? -1
          : 0
    if (step === 0) return
    event.preventDefault()
    const next = (index + step + OPTIONS.length) % OPTIONS.length
    setTheme(OPTIONS[next].value)
    refs.current[next]?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className={cn('theme-switch', className)}
    >
      {OPTIONS.map(({ value, label, icon: Icon }, index) => (
        <button
          key={value}
          ref={(node) => {
            refs.current[index] = node
          }}
          type="button"
          role="radio"
          data-pref={value}
          aria-checked={selected === value}
          tabIndex={selected === value ? 0 : -1}
          onClick={() => setTheme(value)}
          onKeyDown={(event) => onKeyDown(event, index)}
        >
          <Icon className="size-4" aria-hidden />
          <span className="sr-only">{label}</span>
        </button>
      ))}
    </div>
  )
}
