import { Label } from '#/components/ui/label.tsx'
import { Slider } from '#/components/ui/slider.tsx'
import { qualityPercent } from '#/lib/compress.ts'

export function CompressControls({
  quality,
  onQualityChange,
  disabled,
}: {
  quality: number
  onQualityChange: (quality: number) => void
  disabled?: boolean
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="quality">Quality</Label>
        <span className="mono text-charcoal text-sm">
          {disabled ? 'lossless' : `${qualityPercent(quality)}`}
        </span>
      </div>
      <Slider
        id="quality"
        min={5}
        max={100}
        step={1}
        value={[qualityPercent(quality)]}
        disabled={disabled}
        onValueChange={([v]) => onQualityChange(v / 100)}
      />
      <p className="text-ash text-sm">
        {disabled
          ? 'PNG is lossless — quality has no effect.'
          : 'Lower quality means a smaller file.'}
      </p>
    </div>
  )
}
