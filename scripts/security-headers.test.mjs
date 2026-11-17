// @vitest-environment node
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { expect, test } from 'vitest'
import {
  generateSecurityHeaders,
  inlineScriptHashes,
} from './security-headers.mjs'

const hash = (text) =>
  `'sha256-${createHash('sha256').update(text).digest('base64')}'`

test('hashes exact script text, modules and hydration, excluding external scripts and inert JSON', () => {
  expect(
    inlineScriptHashes(
      `<script>\nhello &amp; world\n</script><script type="module">hydrate()</script><script src="/main.js"></script><script type="application/ld+json">{}</script>`,
    ),
  ).toEqual([hash('\nhello &amp; world\n'), hash('hydrate()')])
})

test('scans nested HTML and error pages, deduplicates hashes and supports report-only', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'comprimage-csp-'))
  const root = join(dir, 'public')
  const output = join(dir, 'nginx/headers.conf')
  try {
    await mkdir(join(root, 'route'), { recursive: true })
    await writeFile(join(root, 'index.html'), '<script>theme()</script>')
    await writeFile(
      join(root, 'route/index.html'),
      '<script>theme()</script><script>hydrate()</script>',
    )
    await writeFile(join(root, '404.html'), '<script>error()</script>')
    expect(await generateSecurityHeaders(root, output, true)).toEqual({
      documents: 3,
      hashes: 3,
    })
    const headers = await readFile(output, 'utf8')
    for (const script of ['theme()', 'hydrate()', 'error()'])
      expect(headers).toContain(hash(script))
    expect(headers).toContain('Content-Security-Policy-Report-Only')
    expect(headers).toContain("'wasm-unsafe-eval'")
    expect(headers).not.toContain("'unsafe-eval'")
    expect(headers).toContain(' always;')
    await generateSecurityHeaders(root, output)
    expect(await readFile(output, 'utf8')).toContain(
      'add_header Content-Security-Policy "',
    )
    await expect(
      generateSecurityHeaders(root, join(root, 'exposed.conf')),
    ).rejects.toThrow('outside')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
