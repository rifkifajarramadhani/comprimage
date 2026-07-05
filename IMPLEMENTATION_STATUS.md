# Comprimage — Implementation Status

> Fast, privacy-first, 100% client-side image toolkit (resize / compress / convert) on TanStack Start.
> This document tracks what's built and what's next so implementation can continue.

**Last updated:** 2026-07-06
**Scope completed:** Phases 1–5 (foundation + core tools + Web Worker + batch + PWA & settings)

---

## ✅ What's done

### 1. Static SPA build
- Enabled `spa.enabled` on the TanStack Start plugin in `vite.config.ts`.
- `npm run build` prerenders the shell (`dist/client/_shell.html`) and code-splits routes.
- Initial JS **~117 KB gzip** — under the 250 KB target.

### 2. Design system (`src/styles.css`)
- Replaced the leftover teal theme with the `DESIGN.md` Resend-black editorial system.
- True `#000000` canvas; fonts **Fraunces** (display) / **Inter** (UI) / **Geist Mono** (code).
- Hairline-border elevation (no drop shadows), atmospheric glow, strict radius scale.
- DESIGN.md tokens mapped into shadcn CSS variables so existing primitives inherit the look.
- Utility classes: `.display-title`, `.kicker`, `.surface-card`, `.surface-elevated`, `.code-window`,
  `.badge-pill`, `.feature-card`, `.atmos-glow` (+ `-orange/-green/-red`), `.nav-link`, `.rise-in`.

### 3. App shell
- `src/routes/__root.tsx` — sticky nav-bar + footer wrapping the outlet; title, theme-color, manifest meta.
- `src/components/layout/` — `SiteHeader.tsx`, `SiteFooter.tsx`, `Container.tsx`.
- `public/manifest.json` — Comprimage branding, black background.

### 4. Processing core (`src/lib/`)
| File | Purpose |
|---|---|
| `resize.ts` | Pure `computeDimensions(source, opts)` — width/height/longest-edge/percentage, aspect, prevent-upscale. Unit-tested. |
| `canvas.ts` | `decode`, `drawToCanvas`, `canvasToBlob` (OffscreenCanvas when available), `supportsAvifEncode`. |
| `process.ts` | `processImage(source, { resize?, encode })` — the decode → resize → encode → Blob pipeline. |
| `convert.ts` | `FORMATS`, `formatMeta`, `isLossy`, `withExtension`. |
| `compress.ts` | `DEFAULT_QUALITY`, `qualityPercent`, `compressionStats`, `supportsQuality`. |
| `download.ts` | `downloadBlob(blob, filename)`. |
| `zip.ts` | `zipBlobs(entries)` via fflate — wired into the batch "Download all" button. |
| `source.ts` | `createSourceImage(file)`, `releaseSourceImage`, accepted types, max size. |
| `format.ts` | `formatBytes`. |

- `src/hooks/useImageProcessor.ts` — debounced auto-run on source/options change, revokes stale URLs.
  Now dispatches to the Web Worker pool (below); the same interface, off the main thread.
- `src/types/image.ts` — `SourceImage`, `ProcessResult`, `ResizeOptions`, `EncodeOptions`, `OutputFormat`.

### 6. Web Worker offload (Phase 4)
- `process.ts` split: `processToBlob(input, opts)` is the URL-free core (worker-safe); `processImage`
  wraps it on the main thread and mints the object URL (used as the fallback).
- `src/workers/image.worker.ts` — module worker running `processToBlob`, returns the Blob (cloneable).
- `src/workers/imagePool.ts` — lazily-spawned pool sized to `min(hardwareConcurrency, 4)`, correlates
  requests by id, queues when saturated, mints URLs on the main thread. Falls back to `processImage`
  when `Worker`/`OffscreenCanvas` are unavailable. Shared by both the single-tool hook and batch queue.
