import { createFileRoute } from '@tanstack/react-router'
import Check from 'lucide-react/dist/esm/icons/check'
import Monitor from 'lucide-react/dist/esm/icons/monitor'
import Moon from 'lucide-react/dist/esm/icons/moon'
import RotateCcw from 'lucide-react/dist/esm/icons/rotate-ccw'
import Sun from 'lucide-react/dist/esm/icons/sun'
import type { ThemePreference } from '#/lib/settings.ts'
import { maxConcurrency } from '#/lib/settings.ts'
import { useSettingsStore } from '#/stores/settings-store.ts'
import { Container } from '#/components/layout/Container.tsx'
import { PageIntro } from '#/components/layout/PageIntro.tsx'
import { FormatSelect } from '#/components/controls/FormatSelect.tsx'
import { CompressControls } from '#/components/controls/CompressControls.tsx'
import { Button } from '#/components/ui/button.tsx'
import { Label } from '#/components/ui/label.tsx'
import { Slider } from '#/components/ui/slider.tsx'
import { Switch } from '#/components/ui/switch.tsx'
import { cn } from '#/lib/utils.ts'
import { createSeoHead } from '#/lib/seo.ts'

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
  head: () =>
    createSeoHead({
      path: '/settings',
      title: 'Settings | Comprimage',
      description:
        'Manage Comprimage’s theme, processing concurrency, output format, quality, and resize defaults on this device.',
      noIndex: true,
    }),
})

const THEME_OPTIONS: Array<{
  value: ThemePreference
  label: string
  description: string
  icon: typeof Sun
}> = [
  {
    value: 'system',
    label: 'System',
    description: 'Follow this device',
    icon: Monitor,
  },
  { value: 'light', label: 'Light', description: 'Always light', icon: Sun },
  { value: 'dark', label: 'Dark', description: 'Always dark', icon: Moon },
]

function SettingSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="border-border grid gap-6 border-b px-5 py-7 last:border-b-0 sm:px-7 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
      <div>
        <h2 className="text-foreground font-semibold">{title}</h2>
        <p className="text-muted-foreground mt-2 text-sm leading-6">
          {description}
        </p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  )
}

function SettingsPage() {
  const theme = useSettingsStore((s) => s.theme)
  const setTheme = useSettingsStore((s) => s.setTheme)
  const concurrency = useSettingsStore((s) => s.concurrency)
  const setConcurrency = useSettingsStore((s) => s.setConcurrency)
  const defaultFormat = useSettingsStore((s) => s.defaultFormat)
  const setDefaultFormat = useSettingsStore((s) => s.setDefaultFormat)
  const defaultQuality = useSettingsStore((s) => s.defaultQuality)
  const setDefaultQuality = useSettingsStore((s) => s.setDefaultQuality)
  const preventUpscale = useSettingsStore((s) => s.preventUpscale)
  const setPreventUpscale = useSettingsStore((s) => s.setPreventUpscale)
  const reset = useSettingsStore((s) => s.reset)

  const maxWorkers = maxConcurrency()

  return (
    <Container className="py-10 sm:py-12">
      <PageIntro
        title="Preferences"
        description="These settings live only in this browser. There is no account or cloud sync."
        className="mb-8"
      />

      <div className="surface-subtle max-w-4xl overflow-hidden">
        <SettingSection
          title="Appearance"
          description="Choose a theme or let Comprimage follow your operating system."
        >
          <div
            role="radiogroup"
            aria-label="Theme"
            className="grid gap-2 sm:grid-cols-3"
          >
            {THEME_OPTIONS.map(({ value, label, description, icon: Icon }) => {
              const selected = theme === value
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setTheme(value)}
                  className={cn(
                    'relative flex min-h-16 items-center gap-3 rounded-lg border px-4 text-left transition-[background-color,border-color] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30',
                    selected
                      ? 'border-primary bg-brand-soft text-brand-ink'
                      : 'border-input bg-background text-foreground hover:border-[var(--line-strong)] hover:bg-secondary',
                  )}
                >
                  <Icon className="size-5 shrink-0" aria-hidden />
                  <span>
                    <span className="block text-sm font-semibold">{label}</span>
                    <span className="text-muted-foreground mt-0.5 block text-xs">
                      {description}
                    </span>
                  </span>
                  {selected && (
                    <Check
                      className="text-brand absolute top-2 right-2 size-4"
                      aria-hidden
                    />
                  )}
                </button>
              )
            })}
          </div>
        </SettingSection>

        <SettingSection
          title="Performance"
          description="Control how many images can be processed at once."
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="concurrency">Parallel workers</Label>
              <output
                htmlFor="concurrency"
                className="mono text-muted-foreground text-sm"
              >
                {concurrency} of {maxWorkers}
              </output>
            </div>
            <Slider
              id="concurrency"
              min={1}
              max={maxWorkers}
              step={1}
              value={[concurrency]}
              onValueChange={([v]) => setConcurrency(v)}
              aria-label="Parallel workers"
            />
            <p className="text-muted-foreground text-sm leading-6">
              Higher values finish large batches faster but use more memory and
              CPU. This device supports up to {maxWorkers} workers.
            </p>
          </div>
        </SettingSection>

        <SettingSection
          title="New image defaults"
          description="Use these values whenever you begin a resize, compress, or convert session."
        >
          <div className="flex max-w-lg flex-col gap-6">
            <FormatSelect
              value={defaultFormat}
              onChange={setDefaultFormat}
              label="Default output format"
            />
            <CompressControls
              value={{ format: defaultFormat, quality: defaultQuality }}
              onChange={(next) => setDefaultQuality(next.quality)}
              showAdvanced={false}
            />
            <label className="flex min-h-11 items-center justify-between gap-4">
              <span>
                <span className="text-foreground block text-sm font-semibold">
                  Prevent upscaling
                </span>
                <span className="text-muted-foreground mt-1 block text-xs">
                  Do not enlarge images beyond their original dimensions.
                </span>
              </span>
              <Switch
                checked={preventUpscale}
                onCheckedChange={setPreventUpscale}
                aria-label="Prevent upscaling by default"
              />
            </label>
          </div>
        </SettingSection>
      </div>

      <div className="mt-5 max-w-4xl">
        <Button variant="ghost" onClick={reset}>
          <RotateCcw data-icon="inline-start" />
          Reset all preferences
        </Button>
      </div>
    </Container>
  )
}
