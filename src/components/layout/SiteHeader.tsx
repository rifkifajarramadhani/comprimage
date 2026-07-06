import { Link } from '@tanstack/react-router'
import { DropdownMenu } from 'radix-ui'
import { Menu } from 'lucide-react'
import { Container } from './Container.tsx'
import { InstallButton } from '#/components/pwa/InstallButton.tsx'
import { Button } from '#/components/ui/button.tsx'

const NAV = [
  { to: '/', label: 'Home' },
  { to: '/resize', label: 'Resize' },
  { to: '/compress', label: 'Compress' },
  { to: '/convert', label: 'Convert' },
  { to: '/batch', label: 'Batch' },
  { to: '/settings', label: 'Settings' },
] as const

/** nav-bar — 64px, wordmark left, centered nav links, hairline bottom border. */
export function SiteHeader() {
  return (
    <header
      className="sticky top-0 z-40 h-16 backdrop-blur-sm"
      style={{
        background: 'var(--header-bg)',
        borderBottom: '1px solid var(--hairline)',
      }}
    >
      <Container className="flex h-16 items-center justify-between">
        <Link to="/" className="text-ink text-lg font-semibold tracking-tight">
          Comprimage
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-7 md:flex">
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
          <InstallButton />
        </div>

        {/* Mobile nav */}
        <div className="flex items-center gap-2 md:hidden">
          <InstallButton />
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={8}
                className="z-50 flex min-w-40 flex-col gap-1 rounded-lg p-2 text-sm backdrop-blur-sm"
                style={{
                  background: 'var(--header-bg)',
                  border: '1px solid var(--hairline-strong)',
                }}
              >
                {NAV.map((item) => (
                  <DropdownMenu.Item key={item.to} asChild>
                    <Link
                      to={item.to}
                      className="nav-link nav-link-mobile rounded-md px-3 py-2 outline-none"
                      activeProps={{
                        className:
                          'nav-link nav-link-mobile is-active rounded-md px-3 py-2 outline-none',
                      }}
                      activeOptions={{ exact: item.to === '/' }}
                    >
                      {item.label}
                    </Link>
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </Container>
    </header>
  )
}
