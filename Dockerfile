# syntax=docker/dockerfile:1

# --- dependencies: install once, shared by dev + build stages ---
FROM oven/bun:1 AS dependencies
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# --- development: hot-reloading Vite dev server (docker compose --profile dev) ---
FROM dependencies AS development
COPY . .
EXPOSE 3000
# `dev` script pins --port 3000; --host 0.0.0.0 exposes it outside the container.
CMD ["bun", "run", "dev", "--host", "0.0.0.0"]

# --- build: compile the static SPA with Bun (-> dist/client) ---
FROM dependencies AS build
COPY . .
# vite build + SEO verification. SPA/static mode emits everything under
# dist/client — there is no server bundle to run.
RUN bun run build

# --- production: serve the static output with nginx ---
FROM nginx:1.27-alpine AS production
COPY --from=build /app/dist/client /usr/share/nginx/html
COPY docker/nginx/comprimage.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
# nginx:alpine's default CMD runs nginx in the foreground.
