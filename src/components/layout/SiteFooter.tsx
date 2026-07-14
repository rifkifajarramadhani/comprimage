import { Link } from '@tanstack/react-router'
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check'
import { Container } from './Container.tsx'

export function SiteFooter() {
  return (
    <footer className="border-border mt-20 border-t">
      <Container className="flex flex-col gap-5 py-8 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground flex items-center gap-2">
          <ShieldCheck className="text-success size-4" aria-hidden />
          Private, local image processing.
        </p>
        <nav aria-label="Footer" className="flex items-center gap-5">
          <Link
            to="/about"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            About
          </Link>
          <Link
            to="/settings"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Settings
          </Link>
        </nav>
      </Container>
    </footer>
  )
}
