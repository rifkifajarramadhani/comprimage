import { Container } from './Container.tsx'

/** footer — black canvas, hairline top divider, single caption row. */
export function SiteFooter() {
  return (
    <footer
      className="mt-24"
      style={{ borderTop: '1px solid var(--divider-soft)' }}
    >
      <Container className="flex flex-col items-center justify-between gap-3 py-10 text-sm sm:flex-row">
        <p className="text-ash">
          Comprimage — images never leave your device.
        </p>
        <p className="text-ash flex items-center gap-2">
          <span
            aria-hidden
            className="inline-block size-2 rounded-full"
            style={{ background: 'var(--accent-green)' }}
          />
          100% client-side
        </p>
      </Container>
    </footer>
  )
}
