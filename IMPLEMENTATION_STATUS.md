# Comprimage — Implementation Status

> Fast, privacy-first, 100% client-side image toolkit (resize / compress / convert) on TanStack Start.
> This document tracks what's built and what's next so implementation can continue.

**Last updated:** 2026-07-05
**Scope completed:** Phases 1–3 (foundation + core tools)

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
| `zip.ts` | `zipBlobs(entries)` via fflate — **scaffolded, not yet wired to UI**. |
| `source.ts` | `createSourceImage(file)`, `releaseSourceImage`, accepted types, max size. |
| `format.ts` | `formatBytes`. |

- `src/hooks/useImageProcessor.ts` — debounced auto-run on source/options change, revokes stale URLs.
  Boundary is a plain async fn so a Web Worker can slot in later without changing callers.
- `src/types/image.ts` — `SourceImage`, `ProcessResult`, `ResizeOptions`, `EncodeOptions`, `OutputFormat`.

### 5. Tools + components
- `src/components/ToolWorkspace.tsx` — shared workspace (source state + processing + preview/stats/download).
- `src/routes/{resize,compress,convert}.tsx` — each composes the workspace with its own controls.
- `src/routes/index.tsx` — home hero + dropzone + feature cards.
- Components: `upload/Dropzone.tsx`, `preview/BeforeAfter.tsx`, `statistics/Stats.tsx`,
  `controls/{ResizeControls,CompressControls,FormatSelect}.tsx`, `common/DownloadButton.tsx`.

### Verification status
- `tsc --noEmit` clean · `npm run test` **10/10 pass** · `npm run lint` clean · `npm run build` succeeds.
- Preview server serves fully-rendered black-canvas HTML; all custom utilities compiled into CSS.

---

## ⚠️ Known gaps / follow-ups

1. **End-to-end canvas processing not automated** — jsdom has no canvas, so actual resize/compress/convert
   output is covered by unit tests + a build/render smoke test only. Do a manual click-through with a real
   photo in a browser (`npm run dev`), and confirm the Network tab shows **zero image egress**.
2. **Deploy fallback** — SPA mode emits `dist/client/_shell.html`. For GitHub Pages, serve it as the
   index/404 fallback (copy to `index.html` or configure the host).
3. **Home dropzone doesn't carry the image** — it decodes then navigates to `/resize`, so the user re-drops.
   Fix by lifting `SourceImage` into a shared store (Zustand or React context) shared across routes.
4. shadcn `button` (outline) and `slider` thumb still carry small `shadow-*` classes from the primitives —
   minor deviation from the "no drop shadows" rule if you want strict fidelity.

---

## 🔜 Deferred (later phases)

### Phase 4 — Performance
- Move `processImage` into a **Web Worker** (`src/workers/image.worker.ts`) using OffscreenCanvas +
  transferables. The `useImageProcessor` hook is the only file that should change.
- `useImageQueue` hook for concurrency control.

### Phase 3 remainder — Batch
- Multi-file upload + queue + progress UI.
- Wire `lib/zip.ts` `zipBlobs` into a "Download all" ZIP button.
- `src/routes/batch.tsx`.

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
