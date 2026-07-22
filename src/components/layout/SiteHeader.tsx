import { Link } from '@tanstack/react-router'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import FileDown from 'lucide-react/dist/esm/icons/file-down'
import Info from 'lucide-react/dist/esm/icons/info'
import Layers3 from 'lucide-react/dist/esm/icons/layers-3'
import Maximize2 from 'lucide-react/dist/esm/icons/maximize-2'
import Menu from 'lucide-react/dist/esm/icons/menu'
import Repeat2 from 'lucide-react/dist/esm/icons/repeat-2'
import Settings from 'lucide-react/dist/esm/icons/settings'
import { Container } from './Container.tsx'
import { ThemeSwitch } from './ThemeSwitch.tsx'
import { Button } from '#/components/ui/button.tsx'

const PRIMARY_NAV = [
  { to: '/resize', label: 'Resize', icon: Maximize2 },
  { to: '/compress', label: 'Compress', icon: FileDown },
  { to: '/convert', label: 'Convert', icon: Repeat2 },
  { to: '/batch', label: 'Batch', icon: Layers3 },
] as const

const SECONDARY_NAV = [
  { to: '/about', label: 'About', icon: Info },
  { to: '/settings', label: 'Settings', icon: Settings },
] as const

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
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open navigation menu"
              >
                <Menu aria-hidden />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={8}
                className="border-border bg-popover text-popover-foreground z-40 min-w-56 rounded-sm border p-1 shadow-[var(--overlay-shadow)] data-[state=open]:animate-in data-[state=open]:fade-in-0"
              >
                <DropdownMenu.Group>
                  <DropdownMenu.Label className="terminal-label px-3 py-2">
                    [ tools ]
                  </DropdownMenu.Label>
                  {PRIMARY_NAV.map(({ to, label, icon: Icon }) => (
                    <DropdownMenu.Item key={to} asChild>
                      <Link
                        to={to}
                        className="text-muted-foreground focus:bg-secondary focus:text-foreground flex h-11 items-center gap-3 rounded-sm px-3 text-sm outline-none"
                        activeProps={{
                          className:
                            'bg-brand-soft text-brand-ink flex h-11 items-center gap-3 rounded-sm px-3 text-sm font-semibold outline-none',
                        }}
                      >
                        <Icon className="size-4" aria-hidden />
                        {label}
                      </Link>
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Group>
                <DropdownMenu.Separator className="bg-border my-2 h-px" />
                <DropdownMenu.Group>
                  {SECONDARY_NAV.map(({ to, label, icon: Icon }) => (
                    <DropdownMenu.Item key={to} asChild>
                      <Link
                        to={to}
                        className="text-muted-foreground focus:bg-secondary focus:text-foreground flex h-11 items-center gap-3 rounded-sm px-3 text-sm outline-none"
                        activeProps={{
                          className:
                            'bg-brand-soft text-brand-ink flex h-11 items-center gap-3 rounded-sm px-3 text-sm font-semibold outline-none',
                        }}
                      >
                        <Icon className="size-4" aria-hidden />
                        {label}
                      </Link>
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Group>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </Container>
    </header>
  )
}
