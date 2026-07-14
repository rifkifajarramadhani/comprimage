import { Link } from '@tanstack/react-router'
import { DropdownMenu } from 'radix-ui'
import {
  FileDown,
  Info,
  Layers3,
  Maximize2,
  Menu,
  Repeat2,
  Settings,
} from 'lucide-react'
import { Container } from './Container.tsx'
import { InstallButton } from '#/components/pwa/InstallButton.tsx'
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
  const Icon = item.icon
  return (
    <Link
      to={item.to}
      className="text-muted-foreground hover:bg-secondary hover:text-foreground flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors"
      activeProps={{
        className:
          'bg-brand-soft text-brand-ink flex h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold',
      }}
    >
      <Icon className="size-4" aria-hidden />
      {item.label}
    </Link>
  )
}

export function SiteHeader() {
  return (
    <header className="border-border bg-[var(--header-bg)] sticky top-0 z-20 h-16 border-b backdrop-blur-md">
      <Container className="flex h-16 max-w-[1440px] items-center gap-4">
        <Link
          to="/"
          className="text-foreground focus-visible:ring-ring flex shrink-0 items-center gap-2 rounded-md text-lg font-bold tracking-tight outline-none focus-visible:ring-[3px]"
          activeOptions={{ exact: true }}
        >
          <img
            src="/comprimage-mark.svg"
            alt=""
            width="36"
            height="36"
            className="size-9 shrink-0"
            aria-hidden="true"
          />
          Comprimage
        </Link>

        <nav
          aria-label="Image tools"
          className="ml-4 hidden items-center gap-1 lg:flex"
        >
          {PRIMARY_NAV.map((item) => (
            <NavLink key={item.to} item={item} />
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-1 lg:flex">
          {SECONDARY_NAV.map((item) => (
            <NavLink key={item.to} item={item} />
          ))}
          <InstallButton />
        </div>

        <div className="ml-auto flex items-center gap-2 lg:hidden">
          <InstallButton />
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
                className="border-border bg-popover text-popover-foreground z-40 min-w-56 rounded-xl border p-2 shadow-[var(--overlay-shadow)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
              >
                <DropdownMenu.Group>
                  <DropdownMenu.Label className="text-muted-foreground px-3 py-2 text-xs font-semibold">
                    Image tools
                  </DropdownMenu.Label>
                  {PRIMARY_NAV.map(({ to, label, icon: Icon }) => (
                    <DropdownMenu.Item key={to} asChild>
                      <Link
                        to={to}
                        className="text-muted-foreground focus:bg-secondary focus:text-foreground flex h-11 items-center gap-3 rounded-md px-3 text-sm outline-none"
                        activeProps={{
                          className:
                            'bg-brand-soft text-brand-ink flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold outline-none',
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
                        className="text-muted-foreground focus:bg-secondary focus:text-foreground flex h-11 items-center gap-3 rounded-md px-3 text-sm outline-none"
                        activeProps={{
                          className:
                            'bg-brand-soft text-brand-ink flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold outline-none',
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
