# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Uses **Bun** (not npm/pnpm — the `.cursorrules` `pnpm dlx shadcn` note is outdated; use `bunx shadcn@latest add <component>`).

```bash
bun install
bun run dev              # dev server on http://localhost:3000
bun run build            # vite build + generate-sw.mjs (emits sw.js)
bun run test             # vitest run (all tests, once)
bun run lint             # eslint
bun run format           # prettier --write . && eslint --fix
bun run check            # prettier --check (CI format gate)
bun run generate-routes  # tsr generate — regenerate routeTree.gen.ts
```

Run a single test: `bunx vitest run src/lib/resize.test.ts` (or `bunx vitest -t "name"`). Tests are `*.test.ts` colocated in `src/lib`, run under jsdom.

## Architecture

100% client-side static SPA — no backend, no database. Images never leave the browser.

**Processing pipeline** (`src/lib/process.ts`): `decode → (optional resize) → encode → Blob`. The key constraint driving the design: **object URLs are always minted on the main thread**, never inside a worker (blob URLs created in a worker are not reliably usable from the document). So `processToBlob` returns a raw `Blob` and the caller (`imagePool` or the main-thread fallback) creates the URL.

**Worker pool** (`src/workers/image-pool.ts`): a single lazily-created `ImagePool` singleton runs the pipeline off the main thread, shared by both the single-image hook and the batch queue. Requests are correlated by incrementing id and queued when workers are busy. `setSize` supports live resizing (from settings) — it terminates idle workers immediately and retires busy ones on task completion. Falls back to main-thread `processImage` when `Worker`/`OffscreenCanvas` are unavailable.

**Data flow**: `Dropzone → imageStore (Zustand) → ToolWorkspace → useImageProcessor → imagePool → Worker → BeforeAfter/Stats → Download`.

- `imageStore` holds one shared `SourceImage` so the home dropzone hands off to a tool without a re-drop and it survives switching tools. **The store owns the source object-URL lifecycle** — replacing/clearing releases it via `releaseSourceImage`.
- `ToolWorkspace` is the shared shell for resize/compress/convert. Each route builds its own `ProcessOptions` from its controls and passes them in; the workspace owns the source + processing.
- `useImageProcessor` debounces (150ms) so slider drags don't re-encode per pixel, and revokes superseded/unmounted result URLs to avoid leaks.
- `settingsStore` persists `AppSettings` (theme, worker concurrency, default format/quality, preventUpscale). Concurrency is clamped to `[1, MAX_CONCURRENCY=8]` and defaults to `navigator.hardwareConcurrency`.

**Routes** are file-based (TanStack Router). `routeTree.gen.ts` is generated — do not edit by hand; run `bun run generate-routes` after adding routes.

## Conventions

- **Import alias**: `#/*` maps to `src/*` (defined in both `package.json` imports and tsconfig; `@/*` also works in tsconfig). Imports include the `.ts`/`.tsx` extension (`allowImportingTsExtensions`).
- **File naming**: non-component files (`lib`, `hooks`, `stores`, `workers`, `types`) use **kebab-case** (`use-image-processor.ts`, `image-pool.ts`, `settings-store.ts`). Exported identifiers keep their JS-idiomatic casing (`useImageProcessor`, `imagePool`, `useSettingsStore`). React component files stay **PascalCase** (`Dropzone.tsx`); shadcn `ui/` files stay lowercase; `routes/*` filenames map to URLs — don't rename.
- **UI**: shadcn/ui (Radix) in `src/components/ui`, Tailwind CSS 4. Design tokens / visual system live in `DESIGN.md`; global styles + custom utility classes (`atmos-glow`, `surface-card`, `kicker`, `display-title`) are in `src/styles.css`.
- Components are organized by domain under `src/components` (upload, preview, controls, batch, pwa, layout, statistics).

## Build & deploy specifics

- The **service worker is generated post-build** by `scripts/generate-sw.mjs` (Workbox `generateSW`), *not* vite-plugin-pwa — the plugin is skipped under TanStack Start's multi-environment build. Update behavior is prompt-to-update: a new SW waits for the user to click Reload (posts `SKIP_WAITING`, handled by `public/sw-message.js`).
- `vite.config.ts` uses `spa: { enabled: true }` (static shell, `_shell.html` fallback) and pins the prerender preview server to `127.0.0.1` (avoids IPv4/IPv6 mismatch during prerender in containers).
- Two-stage Docker: `oven/bun` build → `nginx` serving `dist/client`. The image uses Bun because `oven/bun` has no `node` binary. Served behind a shared Traefik edge proxy (no host ports). CI (`.github/workflows/deploy.yml`) builds on push to `main`, pushes to GHCR, and SSH-deploys.
