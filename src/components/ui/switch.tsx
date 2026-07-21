import * as React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'

import { cn } from '#/lib/utils.ts'

function Switch({
  className,
  size = 'default',
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: 'sm' | 'default'
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        'peer group/switch inline-flex shrink-0 items-center rounded-sm border border-input transition-[background-color,box-shadow,border-color] outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-6 data-[size=default]:w-11 data-[size=sm]:h-5 data-[size=sm]:w-9 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=unchecked]:bg-secondary',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          'pointer-events-none block rounded-[1px] bg-background ring-0 transition-transform group-data-[size=default]/switch:size-5 group-data-[size=sm]/switch:size-4 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0 data-[state=checked]:bg-primary-foreground data-[state=unchecked]:bg-background',
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
