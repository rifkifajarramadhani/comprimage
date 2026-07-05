import { createFileRoute } from '@tanstack/react-router'
import { Monitor, Moon, RotateCcw, Sun } from 'lucide-react'
import type { ThemePreference } from '#/lib/settings.ts'
import { maxConcurrency } from '#/lib/settings.ts'
import { supportsQuality } from '#/lib/compress.ts'
import { useSettingsStore } from '#/stores/settingsStore.ts'
import { Container } from '#/components/layout/Container.tsx'
import { FormatSelect } from '#/components/controls/FormatSelect.tsx'
import { CompressControls } from '#/components/controls/CompressControls.tsx'
import { Button } from '#/components/ui/button.tsx'
import { Label } from '#/components/ui/label.tsx'
import { Slider } from '#/components/ui/slider.tsx'
import { Switch } from '#/components/ui/switch.tsx'

export const Route = createFileRoute('/settings')({ component: SettingsPage })

const THEME_OPTIONS: Array<{
  value: ThemePreference
  label: string
  icon: typeof Sun
}> = [
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
]

function Section({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="surface-card p-6 sm:p-8">
      <div className="mb-5 max-w-xl">
        <h2 className="text-ink text-lg font-medium">{title}</h2>
        <p className="text-ash mt-1 text-sm">{description}</p>
      </div>
      {children}
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
    <section className="atmos-glow">
      <Container className="py-12 sm:py-16">
        <header className="mb-10 max-w-2xl">
          <p className="kicker mb-3">Settings</p>
          <h1 className="display-title text-5xl sm:text-6xl">Preferences</h1>
          <p className="text-charcoal mt-4 text-lg">
            Everything here is stored only in this browser. No account, no sync,
            nothing leaves your device.
          </p>
        </header>

        <div className="grid max-w-3xl gap-6">
          <Section
            title="Appearance"
            description="Choose a theme, or follow your operating system."
          >
            <div className="flex flex-wrap gap-2">
              {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                <Button
                  key={value}
                  variant={theme === value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme(value)}
                >
                  <Icon />
                  {label}
                </Button>
              ))}
            </div>
          </Section>

          <Section
            title="Performance"
            description="How many images are processed in parallel. Higher is faster on big batches but uses more memory and CPU. Applies to both single-image and batch tools."
          >
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="concurrency">Parallel workers</Label>
                <span className="mono text-charcoal text-sm">
                  {concurrency} / {maxWorkers}
                </span>
              </div>
              <Slider
                id="concurrency"
                min={1}
                max={maxWorkers}
                step={1}
                value={[concurrency]}
                onValueChange={([v]) => setConcurrency(v)}
              />
              <p className="text-ash text-sm">
                Your device suggests up to {maxWorkers} based on its CPU cores.
              </p>
            </div>
          </Section>

          <Section
            title="Defaults"
            description="Seed new resize, compress, and convert sessions with these values."
          >
            <div className="grid gap-5">
              <FormatSelect
                value={defaultFormat}
                onChange={setDefaultFormat}
                label="Default output format"
              />
              <CompressControls
                quality={defaultQuality}
                onQualityChange={setDefaultQuality}
                disabled={!supportsQuality(defaultFormat)}
              />
              <label className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Prevent upscaling by default
                </span>
                <Switch
                  checked={preventUpscale}
                  onCheckedChange={setPreventUpscale}
                />
              </label>
            </div>
          </Section>

          <div>
            <Button variant="ghost" size="sm" onClick={reset}>
              <RotateCcw />
              Reset to defaults
            </Button>
          </div>
        </div>
      </Container>
    </section>
  )
}
