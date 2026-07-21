import { readFileSync, existsSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { resolve } from 'node:path'
import { JSDOM } from 'jsdom'

const root = resolve(import.meta.dirname, '..')
const output = resolve(root, 'dist/client')
const siteUrl = 'https://comprimage.my.id'
const socialImageUrl = `${siteUrl}/og/comprimage-social.png`
const socialImageAlt =
  'Comprimage logo with the message “Private image tools. Nothing uploaded.” and a list of image tools'
// Ceiling for the gzipped JS/CSS the home page loads eagerly — a budget, not a
// ratchet: builds may sit anywhere under it. The slack is deliberate, because the
// same commit measures differently across toolchains (181,637 bytes on Bun 1.3.10
// locally vs 183,118 on the 1.3.14 baseline build in Docker), and a gate with no
// headroom fails in CI while passing on the machine it was tuned on. Lower it when
// an optimization genuinely shrinks the bundle; raise it only deliberately.
const INITIAL_GZIP_BUDGET = 190_000

// `keyword` must appear in the page's <h1> text; `minWords` guards against the
// thin-content regression where a tool page renders only a heading and a
// dropzone (everything else being gated behind a dropped file).
const MIN_INDEXABLE_WORDS = 200

const pages = [
  { path: '/', file: 'index.html', indexable: true, keyword: 'images' },
  {
    path: '/resize',
    file: 'resize/index.html',
    indexable: true,
    keyword: 'Resize',
    faq: true,
  },
  {
    path: '/compress',
    file: 'compress/index.html',
    indexable: true,
    keyword: 'Compress',
    faq: true,
  },
  {
    path: '/convert',
    file: 'convert/index.html',
    indexable: true,
    keyword: 'Convert',
    faq: true,
  },
  {
    path: '/batch',
    file: 'batch/index.html',
    indexable: true,
    keyword: 'Batch',
    faq: true,
  },
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

function assertBrandLinks(document, pagePath) {
  const svgIcon = one(
    document,
    'link[rel="icon"][type="image/svg+xml"]',
    pagePath,
  )
  assert(
    svgIcon.getAttribute('href') === '/comprimage-mark.svg' &&
      svgIcon.getAttribute('sizes') === 'any',
    `${pagePath}: unexpected SVG favicon link`,
  )

  const icoIcon = one(
    document,
    'link[rel="icon"][type="image/x-icon"]',
    pagePath,
  )
  assert(
    icoIcon.getAttribute('href') === '/favicon.ico' &&
      icoIcon.getAttribute('sizes') === '16x16 32x32 48x48 64x64',
    `${pagePath}: unexpected ICO favicon link`,
  )

  const appleIcon = one(document, 'link[rel="apple-touch-icon"]', pagePath)
  assert(
    appleIcon.getAttribute('href') === '/apple-touch-icon.png' &&
      appleIcon.getAttribute('type') === 'image/png' &&
      appleIcon.getAttribute('sizes') === '180x180',
    `${pagePath}: unexpected Apple touch icon link`,
  )

  assert(
    one(document, 'link[rel="manifest"]', pagePath).getAttribute('href') ===
      '/site.webmanifest',
    `${pagePath}: unexpected web app manifest link`,
  )
}

function pngInfo(file, label) {
  const png = readFileSync(file)
  assert(png.toString('ascii', 1, 4) === 'PNG', `${label}: not a PNG`)
  return {
    width: png.readUInt32BE(16),
    height: png.readUInt32BE(20),
    bitDepth: png[24],
    colorType: png[25],
  }
}

function assertPng(relativePath, size, colorType) {
  const info = pngInfo(resolve(output, relativePath), relativePath)
  assert(
    info.width === size && info.height === size,
    `${relativePath}: expected ${size}x${size}, got ${info.width}x${info.height}`,
  )
  assert(info.bitDepth === 8, `${relativePath}: expected 8-bit color`)
  assert(
    info.colorType === colorType,
    `${relativePath}: expected PNG color type ${colorType}, got ${info.colorType}`,
  )
}

/** Every JSON-LD node on the page, flattening any @graph containers. */
function jsonLdNodes(document) {
  const nodes = []
  for (const script of document.querySelectorAll(
    'script[type="application/ld+json"]',
  )) {
    const parsed = JSON.parse(script.textContent)
    nodes.push(...(parsed['@graph'] ?? [parsed]))
  }
  return nodes
}

/** Visible text as a crawler would read it, scripts and styles removed. */
function visibleText(document) {
  const clone = document.body.cloneNode(true)
  for (const node of clone.querySelectorAll('script, style')) node.remove()
  return clone.textContent.replace(/\s+/g, ' ').trim()
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

  assertBrandLinks(document, page.path)

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
  assert(
    one(document, 'meta[property="og:image:alt"]', page.path).getAttribute(
      'content',
    ) === socialImageAlt &&
      one(document, 'meta[name="twitter:image:alt"]', page.path).getAttribute(
        'content',
      ) === socialImageAlt,
    `${page.path}: unexpected social image alt text`,
  )

  const nodes = jsonLdNodes(document)
  const text = visibleText(document)

  // Both media variants must survive: the router's head merge dedupes meta by
  // `name`, so declaring these through `head()` would silently drop one.
  const themeColors = [
    ...document.querySelectorAll('meta[name="theme-color"]'),
  ].map((meta) => meta.getAttribute('media'))
  assert(
    themeColors.includes('(prefers-color-scheme: light)') &&
      themeColors.includes('(prefers-color-scheme: dark)'),
    `${page.path}: expected light and dark theme-color tags, got ${themeColors.length}`,
  )

  // Exactly one h1, carrying the page's primary keyword as real text content
  // (an aria-label would be invisible to a crawler).
  const h1 = one(document, 'h1', page.path).textContent.trim()
  if (page.keyword) {
    assert(
      h1.toLowerCase().includes(page.keyword.toLowerCase()),
      `${page.path}: h1 "${h1}" is missing keyword "${page.keyword}"`,
    )
  }

  if (page.faq) {
    const faq = nodes.find((node) => node['@type'] === 'FAQPage')
    assert(faq, `${page.path}: missing FAQPage JSON-LD`)
    assert(
      faq.mainEntity.length >= 3,
      `${page.path}: FAQPage has only ${faq.mainEntity.length} questions`,
    )
    // Google requires every marked-up answer to be visible on the page.
    for (const entry of faq.mainEntity) {
      assert(
        text.includes(entry.name),
        `${page.path}: FAQ question is not visible on the page: ${entry.name}`,
      )
      assert(
        text.includes(entry.acceptedAnswer.text),
        `${page.path}: FAQ answer is not visible on the page: ${entry.name}`,
      )
    }
  }

  const robots = one(document, 'meta[name="robots"]', page.path).getAttribute(
    'content',
  )
  if (page.indexable) {
    const words = text.split(' ').length
    assert(
      words >= MIN_INDEXABLE_WORDS,
      `${page.path}: only ${words} indexable words (minimum ${MIN_INDEXABLE_WORDS})`,
    )

    if (page.path !== '/') {
      const crumbs = nodes.find((node) => node['@type'] === 'BreadcrumbList')
      assert(crumbs, `${page.path}: missing BreadcrumbList JSON-LD`)
      assert(
        crumbs.itemListElement.at(-1).item === canonicalFor(page.path),
        `${page.path}: BreadcrumbList does not end at the canonical URL`,
      )
    }

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
const homeNodes = jsonLdNodes(home)
const nodeOfType = (type) => homeNodes.find((node) => node['@type'] === type)

const website = nodeOfType('WebSite')
assert(website, '/: missing WebSite JSON-LD')
assert(website.url === `${siteUrl}/`, '/: incorrect WebSite URL')

const webapp = nodeOfType('WebApplication')
assert(webapp, '/: missing WebApplication JSON-LD')
assert(
  webapp.applicationCategory && webapp.operatingSystem,
  '/: WebApplication is missing applicationCategory/operatingSystem',
)
assert(webapp.offers?.price === '0', '/: WebApplication is not marked free')

const publisher = nodeOfType('Person') ?? nodeOfType('Organization')
assert(publisher, '/: missing Person/Organization publisher JSON-LD')
assert(
  website.publisher?.['@id'] === publisher['@id'] &&
    webapp.publisher?.['@id'] === publisher['@id'],
  '/: WebSite/WebApplication do not reference the publisher @id',
)

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

const socialImage = pngInfo(
  resolve(output, 'og/comprimage-social.png'),
  'social image',
)
assert(
  socialImage.width === 1200 && socialImage.height === 630,
  'social image: expected 1200x630',
)
assert(
  socialImage.bitDepth === 8 && socialImage.colorType === 2,
  'social image: expected an opaque 8-bit RGB PNG',
)

const mark = readFileSync(resolve(output, 'comprimage-mark.svg'), 'utf8')
assert(mark.includes('<svg'), 'brand mark: not an SVG')
assert(
  mark.includes('#3f9465') && mark.includes('#fdfcfc'),
  'brand mark: does not use the expected brand colors',
)

const favicon = readFileSync(resolve(output, 'favicon.ico'))
assert(
  favicon.readUInt16LE(0) === 0 && favicon.readUInt16LE(2) === 1,
  'favicon: invalid ICO header',
)
const faviconCount = favicon.readUInt16LE(4)
assert(faviconCount === 4, `favicon: expected 4 frames, got ${faviconCount}`)
const faviconSizes = Array.from({ length: faviconCount }, (_, index) => {
  const width = favicon[6 + index * 16]
  const height = favicon[7 + index * 16]
  return [width || 256, height || 256]
})
assert(
  JSON.stringify(faviconSizes) ===
    JSON.stringify([
      [16, 16],
      [32, 32],
      [48, 48],
      [64, 64],
    ]),
  `favicon: unexpected frame sizes ${JSON.stringify(faviconSizes)}`,
)

assertPng('apple-touch-icon.png', 180, 2)
assertPng('icons/comprimage-192.png', 192, 6)
assertPng('icons/comprimage-512.png', 512, 6)
assertPng('icons/comprimage-maskable-192.png', 192, 2)
assertPng('icons/comprimage-maskable-512.png', 512, 2)

const manifest = JSON.parse(readFileSync(resolve(output, 'site.webmanifest')))
assert(manifest.name === 'Comprimage — Image Toolkit', 'manifest: wrong name')
assert(manifest.short_name === 'Comprimage', 'manifest: wrong short name')
assert(
  manifest.id === '/' && manifest.start_url === '/' && manifest.scope === '/',
  'manifest: expected root id, start URL, and scope',
)
assert(manifest.display === 'standalone', 'manifest: wrong display mode')
assert(
  manifest.background_color === '#fdfcfc' && manifest.theme_color === '#3f9465',
  'manifest: wrong brand colors',
)
const expectedManifestIcons = [
  ['/icons/comprimage-192.png', '192x192', 'any'],
  ['/icons/comprimage-512.png', '512x512', 'any'],
  ['/icons/comprimage-maskable-192.png', '192x192', 'maskable'],
  ['/icons/comprimage-maskable-512.png', '512x512', 'maskable'],
]
assert(
  manifest.icons.length === expectedManifestIcons.length &&
    manifest.icons.every(
      (icon, index) =>
        icon.src === expectedManifestIcons[index][0] &&
        icon.sizes === expectedManifestIcons[index][1] &&
        icon.type === 'image/png' &&
        icon.purpose === expectedManifestIcons[index][2],
    ),
  'manifest: unexpected icon declarations',
)

const notFound = new JSDOM(readFileSync(resolve(output, '404.html'), 'utf8'))
  .window.document
assertBrandLinks(notFound, '/404.html')

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
  initialGzipBytes <= INITIAL_GZIP_BUDGET,
  `initial assets: ${initialGzipBytes} gzip bytes exceeds the ${INITIAL_GZIP_BUDGET} budget by ${initialGzipBytes - INITIAL_GZIP_BUDGET}`,
)
assert(
  !uniqueAssets.some((asset) => asset.endsWith('.wasm')),
  'initial assets: codec WASM was loaded eagerly',
)

console.log(
  `[verify-seo] ${pages.length} pages valid; initial assets ${initialGzipBytes} gzip bytes (${INITIAL_GZIP_BUDGET - initialGzipBytes} bytes under the ${INITIAL_GZIP_BUDGET} budget)`,
)
