// Writes dist/client/sitemap.xml after `vite build`. Run with Bun so it can import
// the shared TS site-config directly. The route list is maintained here (small,
// rarely changes) rather than derived from routeTree.gen.ts to keep this script
// dependency-free; /settings is intentionally excluded (not useful in search).
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { writeFile } from 'node:fs/promises'
import { SITE_URL, absUrl } from '../src/lib/site.ts'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dest = resolve(root, 'dist/client/sitemap.xml')

// path → priority. Home first, tools next, about last.
const ROUTES = [
  ['/', '1.0'],
  ['/resize', '0.8'],
  ['/compress', '0.8'],
  ['/convert', '0.8'],
  ['/batch', '0.7'],
  ['/about', '0.5'],
]

const lastmod = new Date().toISOString().slice(0, 10)

const urls = ROUTES.map(
  ([path, priority]) =>
    `  <url>\n` +
    `    <loc>${absUrl(path)}</loc>\n` +
    `    <lastmod>${lastmod}</lastmod>\n` +
    `    <priority>${priority}</priority>\n` +
    `  </url>`,
).join('\n')

const xml =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  `${urls}\n` +
  `</urlset>\n`

await writeFile(dest, xml, 'utf8')
console.log(
  `[generate-sitemap] Wrote ${ROUTES.length} urls (${SITE_URL}) -> dist/client/sitemap.xml`,
)