- Emitted as a separate `image.worker-*.js` chunk; initial JS unchanged at **~117 KB gzip**.

### 7. Shared image store + Batch (Phase 3 remainder)
- `src/stores/imageStore.ts` — Zustand store holding the single-tool `SourceImage`. Owns the object-URL
  lifecycle. The home dropzone now hands the image to `/resize` (no re-drop), and it persists across
  resize/compress/convert. `ToolWorkspace` reads from the store instead of local state.
- `src/components/upload/Dropzone.tsx` — optional `multiple` + `onImages` for multi-file drops.
- `src/hooks/useImageQueue.ts` — owns a source list, processes each through the worker pool, tracks
  per-item status/result. Incremental (adding a file encodes only that file; changing options re-encodes
  all), revokes result URLs + releases sources on removal/unmount.
- `src/routes/batch.tsx` + `src/components/batch/BatchList.tsx` — multi-file workspace with per-item
  progress, aggregate savings, individual downloads, and **Download all (ZIP)** wiring `lib/zip.ts`.
- `Batch` added to the nav (`SiteHeader`). `zustand` added as a dependency.

### 8. PWA & Settings (Phase 5)
**PWA (offline + installable):**
- `scripts/generate-sw.mjs` — generates the Workbox service worker (`dist/client/sw.js`) as a
  post-build step. vite-plugin-pwa skips SSR/environment builds and never emits a SW under
  TanStack Start's multi-environment build, so `workbox-build`'s `generateSW` is run directly.
  Wired into `npm run build` (also `npm run generate-sw`). `workbox-build` is the dependency.
- Precaches the shell + JS/CSS/worker chunks + icons (23 files); `navigateFallback: /_shell.html`
  for offline SPA navigation; runtime `CacheFirst` for Google Fonts so type renders offline.
- **Prompt-to-update** (not auto-reload — protects in-progress work): `skipWaiting:false` +
  `public/sw-message.js` (imported into the SW) activates the waiting worker only when the user
  clicks Reload. `src/components/pwa/PwaUpdater.tsx` registers `/sw.js`, detects updates, shows a
  hairline toast, and reloads on the user-confirmed `controllerchange`.
- `src/components/pwa/InstallButton.tsx` — captures `beforeinstallprompt`, shows an Install button
  in the header only when installable. `public/manifest.json` gained a maskable icon + `id`/`scope`/
  `orientation`/`categories`; `__root.tsx` adds an `apple-touch-icon`.

**Settings + real light mode:**
- `src/routes/settings.tsx` (+ nav entry in `SiteHeader`) — Appearance (System/Light/Dark),
  Performance (concurrency 1..maxConcurrency), Defaults (format + quality + prevent-upscale), Reset.
- `src/lib/settings.ts` — `AppSettings`, `DEFAULT_SETTINGS`, `maxConcurrency()`, pure
  `clampConcurrency()` (unit-tested in `settings.test.ts`, 6 cases).
- `src/stores/settingsStore.ts` — Zustand `persist` store (`comprimage-settings`); mutations drive
  side effects (theme repaint, `imagePool.setSize`). `src/components/AppInit.tsx` applies persisted
  settings on load and keeps `system` theme synced to the OS.
- **Real light register** in `src/styles.css`: split `:root`/`.dark` from a new `.light` (inverted
  elevation, translucent-black hairlines, black-pill CTA). Only raw DESIGN.md tokens are redefined —
  the shadcn semantic vars are `var(--token)` refs that re-tint automatically. Theme-adaptive
  `--header-bg`/`--feature-hover-border` replace the previously hardcoded blacks/whites.
- `src/lib/theme.ts` — `applyTheme`/`resolveTheme`/`watchSystemTheme` + a standalone theme cache key
  read by the **no-FOUC inline script** in `__root.tsx` (sets the register class before first paint).
