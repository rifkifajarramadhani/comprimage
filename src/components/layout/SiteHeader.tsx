import { Link } from '@tanstack/react-router'
import { lazy, Suspense, useState } from 'react'
import Menu from 'lucide-react/dist/esm/icons/menu'
import { Container } from './Container.tsx'
import { ThemeSwitch } from './ThemeSwitch.tsx'
import { PRIMARY_NAV, SECONDARY_NAV } from './navigation.ts'
import { Button } from '#/components/ui/button.tsx'

// Keep the menu and its positioning code out of the initial page assets.
const MobileNavigation = lazy(() => import('./MobileNavigation.tsx'))

function NavLink({
  item,
}: {
  item: (typeof PRIMARY_NAV)[number] | (typeof SECONDARY_NAV)[number]
}) {
  return (
    <Link
      to={item.to}
      className="text-muted-foreground hover:text-foreground relative flex h-14 items-center px-3 text-sm font-medium outline-none transition-colors after:absolute after:right-3 after:bottom-0 after:left-3 after:h-px after:origin-left after:scale-x-0 after:bg-primary after:transition-transform focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
      activeProps={{
        className:
          'text-brand relative flex h-14 items-center px-3 text-sm font-semibold outline-none after:absolute after:right-3 after:bottom-0 after:left-3 after:h-[2px] after:scale-x-100 after:bg-primary',
      }}
    >
      {item.label}
    </Link>
  )
}

export function SiteHeader() {
  const [menuRequest, setMenuRequest] = useState<'pointer' | 'keyboard' | null>(
    null,
  )
  const menuTrigger = (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Open navigation menu"
      aria-haspopup="menu"
      aria-expanded={false}
      aria-busy={menuRequest !== null}
      onClick={(event) =>
        setMenuRequest(event.detail === 0 ? 'keyboard' : 'pointer')
      }
      onKeyDown={(event) => {
        if (event.key === 'ArrowDown') {
          event.preventDefault()
          setMenuRequest('keyboard')
        }
      }}
    >
      <Menu aria-hidden />
    </Button>
  )

  return (
    <header className="border-border bg-[var(--header-bg)] sticky top-0 z-20 h-14 border-b backdrop-blur-sm">
      <Container className="flex h-14 items-center gap-5">
        <Link
          to="/"
          className="text-foreground flex shrink-0 items-center rounded-sm text-base font-bold tracking-[-0.04em] outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          activeOptions={{ exact: true }}
        >
          [comprimage]
        </Link>

        <nav
          aria-label="Image tools"
          className="ml-3 hidden items-center lg:flex"
        >
          {PRIMARY_NAV.map((item) => (
            <NavLink key={item.to} item={item} />
          ))}
        </nav>

        <div className="ml-auto hidden items-center lg:flex">
          {SECONDARY_NAV.map((item) => (
            <NavLink key={item.to} item={item} />
          ))}
          <span className="bg-border mx-3 h-5 w-px" aria-hidden />
          <ThemeSwitch />
        </div>

        <div className="ml-auto flex items-center gap-2 lg:hidden">
          <ThemeSwitch />
          {menuRequest !== null ? (
            <Suspense fallback={menuTrigger}>
              <MobileNavigation focusFirstItem={menuRequest === 'keyboard'} />
            </Suspense>
          ) : (
            menuTrigger
          )}
        </div>
      </Container>
    </header>
  )
}
