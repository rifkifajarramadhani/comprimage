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
      {/* When a command is shown it is decoration only — the sr-only title is
          the heading's real text content, for screen readers and crawlers. */}
      <h1 className={command ? 'command-title' : 'page-title'}>
        {command ? (
          <>
            <span className="sr-only">{title}</span>
            <span aria-hidden>
              <span className="command-prompt">$ </span>
              {command}
              <span className="command-caret" />
            </span>
          </>
        ) : (
          title
        )}
      </h1>
      <p className="page-description">{description}</p>
    </header>
  )
}
