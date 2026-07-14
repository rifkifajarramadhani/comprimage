import { cn } from '#/lib/utils.ts'

export function PageIntro({
  title,
  description,
  className,
}: {
  title: string
  description: string
  className?: string
}) {
  return (
    <header className={cn('flex max-w-3xl flex-col gap-3', className)}>
      <h1 className="page-title">{title}</h1>
      <p className="page-description">{description}</p>
    </header>
  )
}
