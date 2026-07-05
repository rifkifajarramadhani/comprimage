import { cn } from '#/lib/utils.ts'

/** Max-width page wrap (~1200px) per DESIGN.md body sections. */
export function Container({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('mx-auto w-full max-w-[1200px] px-6', className)}>
      {children}
    </div>
  )
}
