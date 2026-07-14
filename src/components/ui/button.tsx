import * as React from 'react'
import { cva } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'
import { Slot } from '@radix-ui/react-slot'

import { cn } from '#/lib/utils.ts'

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-semibold whitespace-nowrap transition-[background-color,color,border-color,box-shadow,transform] duration-200 ease-out outline-none focus-visible:ring-[3px] focus-visible:ring-ring/35 disabled:pointer-events-none disabled:opacity-45 active:translate-y-px [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-[var(--control-shadow)] hover:bg-[var(--brand-hover)]',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive/30',
        outline:
          'border border-input bg-background text-foreground shadow-[var(--control-shadow)] hover:border-[var(--line-strong)] hover:bg-secondary',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-[var(--surface-raised)]',
        ghost: 'text-muted-foreground hover:bg-secondary hover:text-foreground',
        link: 'text-brand underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2 has-[>svg]:px-3.5',
        xs: "h-8 gap-1 rounded-md px-2.5 text-xs has-[>svg]:px-2 [&_svg:not([class*='size-'])]:size-3",
        sm: 'h-9 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5',
        lg: 'h-11 rounded-md px-5 has-[>svg]:px-4',
        icon: 'size-10',
        'icon-xs': "size-8 rounded-md [&_svg:not([class*='size-'])]:size-3",
        'icon-sm': 'size-9',
        'icon-lg': 'size-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
