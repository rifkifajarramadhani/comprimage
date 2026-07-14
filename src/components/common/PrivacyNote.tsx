import { LockKeyhole } from 'lucide-react'
import { cn } from '#/lib/utils.ts'

export function PrivacyNote({
  compact = false,
  className,
}: {
  compact?: boolean
  className?: string
}) {
  return (
    <p
      className={cn(
        'text-muted-foreground flex items-center gap-2 text-sm',
        className,
      )}
    >
      <LockKeyhole
        aria-hidden
        className={cn('text-success shrink-0', compact ? 'size-3.5' : 'size-4')}
      />
      {compact
        ? 'Processed locally. Nothing is uploaded.'
        : 'Your images stay on this device from open to download.'}
    </p>
  )
}
