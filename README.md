# Comprimage

Fast, privacy-first image toolkit. Resize, compress, and convert images entirely in your browser — images never leave your device. No uploads, no accounts, no waiting. Installable as a PWA for offline use.

Live at **https://comprimage.rifkiramadhani.my.id**

## Features

- **Resize** — scale by width, height, longest edge, or percentage; aspect ratio locked, upscaling blocked
- **Compress** — quality slider with live savings preview at full resolution
- **Convert** — move between JPG, PNG, WebP, and AVIF
- **Batch** — queue multiple images and download results as a ZIP
- **Settings** — theme preference, default output format/quality, worker concurrency
- **PWA** — offline-capable via a Workbox-generated service worker

## Tech stack

- [TanStack Start](https://tanstack.com/start) (SPA/static mode), [TanStack Router](https://tanstack.com/router), React 19
- Tailwind CSS 4, [shadcn/ui](https://ui.shadcn.com/) (Radix)
- Zustand for image and settings state
- Web Workers + Canvas API for image processing
- Vitest, ESLint, Prettier
- Bun for install/build; Docker + nginx for production

## Project structure

```
comprimage/
├── docker/nginx/          # nginx SPA config
├── public/                # PWA manifest, robots, SW message handler
├── scripts/               # post-build Workbox SW generation
├── src/
│   ├── components/        # UI by domain (upload, preview, controls, batch, pwa, layout, ui)
│   ├── hooks/             # useImageProcessor, useImageQueue
│   ├── lib/               # pipeline (process, resize, compress, convert, canvas, zip, download)
│   ├── routes/            # file-based pages (index, resize, compress, convert, batch, settings)
│   ├── stores/            # imageStore, settingsStore
│   ├── types/             # shared image/pipeline types
│   └── workers/           # image.worker.ts + ImagePool
├── Dockerfile
├── docker-compose.yml
└── DESIGN.md              # design tokens / visual system reference
```

### Routes

| Path        | Purpose                                      |
| ----------- | -------------------------------------------- |
| `/`         | Home — dropzone and tool overview            |
| `/resize`   | Scale images with live before/after preview  |
| `/compress` | Shrink file size at the same dimensions      |
| `/convert`  | Change output format                         |
| `/batch`    | Process multiple images, download as ZIP     |
| `/settings` | Theme, defaults, and worker concurrency      |

## How it works

Users drop or select images via a shared dropzone. The source image is held in a Zustand store so it carries across the resize, compress, and convert tools. Each tool builds `ProcessOptions` from its controls and hands them to a shared `ToolWorkspace`, which drives processing through an `ImagePool` of Web Workers.

The pipeline is **decode → (optional resize) → encode → Blob**, implemented in `src/lib/process.ts`. Object URLs are minted on the main thread (blob URLs created inside a worker are not reliably usable from the document). When Web Workers or OffscreenCanvas are unavailable, processing falls back to the main thread.

```mermaid
flowchart LR
  Dropzone --> imageStore
  imageStore --> ToolWorkspace
  ToolWorkspace --> ImagePool
  ImagePool --> Worker["Web Worker"]
  Worker --> processPipeline["decode → resize? → encode"]
  processPipeline --> Preview["BeforeAfter + Stats"]
  Preview --> Download
```

## Getting started

Requires [Bun](https://bun.sh/).

```bash
bun install
bun run dev        # http://localhost:3000
bun run build
bun run preview
bun run test
bun run lint
bun run format
bun run check
```

`build` runs `vite build` then `bun scripts/generate-sw.mjs` to emit the service worker. The Docker image uses Bun for the same reason — the `oven/bun` image has no `node` binary.

## Deployment (Docker)

Comprimage is a **100% client-side static SPA** (no backend, no database). It ships as a two-stage container: a **Bun** build stage produces the static output (`dist/client`), and an **nginx** stage serves it.

Files:

- `Dockerfile` — `oven/bun:1` build stage (`bun install --frozen-lockfile` + `bun run build`) → `nginx:1.27-alpine` serving `dist/client`
- `docker/nginx/comprimage.conf` — SPA fallback to the prerendered `_shell.html`, `no-cache` headers for `sw.js` / `manifest.json`, and long-lived caching for hashed `/assets`
- `docker-compose.yml` — a single `web` service on the external `edge` network

Build and run:

```bash
docker compose build
docker compose up -d
```

TLS and routing are handled by the shared **Traefik** edge proxy (Let's Encrypt). The container joins the `edge` Docker network and publishes **no** host ports; routing is configured via Traefik labels on the `web` service in `docker-compose.yml`.

> `vite.config.ts` pins the prerender preview server to `127.0.0.1` so the build's prerender step is reliable inside containers.

### CI

On push to `main`, [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds the Docker image, pushes it to GHCR (`ghcr.io/rifkifajarramadhani/comprimage`), and SSH-deploys to the production host.
