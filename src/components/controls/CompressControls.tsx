import type { EncodeOptions } from '#/types/image.ts'
import { Label } from '#/components/ui/label.tsx'
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
import { qualityPercent } from '#/lib/compress.ts'
import { formatMeta } from '#/lib/convert.ts'

const DEFAULT_EFFORT = 0.6
const DEFAULT_TARGET_SSIM = 0.97

export function CompressControls({
  value,
  onChange,
  showAdvanced = true,
}: {
  value: EncodeOptions
  onChange: (next: EncodeOptions) => void
  /** Hide effort/lossless/subsampling/auto (used by the Settings defaults panel). */
  showAdvanced?: boolean
}) {
  const meta = formatMeta(value.format)
  const lossless = value.lossless ?? false
  const effort = value.effort ?? DEFAULT_EFFORT
  const auto = value.auto

  // PNG has no quality knob; a lossless toggle also disables the quality slider.
  const qualityApplies = meta.lossy && !lossless
  // Auto (target-quality) mode is only meaningful for a lossy quality knob.
  const autoAvailable = showAdvanced && qualityApplies
  const patch = (next: Partial<EncodeOptions>) =>
    onChange({ ...value, ...next })

  return (
    <div className="grid gap-5">
      {autoAvailable && (
        <label className="flex min-h-11 items-center justify-between gap-4">
          <span className="text-sm font-semibold">
            Auto quality
            <span className="text-muted-foreground ml-1 font-normal">
              (target visual quality)
            </span>
          </span>
          <Switch
            checked={!!auto}
            onCheckedChange={(checked) =>
              patch({
                auto: checked
                  ? { targetSsim: auto?.targetSsim ?? DEFAULT_TARGET_SSIM }
                  : undefined,
              })
            }
          />
        </label>
      )}

      {autoAvailable && auto ? (
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="target-quality">Target quality</Label>
            <output
              htmlFor="target-quality"
              className="mono text-muted-foreground text-sm"
            >
              {Math.round(auto.targetSsim * 100)}
            </output>
          </div>
          <Slider
            id="target-quality"
            min={80}
            max={99}
            step={1}
            value={[Math.round(auto.targetSsim * 100)]}
            onValueChange={([v]) => patch({ auto: { targetSsim: v / 100 } })}
            aria-label="Target visual quality"
          />
          <p className="text-muted-foreground text-sm leading-6">
            We search for the smallest file that still looks this close to the
            original. The quality we settle on shows in the stats.
          </p>
        </div>
      ) : (
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="quality">Quality</Label>
            <output
              htmlFor="quality"
              className="mono text-muted-foreground text-sm"
            >
              {qualityApplies ? qualityPercent(value.quality) : 'lossless'}
            </output>
          </div>
          <Slider
            id="quality"
            min={5}
            max={100}
            step={1}
            value={[qualityPercent(value.quality)]}
            disabled={!qualityApplies}
            onValueChange={([v]) => patch({ quality: v / 100 })}
            aria-label="Output quality"
          />
          <p className="text-muted-foreground text-sm leading-6">
            {qualityApplies
              ? 'Lower quality means a smaller file.'
              : meta.lossy
                ? 'Lossless mode ignores quality — pixels are preserved exactly.'
                : `${meta.label} is lossless — quality has no effect.`}
          </p>
        </div>
      )}

      {showAdvanced && meta.canLossless && (
        <label className="flex min-h-11 items-center justify-between gap-4">
          <span className="text-sm font-semibold">Lossless</span>
          <Switch
            checked={lossless}
            onCheckedChange={(checked) => patch({ lossless: checked })}
            aria-label="Encode losslessly"
          />
        </label>
      )}

      {showAdvanced && qualityApplies && meta.hasSubsampling && (
        <div className="grid gap-2">
          <Label htmlFor="subsampling">Chroma subsampling</Label>
          <Select
            value={value.subsampling ?? '420'}
            onValueChange={(v) =>
              patch({ subsampling: v as EncodeOptions['subsampling'] })
            }
          >
            <SelectTrigger id="subsampling" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="420">
                  4:2:0 — smaller (recommended)
                </SelectItem>
                <SelectItem value="444">4:4:4 — full color detail</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <p className="text-muted-foreground text-sm leading-6">
            4:4:4 keeps sharp colored edges and text at a larger size.
          </p>
        </div>
      )}

      {showAdvanced && meta.format !== 'image/jpeg' && (
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="effort">Effort</Label>
            <output
              htmlFor="effort"
              className="mono text-muted-foreground text-sm"
            >
              {Math.round(effort * 100)}
            </output>
          </div>
          <Slider
            id="effort"
            min={0}
            max={100}
            step={5}
            value={[Math.round(effort * 100)]}
            onValueChange={([v]) => patch({ effort: v / 100 })}
            aria-label="Encoding effort"
          />
          <p className="text-muted-foreground text-sm leading-6">
            Higher effort spends more CPU for a smaller file at the same
            quality.
          </p>
        </div>
      )}
    </div>
  )
}
