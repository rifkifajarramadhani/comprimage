import { Link } from '@tanstack/react-router'
import { useRef } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import Menu from 'lucide-react/dist/esm/icons/menu'
import { PRIMARY_NAV, SECONDARY_NAV } from './navigation.ts'
import { Button } from '#/components/ui/button.tsx'

export default function MobileNavigation({
  focusFirstItem,
}: {
  focusFirstItem: boolean
}) {
  // The first keypress happens before Radix mounts. Preserve its focus intent;
  // subsequent openings use Radix's normal keyboard and pointer handling.
  const focusFirstItemRef = useRef(focusFirstItem)
  return (
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Trigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open navigation menu">
          <Menu aria-hidden />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          onFocus={(event) => {
            if (
              event.target !== event.currentTarget ||
              !focusFirstItemRef.current
            )
              return
            focusFirstItemRef.current = false
            event.currentTarget
              .querySelector<HTMLElement>('[role="menuitem"]')
              ?.focus()
          }}
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
  )
}
