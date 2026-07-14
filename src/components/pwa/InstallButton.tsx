import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '#/components/ui/button.tsx'

/** The non-standard beforeinstallprompt event (not in lib.dom yet). */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * Captures the browser's install prompt and renders an "Install" button only
 * when the app is installable and not already running standalone. Nothing shows
 * on browsers that don't fire the event (iOS Safari, already-installed).
 */
export function InstallButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  )

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => setDeferred(null)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (!deferred) return null

  const install = async () => {
    await deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
  }

  return (
    <Button variant="outline" size="sm" onClick={install}>
      <Download data-icon="inline-start" />
      Install
    </Button>
  )
}
