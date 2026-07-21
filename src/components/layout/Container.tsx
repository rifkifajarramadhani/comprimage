import { cn } from '#/lib/utils.ts'

/** Shared responsive page wrap. */
export function Container({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'mx-auto w-full max-w-[1440px] px-5 sm:px-7 lg:px-10',
        className,
      )}
    >
      {children}
    </div>
  )
}
