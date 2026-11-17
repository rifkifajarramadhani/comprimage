import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { JSDOM } from 'jsdom'

export function inlineScriptHashes(html) {
  const { window } = new JSDOM(html)
  try {
    return [...window.document.querySelectorAll('script:not([src])')]
      .filter((script) => {
        const type = script.getAttribute('type')?.trim().toLowerCase() ?? ''
        // JSON/JSON-LD are inert. Hash all other types, including modules and
        // future executable types, so new framework scripts cannot be missed.
        return !['application/json', 'application/ld+json'].includes(type)
      })
      .map(
        (script) =>
          `'sha256-${createHash('sha256').update(script.textContent).digest('base64')}'`,
      )
  } finally {
    window.close()
  }
}

export async function htmlDocuments(root) {
  const documents = []
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = join(root, entry.name)
    if (entry.isDirectory()) documents.push(...(await htmlDocuments(path)))
    else if (entry.name.endsWith('.html')) documents.push(path)
  }
  return documents.sort()
}

export async function generateSecurityHeaders(
  root,
  output,
  reportOnly = false,
) {
  if (resolve(output).startsWith(`${resolve(root)}/`)) {
    throw new Error(
      'Security headers must be outside the public document root.',
    )
  }
  const documents = await htmlDocuments(root)
  if (!documents.length) throw new Error('No built HTML documents found.')
  const hashes = new Set()
  for (const path of documents) {
    for (const hash of inlineScriptHashes(await readFile(path, 'utf8')))
      hashes.add(hash)
  }
  const policy = [
    "default-src 'none'",
    `script-src 'self' 'wasm-unsafe-eval' ${[...hashes].sort().join(' ')}`,
    "worker-src 'self'",
    "connect-src 'self'",
    "img-src 'self' blob:",
    // Vite inlines the smallest self-hosted WOFF2 subset as a data URL.
    "font-src 'self' data:",
    // React and Radix set inline styles for positioning and preview geometry.
    "style-src 'self' 'unsafe-inline'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
  const header = reportOnly
    ? 'Content-Security-Policy-Report-Only'
    : 'Content-Security-Policy'
  // Escape nginx's string interpolation, even if a future directive uses '$'.
  const escaped = policy
    .replaceAll('\\', '\\\\')
    .replaceAll('"', '\\"')
    .replaceAll('$', '\\$')
  await mkdir(dirname(output), { recursive: true })
  await writeFile(
    output,
    [
      '# Generated from all emitted HTML. Rebuild rather than editing hashes.',
      `add_header ${header} "${escaped}" always;`,
      'add_header X-Frame-Options "DENY" always;',
      'add_header X-Content-Type-Options "nosniff" always;',
      'add_header Referrer-Policy "strict-origin-when-cross-origin" always;',
      '',
    ].join('\n'),
  )
  return { documents: documents.length, hashes: hashes.size }
}

if (import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  console.log(
    await generateSecurityHeaders(
      'dist/client',
      'dist/nginx/security-headers.conf',
      process.argv.includes('--report-only'),
    ),
  )
}
