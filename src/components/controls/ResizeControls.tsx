import type { ResizeMode, ResizeOptions } from '#/types/image.ts'
import { Input } from '#/components/ui/input.tsx'
import { Label } from '#/components/ui/label.tsx'
import { Switch } from '#/components/ui/switch.tsx'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select.tsx'

const MODES: Array<{ value: ResizeMode; label: string; unit: string }> = [
  { value: 'width', label: 'Width', unit: 'px' },
  { value: 'height', label: 'Height', unit: 'px' },
  { value: 'longest-edge', label: 'Longest edge', unit: 'px' },
  { value: 'percentage', label: 'Percentage', unit: '%' },
]

export function ResizeControls({
  options,
  onChange,
}: {
  options: ResizeOptions
  onChange: (next: ResizeOptions) => void
}) {
  const mode = MODES.find((m) => m.value === options.mode) ?? MODES[0]
  const aspectLocked = options.mode === 'percentage' || options.mode === 'longest-edge'

  return (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <Label htmlFor="resize-mode">Resize by</Label>
        <Select
          value={options.mode}
          onValueChange={(v) => onChange({ ...options, mode: v as ResizeMode })}
        >
          <SelectTrigger id="resize-mode" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MODES.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="resize-value">
          {mode.label} ({mode.unit})
        </Label>
        <Input
          id="resize-value"
          type="number"
          min={1}
          value={options.value}
          onChange={(e) =>
            onChange({ ...options, value: Number(e.target.value) || 0 })
          }
        />
      </div>

      {(options.mode === 'width' || options.mode === 'height') && (
        <label className="flex items-center justify-between">
          <span className="text-sm font-medium">Keep aspect ratio</span>
          <Switch
            checked={options.keepAspectRatio}
            onCheckedChange={(checked) =>
              onChange({ ...options, keepAspectRatio: checked })
            }
          />
        </label>
      )}

      {!options.keepAspectRatio &&
        (options.mode === 'width' || options.mode === 'height') && (
          <div className="grid gap-2">
            <Label htmlFor="resize-secondary">
              {options.mode === 'width' ? 'Height' : 'Width'} (px)
            </Label>
            <Input
              id="resize-secondary"
              type="number"
              min={1}
              value={options.secondaryValue ?? ''}
              onChange={(e) =>
                onChange({
                  ...options,
                  secondaryValue: Number(e.target.value) || 0,
                })
              }
            />
          </div>
        )}

      {aspectLocked && (
        <p className="text-ash text-sm">Aspect ratio is preserved.</p>
      )}

      <label className="flex items-center justify-between">
        <span className="text-sm font-medium">Prevent upscaling</span>
        <Switch
          checked={options.preventUpscaling}
          onCheckedChange={(checked) =>
            onChange({ ...options, preventUpscaling: checked })
          }
        />
      </label>
    </div>
  )
}
