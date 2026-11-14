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

Use concise, imperative Conventional Commit subjects in the form
`type(scope): summary`, for example `fix(workers): release completed image URLs`
or `docs(agents): require checkpoint commits`. Keep each commit focused on one
logical change. Add a commit body when it explains the reason or important
implementation details.

### Checkpoint commit workflow

This workflow is the user's standing request to commit. Commit each checkpoint
as soon as its focused checks pass, without asking for permission or waiting
until the entire task is complete. Follow any explicit user instruction to
defer or skip commits. This workflow does not authorize pushing, force-pushing,
or rewriting published history. If the current branch is `main`, create a
branch before committing unless the user explicitly asks to commit on `main`.

Before editing, split the task into small, independently reviewable checkpoints
and list them in the plan or todo list. Give each checkpoint its intended commit
subject, for example `Fix worker fallback and its tests -> commit
"fix(workers): handle unavailable OffscreenCanvas"`. A simple change with one
checkpoint needs only one commit.

Size each checkpoint as the smallest logical change that builds and passes its
checks on its own, such as one processing fix with its tests, one component
change, or one documentation update. Split separate concerns into separate
checkpoints.

For each checkpoint, in order:

1. Implement one logical change with its required tests and documentation.
2. Run the focused checks and fix failures caused by the change. For code,
   run affected Vitest tests, ESLint on touched code, and Prettier on touched
   files. For documentation only, run
   `bunx prettier --check <changed-doc-paths>` and review the diff. Check the
   rendered UI when behavior or layout changes. Run the full `bun run test`,
   `bun run lint`, and `bun run check` before submitting; do not delay each
   checkpoint for these broader checks. Commit any resulting fixes separately.
3. Stage only that checkpoint's files or hunks with `git add <paths>` or
   `git add -p`. Never use `git add .` or `git add -A` over pre-existing or
   unrelated worktree changes.
4. Run `git commit` immediately. Start the next checkpoint only after this
   commit succeeds.

A checkpoint is complete only after it is committed. Update any matching task
checkbox or status in the commit that completes that task. Before the final
reply, confirm with `git status` that your changes are committed and list the
commits you created. Preserve unrelated user changes.

Do not batch several checkpoints into a final commit, amend an earlier
checkpoint to fold in later work, or bypass a failing hook with `--no-verify`.
Fix hook failures and retry the commit.

Pull requests should explain the behavior change, list verification commands,
and link relevant issues. Include before/after screenshots for UI changes and
call out worker, codec, or deployment implications.
