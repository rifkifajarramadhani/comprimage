import { readFileSync, existsSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { resolve } from 'node:path'
import { JSDOM } from 'jsdom'

const root = resolve(import.meta.dirname, '..')
const output = resolve(root, 'dist/client')
const siteUrl = 'https://comprimage.rifkiramadhani.my.id'
const socialImageUrl = `${siteUrl}/og/comprimage-social.png`
const initialGzipBaseline = 182_220

const pages = [
  { path: '/', file: 'index.html', indexable: true },
  { path: '/resize', file: 'resize/index.html', indexable: true },
  { path: '/compress', file: 'compress/index.html', indexable: true },
  { path: '/convert', file: 'convert/index.html', indexable: true },
  { path: '/batch', file: 'batch/index.html', indexable: true },
  { path: '/about', file: 'about/index.html', indexable: true },
  { path: '/settings', file: 'settings/index.html', indexable: false },
]

const requiredOg = [
  'og:type',
  'og:site_name',
  'og:title',
  'og:description',
  'og:url',
  'og:image',
  'og:image:width',
  'og:image:height',
  'og:image:type',
  'og:image:alt',
]
const requiredTwitter = [
  'twitter:card',
  'twitter:title',
  'twitter:description',
  'twitter:image',
  'twitter:image:alt',
]

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function one(document, selector, pagePath) {
  const nodes = document.querySelectorAll(selector)
  assert(
    nodes.length === 1,
    `${pagePath}: expected exactly one ${selector}, found ${nodes.length}`,
  )
  return nodes[0]
}

function canonicalFor(path) {
  return path === '/' ? `${siteUrl}/` : `${siteUrl}${path}`
}

const titles = new Set()
const descriptions = new Set()

for (const page of pages) {
  const file = resolve(output, page.file)
  assert(existsSync(file), `${page.path}: missing prerendered ${page.file}`)

  const html = readFileSync(file, 'utf8')
  const { document } = new JSDOM(html).window
  const title = one(document, 'title', page.path).textContent.trim()
  const description = one(
    document,
    'meta[name="description"]',
    page.path,
  ).getAttribute('content')
  const canonical = one(
    document,
    'link[rel="canonical"]',
    page.path,
  ).getAttribute('href')

  assert(title, `${page.path}: title is empty`)
  assert(description, `${page.path}: description is empty`)
  assert(
    canonical === canonicalFor(page.path),
    `${page.path}: canonical is ${canonical}`,
  )

  for (const property of requiredOg) {
    one(document, `meta[property="${property}"]`, page.path)
  }
  for (const name of requiredTwitter) {
    one(document, `meta[name="${name}"]`, page.path)
  }

  assert(
    one(document, 'meta[property="og:title"]', page.path).getAttribute(
      'content',
    ) === title,
    `${page.path}: og:title differs from title`,
  )
  assert(
    one(document, 'meta[property="og:description"]', page.path).getAttribute(
      'content',
    ) === description,
    `${page.path}: og:description differs from description`,
  )
  assert(
    one(document, 'meta[property="og:url"]', page.path).getAttribute(
      'content',
    ) === canonical,
    `${page.path}: og:url differs from canonical`,
  )
  assert(
    one(document, 'meta[property="og:image"]', page.path).getAttribute(
      'content',
    ) === socialImageUrl,
    `${page.path}: unexpected social image`,
  )

  const robots = one(document, 'meta[name="robots"]', page.path).getAttribute(
    'content',
  )
  if (page.indexable) {
    assert(!robots.includes('noindex'), `${page.path}: unexpectedly noindex`)
    assert(!titles.has(title), `${page.path}: duplicate title ${title}`)
    assert(
      !descriptions.has(description),
      `${page.path}: duplicate description`,
    )
    titles.add(title)
    descriptions.add(description)
  } else {
    assert(
      robots === 'noindex, follow',
      `${page.path}: expected noindex, follow`,
    )
  }
}

const home = new JSDOM(readFileSync(resolve(output, 'index.html'), 'utf8'))
  .window.document
const jsonLd = one(home, 'script[type="application/ld+json"]', '/')
const website = JSON.parse(jsonLd.textContent)
assert(website['@type'] === 'WebSite', '/: missing WebSite JSON-LD')
assert(website.url === `${siteUrl}/`, '/: incorrect WebSite URL')

const sitemap = readFileSync(resolve(output, 'sitemap.xml'), 'utf8')
for (const page of pages.filter((candidate) => candidate.indexable)) {
  assert(
    sitemap.includes(`<loc>${canonicalFor(page.path)}</loc>`),
    `sitemap: missing ${page.path}`,
  )
}
assert(!sitemap.includes(`${siteUrl}/settings`), 'sitemap: includes /settings')

const robots = readFileSync(resolve(output, 'robots.txt'), 'utf8')
assert(
  robots.includes(`Sitemap: ${siteUrl}/sitemap.xml`),
  'robots.txt: missing sitemap declaration',
)

const socialImage = readFileSync(resolve(output, 'og/comprimage-social.png'))
assert(socialImage.toString('ascii', 1, 4) === 'PNG', 'social image: not a PNG')
assert(
  socialImage.readUInt32BE(16) === 1200 && socialImage.readUInt32BE(20) === 630,
  'social image: expected 1200x630',
)

assert(
  !existsSync(resolve(output, '_shell.html')),
  'unexpected SPA shell output',
)

const homeHtml = readFileSync(resolve(output, 'index.html'), 'utf8')
const linkedAssets = [
  ...homeHtml.matchAll(/(?:src|href)="(\/assets\/[^"]+\.(?:js|css))"/g),
].map((match) => match[1])
const uniqueAssets = [...new Set(linkedAssets)]
const initialGzipBytes = uniqueAssets.reduce((total, asset) => {
  const bytes = readFileSync(resolve(output, asset.slice(1)))
  return total + gzipSync(bytes).length
}, 0)

assert(
  initialGzipBytes < initialGzipBaseline,
  `initial assets: ${initialGzipBytes} gzip bytes did not improve on ${initialGzipBaseline}`,
)
assert(
  !uniqueAssets.some((asset) => asset.endsWith('.wasm')),
  'initial assets: codec WASM was loaded eagerly',
)

console.log(
  `[verify-seo] ${pages.length} pages valid; initial assets ${initialGzipBytes} gzip bytes (${initialGzipBaseline - initialGzipBytes} bytes below baseline)`,
)
