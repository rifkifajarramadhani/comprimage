# Repository Guidelines

## Project Structure & Module Organization

Comprimage is a client-only React 19 and TanStack Start image-processing SPA. Application code lives in `src/`: file-based pages are in `routes/`, reusable UI is grouped by domain under `components/`, processing logic is in `lib/`, and state, hooks, shared types, and Web Workers have dedicated directories. Tests are colocated with library code as `src/lib/*.test.ts`. Static assets live in `public/`; `scripts/verify-seo.mjs` validates the production build. Docker and nginx deployment files are under `docker/` and the repository root.

Do not edit `src/routeTree.gen.ts` manually. After adding or changing routes, regenerate it with the route command below. Follow `DESIGN.md` when changing the visual system.

## Build, Test, and Development Commands

Use Bun for dependency management and project scripts:

- `bun install` — install dependencies from `bun.lock`.
- `bun run dev` — start Vite at `http://localhost:3000`.
- `bun run build` — create the static production bundle and verify SEO output.
- `bun run preview` — serve the production build locally.
- `bun run test` — run all Vitest tests once.
- `bunx vitest run src/lib/resize.test.ts` — run one test file.
- `bun run lint` — check ESLint rules.
- `bun run format` / `bun run check` — apply or verify Prettier formatting.
- `bun run generate-routes` — rebuild the generated TanStack route tree.

## Coding Style & Naming Conventions

TypeScript is strict; prefer explicit shared types and the `#/*` alias for `src/*` imports. Prettier enforces two-space indentation, single quotes, trailing commas, and no semicolons. React component files use PascalCase (`ToolWorkspace.tsx`); non-component modules use kebab-case (`image-pool.ts`); shadcn UI files remain lowercase. Keep components grouped by feature and preserve the client-side privacy model: image data must not leave the browser.

## Testing Guidelines

Vitest runs in jsdom. Name tests `*.test.ts` and colocate them with the module under test. Cover processing edge cases such as dimensions, format handling, object-URL cleanup, and browser fallback behavior. Run tests, lint, and formatting checks before submitting.

## Commit & Pull Request Guidelines

History primarily follows Conventional Commits (`feat:`, `fix:`, `refactor:`, `ci:`); use a concise, imperative subject. Pull requests should explain the behavior change, list verification commands, and link relevant issues. Include before/after screenshots for UI changes and call out worker, codec, or deployment implications.
