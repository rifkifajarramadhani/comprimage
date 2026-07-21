import { cn } from '#/lib/utils.ts'

export function PageIntro({
  title,
  description,
  command,
  className,
}: {
  title: string
  description: string
  command?: string
  className?: string
}) {
  return (
    <header className={cn('flex max-w-4xl flex-col gap-3', className)}>
      <h1 className={command ? 'command-title' : 'page-title'}>
        {command ? (
          <>
            <span className="command-prompt" aria-hidden>
              ${' '}
            </span>
            {command}
            <span className="command-caret" aria-hidden />
          </>
        ) : (
          title
        )}
      </h1>
      <p className="page-description">{description}</p>
    </header>
  )
}
