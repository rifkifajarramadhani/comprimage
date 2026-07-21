import LockKeyhole from 'lucide-react/dist/esm/icons/lock-keyhole'
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
        'text-success flex items-center gap-2 text-xs leading-5',
        className,
      )}
    >
      <LockKeyhole
        aria-hidden
        className={cn('text-success shrink-0', compact ? 'size-3.5' : 'size-4')}
      />
      {compact
        ? 'Processed on your device.'
        : 'Your images stay on this device from open to download.'}
    </p>
  )
}