- **Configurable concurrency:** `src/workers/imagePool.ts` is now a resizable pool (`setSize` grows
  by spawning, shrinks by terminating idle workers + retiring busy ones on completion). Both the
  single-tool hook and the batch queue share the singleton, so the setting applies to both.
- Tool routes (`compress`/`convert`/`resize`/`batch`) seed their initial format/quality/prevent-upscale
  from `useSettingsStore.getState()`.

### 5. Tools + components
- `src/components/ToolWorkspace.tsx` — shared workspace (source state + processing + preview/stats/download).
- `src/routes/{resize,compress,convert}.tsx` — each composes the workspace with its own controls.
- `src/routes/index.tsx` — home hero + dropzone + feature cards.
- Components: `upload/Dropzone.tsx`, `preview/BeforeAfter.tsx`, `statistics/Stats.tsx`,
  `controls/{ResizeControls,CompressControls,FormatSelect}.tsx`, `common/DownloadButton.tsx`.

### Verification status
- `tsc --noEmit` clean · `npm run test` **16/16 pass** (resize 10 + settings 6) · `npm run lint` clean ·
  `npm run build` succeeds and `generate-sw` precaches 23 files → `dist/client/sw.js`.
- Build emits a code-split `image.worker-*.js` chunk + `sw.js`/`workbox-*.js`; initial JS ~124 KB gzip.
- Dev server: all routes (incl. `/settings`) return 200 with no SSR/hydration errors; the shell head
  carries `class="dark"`, the no-FOUC script, theme-color, manifest, and apple-touch-icon.
- **Still needs a manual browser click-through** (jsdom has no canvas/worker): the home→resize hand-off,
  worker output parity + UI responsiveness on a large photo, the batch ZIP download, **and Phase 5**:
  theme toggle flips light/dark with no FOUC + persists; concurrency change reflects in worker count;
  defaults seed the tool controls + Reset restores them; SW registers, offline reload works with **zero
  image egress**, and the install prompt appears/installs.

---

## ⚠️ Known gaps / follow-ups

1. **End-to-end canvas processing not automated** — jsdom has no canvas, so actual resize/compress/convert
   output is covered by unit tests + a build/render smoke test only. Do a manual click-through with a real
   photo in a browser (`npm run dev`), and confirm the Network tab shows **zero image egress**.
2. **Deploy fallback** — SPA mode emits `dist/client/_shell.html`. For GitHub Pages, serve it as the
   index/404 fallback (copy to `index.html` or configure the host).
3. shadcn `button` (outline) and `slider` thumb still carry small `shadow-*` classes from the primitives —
   minor deviation from the "no drop shadows" rule if you want strict fidelity.
4. **Batch has no resize control yet** — it applies format + quality to all files (compress/convert use
   cases). Add `ResizeControls` to `batch.tsx` if bulk-resize is wanted.
5. **Service worker only exists in production builds** — generated by `scripts/generate-sw.mjs` after
   `vite build` (deliberately not in dev). Test PWA/offline via `npm run build` then serve `dist/client`
   (the SW needs `/_shell.html` served as the navigation fallback, same as the deploy note above).
6. **Light-mode tokens are author-tuned, not audited** — accent/glow colors carry over from the dark
   brand; do a visual + WCAG contrast pass on the light register (`.light` in `styles.css`).

---

## 🔜 Deferred (later phases)

### Stretch
- Target-file-size compression (binary-search quality).
- Squoosh WASM codecs for better AVIF/WebP.
- Presets (social/dev sizes), EXIF strip (`exifr`), comparison slider + zoom, clipboard paste, undo/redo.

---

## Commands

```bash
npm run dev              # dev server on :3000
npm run build            # static SPA build -> dist/client (+ generates sw.js)
npm run generate-sw      # (re)generate the Workbox service worker from dist/client
npm run preview          # preview the build
npm run test             # vitest (unit tests)
npm run lint             # eslint
npm run generate-routes  # regenerate routeTree.gen.ts after adding routes
```
