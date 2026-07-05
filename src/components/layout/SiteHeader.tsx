import { Link } from '@tanstack/react-router'
import { Container } from './Container.tsx'

const NAV = [
  { to: '/', label: 'Home' },
  { to: '/resize', label: 'Resize' },
  { to: '/compress', label: 'Compress' },
  { to: '/convert', label: 'Convert' },
  { to: '/batch', label: 'Batch' },
] as const

/** nav-bar — 64px, wordmark left, centered nav links, hairline bottom border. */
export function SiteHeader() {
  return (
    <header
      className="sticky top-0 z-40 h-16 backdrop-blur-sm"
      style={{
        background: 'rgba(0,0,0,0.72)',
        borderBottom: '1px solid var(--hairline)',
      }}
    >
      <Container className="flex h-16 items-center justify-between">
        <Link to="/" className="text-ink text-lg font-semibold tracking-tight">
          Comprimage
        </Link>

        <nav className="flex items-center gap-7 text-sm">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="nav-link"
              activeProps={{ className: 'nav-link is-active' }}
              activeOptions={{ exact: item.to === '/' }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </Container>
    </header>
  )
}
