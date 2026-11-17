import assert from 'node:assert/strict'
import { readdir } from 'node:fs/promises'

const origin = process.env.NGINX_ORIGIN ?? 'http://127.0.0.1:8088'
const assets = await readdir(
  process.env.NGINX_ASSETS_DIR ?? 'dist/client/assets',
)
const cases = [
  ['/healthz', 200, 'text/plain'],
  ...['', 'resize', 'compress', 'convert', 'batch', 'about', 'settings'].map(
    (route) => [`/${route}`, 200, 'text/html'],
  ),
  ['/resize/', 308, 'text/html'],
  ['/favicon.ico', 200, 'image/x-icon'],
  ['/site.webmanifest', 200, 'application/manifest+json'],
  ['/missing-page', 404, 'text/html'],
  ['/missing.js', 404, 'text/plain'],
  ['/assets/missing.wasm', 404, 'text/plain'],
  ['/missing.html', 404, 'text/html'],
  ...['js', 'css', 'wasm', 'woff2'].map((extension) => [
    `/assets/${assets.find((name) => name.endsWith(`.${extension}`))}`,
    200,
    {
      js: 'application/javascript',
      css: 'text/css',
      wasm: 'application/wasm',
      woff2: 'font/woff2',
    }[extension],
  ]),
]
for (const [path, status, type] of cases) {
  const response = await fetch(`${origin}${path}`, { redirect: 'manual' })
  assert.equal(response.status, status, path)
  assert.ok(
    response.headers.get('content-type')?.includes(type),
    `${path}: MIME`,
  )
  if (process.env.CSP_HEADER) {
    for (const [name, value] of [
      [process.env.CSP_HEADER, "frame-ancestors 'none'"],
      ['x-frame-options', 'DENY'],
      ['x-content-type-options', 'nosniff'],
      ['referrer-policy', 'strict-origin-when-cross-origin'],
    ])
      assert.ok(response.headers.get(name)?.includes(value), `${path}: ${name}`)
  }
  if (status === 200 && path.startsWith('/assets/')) {
    assert.match(response.headers.get('cache-control'), /immutable/)
    const conditional = await fetch(`${origin}${path}`, {
      headers: { 'If-None-Match': response.headers.get('etag') },
    })
    assert.equal(conditional.status, 304)
    if (process.env.CSP_HEADER)
      assert.ok(conditional.headers.has(process.env.CSP_HEADER))
  }
  if (path === '/' || path === '/favicon.ico') {
    assert.match(response.headers.get('cache-control'), /no-cache/)
  }
  await response.arrayBuffer()
}
console.log(
  `Verified ${cases.length} nginx responses, caching and conditional requests`,
)
