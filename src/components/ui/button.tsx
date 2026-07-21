import * as React from 'react'
import { cva } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'
import { Slot } from '@radix-ui/react-slot'

import { cn } from '#/lib/utils.ts'

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-sm text-sm font-semibold whitespace-nowrap transition-[background-color,color,border-color,box-shadow] duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          'border border-primary bg-background text-brand hover:bg-brand-soft hover:text-brand-ink',
        destructive:
          'border border-destructive bg-background text-destructive hover:bg-danger-soft focus-visible:ring-destructive/30',
        outline:
          'border border-input bg-background text-foreground hover:border-[var(--line-strong)] hover:bg-secondary',
        secondary:
          'border border-transparent bg-secondary text-secondary-foreground hover:border-input hover:bg-[var(--surface-raised)]',
        ghost:
          'border border-transparent text-muted-foreground hover:border-input hover:bg-secondary hover:text-foreground',
        link: 'h-auto text-brand underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2 has-[>svg]:px-3.5',
        xs: "h-8 gap-1 rounded-sm px-2.5 text-xs has-[>svg]:px-2 [&_svg:not([class*='size-'])]:size-3",
        sm: 'h-9 gap-1.5 rounded-sm px-3 has-[>svg]:px-2.5',
        lg: 'h-11 rounded-sm px-5 has-[>svg]:px-4',
        icon: 'size-10',
        'icon-xs': "size-8 rounded-sm [&_svg:not([class*='size-'])]:size-3",
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
