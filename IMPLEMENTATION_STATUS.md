# Comprimage — Implementation Status

> Fast, privacy-first, 100% client-side image toolkit (resize / compress / convert) on TanStack Start.
> This document tracks what's built and what's next so implementation can continue.

**Last updated:** 2026-07-06
**Scope completed:** Phases 1–4 (foundation + core tools + Web Worker) and the Phase 3 batch tool

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

### 5. Tools + components
- `src/components/ToolWorkspace.tsx` — shared workspace (source state + processing + preview/stats/download).
- `src/routes/{resize,compress,convert}.tsx` — each composes the workspace with its own controls.
- `src/routes/index.tsx` — home hero + dropzone + feature cards.
- Components: `upload/Dropzone.tsx`, `preview/BeforeAfter.tsx`, `statistics/Stats.tsx`,
  `controls/{ResizeControls,CompressControls,FormatSelect}.tsx`, `common/DownloadButton.tsx`.

### Verification status
- `tsc --noEmit` clean · `npm run test` **10/10 pass** · `npm run lint` clean · `npm run build` succeeds.
- Build emits a code-split `image.worker-*.js` chunk; initial JS unchanged at ~117 KB gzip.
- Preview server serves fully-rendered black-canvas HTML; all custom utilities compiled into CSS.
- **Still needs a manual browser click-through** (jsdom has no canvas/worker): verify the home→resize
  hand-off, worker output parity + UI responsiveness on a large photo, and the batch ZIP download.

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

---

## 🔜 Deferred (later phases)

### Phase 5 — PWA & settings
- Service worker / offline, install prompt.
- `src/routes/settings.tsx` — theme toggle (a light register would need real light-mode tokens),
  performance/concurrency prefs, persisted via IndexedDB/localStorage.

### Stretch
- Target-file-size compression (binary-search quality).
- Squoosh WASM codecs for better AVIF/WebP.
- Presets (social/dev sizes), EXIF strip (`exifr`), comparison slider + zoom, clipboard paste, undo/redo.

---

## Commands

```bash
npm run dev              # dev server on :3000
npm run build            # static SPA build -> dist/client
npm run preview          # preview the build
npm run test             # vitest (unit tests)
npm run lint             # eslint
npm run generate-routes  # regenerate routeTree.gen.ts after adding routes
```
