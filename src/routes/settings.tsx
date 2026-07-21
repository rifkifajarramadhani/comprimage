import { createFileRoute } from '@tanstack/react-router'
import RotateCcw from 'lucide-react/dist/esm/icons/rotate-ccw'
import type { ThemePreference } from '#/lib/settings.ts'
import { maxConcurrency } from '#/lib/settings.ts'
import { useSettingsStore } from '#/stores/settings-store.ts'
import { Container } from '#/components/layout/Container.tsx'
import { PageIntro } from '#/components/layout/PageIntro.tsx'
import { FormatSelect } from '#/components/controls/FormatSelect.tsx'
import { Button } from '#/components/ui/button.tsx'
import { Slider } from '#/components/ui/slider.tsx'
import { Switch } from '#/components/ui/switch.tsx'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select.tsx'
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

const THEME_OPTIONS: Array<{ value: ThemePreference; label: string }> = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

function SettingSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="border-border border-b last:border-b-0">
      <h2 className="terminal-label border-border border-b px-4 py-3">
        [ {title} ]
      </h2>
      <div className="min-w-0">{children}</div>
    </section>
  )
}

function SettingRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="border-border flex min-h-14 flex-col gap-3 border-b px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-foreground text-sm">{label}</span>
      <div className="w-full sm:w-[min(520px,60%)]">{children}</div>
    </div>
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
    <Container className="py-7 sm:py-9">
      <PageIntro
        title="Settings"
        command="comprimage config"
        description="Choose how Comprimage behaves on this device."
        className="mb-6"
      />

      <div className="border-border overflow-hidden border">
        <SettingSection title="appearance">
          <SettingRow label="Theme">
            <Select
              value={theme}
              onValueChange={(value) => setTheme(value as ThemePreference)}
            >
              <SelectTrigger aria-label="Theme" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {THEME_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </SettingRow>
        </SettingSection>

        <SettingSection title="performance">
          <SettingRow label="Parallel workers">
            <div className="flex items-center gap-4">
              <output
                htmlFor="concurrency"
                className="mono text-muted-foreground w-16 shrink-0 text-xs"
              >
                {concurrency} of {maxWorkers}
              </output>
              <Slider
                id="concurrency"
                min={1}
                max={maxWorkers}
                step={1}
                value={[concurrency]}
                onValueChange={([v]) => setConcurrency(v)}
                aria-label="Parallel workers"
              />
              <span className="mono text-muted-foreground text-xs">
                {maxWorkers}
              </span>
            </div>
          </SettingRow>
        </SettingSection>

        <SettingSection title="new image defaults">
          <SettingRow label="Default output format">
            <FormatSelect
              value={defaultFormat}
              onChange={setDefaultFormat}
              hideLabel
              id="default-format"
            />
          </SettingRow>
          <SettingRow label="Quality">
            <div className="flex items-center gap-4">
              <Slider
                min={5}
                max={100}
                value={[Math.round(defaultQuality * 100)]}
                onValueChange={([value]) => setDefaultQuality(value / 100)}
                aria-label="Default quality"
              />
              <output className="mono text-muted-foreground w-12 text-right text-xs">
                {Math.round(defaultQuality * 100)}%
              </output>
            </div>
          </SettingRow>
          <SettingRow label="Prevent upscaling">
            <div className="flex justify-end">
              <Switch
                checked={preventUpscale}
                onCheckedChange={setPreventUpscale}
                aria-label="Prevent upscaling by default"
              />
            </div>
          </SettingRow>
        </SettingSection>
      </div>

      <div className="mt-4">
        <Button variant="ghost" onClick={reset}>
          <RotateCcw data-icon="inline-start" />
          Reset all preferences
        </Button>
      </div>
    </Container>
  )
}
