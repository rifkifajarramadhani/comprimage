# syntax=docker/dockerfile:1

# --- build: compile the static SPA with Bun (-> dist/client) ---
FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
# vite build + `bun scripts/generate-sw.mjs` (Workbox service worker). SPA/static
# mode emits everything under dist/client — there is no server bundle to run.
RUN bun run build

# --- prod: serve the static output with nginx ---
FROM nginx:1.27-alpine AS prod
COPY --from=build /app/dist/client /usr/share/nginx/html
COPY docker/nginx/comprimage.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
# nginx:alpine's default CMD runs nginx in the foreground.
