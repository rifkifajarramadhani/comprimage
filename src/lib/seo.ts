export const SITE_URL = 'https://comprimage.rifkiramadhani.my.id'

const SOCIAL_IMAGE_PATH = '/og/comprimage-social.png'
const SOCIAL_IMAGE_ALT =
  'Comprimage logo with the message “Private image tools. Nothing uploaded.” and a list of image tools'

/** One question/answer pair, rendered visibly *and* emitted as FAQPage JSON-LD. */
export interface FaqEntry {
  question: string
  answer: string
}

interface SeoOptions {
  path: string
  title: string
  description: string
  noIndex?: boolean
  /** Short label for this page in the breadcrumb trail; omit on the home page. */
  breadcrumb?: string
  /** Must be the same array the page renders through <ToolGuide>. */
  faq?: Array<FaqEntry>
}

function canonicalFor(path: string) {
  return path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`
}

function jsonLdScript(data: unknown) {
  return { type: 'application/ld+json', children: JSON.stringify(data) }
}

export function createSeoHead({
  path,
  title,
  description,
  noIndex = false,
  breadcrumb,
  faq,
}: SeoOptions) {
  const canonical = canonicalFor(path)
  const socialImage = `${SITE_URL}${SOCIAL_IMAGE_PATH}`

  // Structured data is derived from the same inputs as the meta tags and the
  // rendered copy, so the two can never drift apart.
  const scripts = []
  if (breadcrumb) {
    scripts.push(jsonLdScript(createBreadcrumbJsonLd(path, breadcrumb)))
  }
  if (faq?.length) {
    scripts.push(jsonLdScript(createFaqJsonLd(faq)))
  }

  return {
    meta: [
      { title },
      { name: 'description', content: description },
      {
        name: 'robots',
        content: noIndex
          ? 'noindex, follow'
          : 'index, follow, max-image-preview:large',
      },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'Comprimage' },
      { property: 'og:locale', content: 'en_US' },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: canonical },
      { property: 'og:image', content: socialImage },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:type', content: 'image/png' },
      { property: 'og:image:alt', content: SOCIAL_IMAGE_ALT },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: socialImage },
      { name: 'twitter:image:alt', content: SOCIAL_IMAGE_ALT },
    ],
    links: [{ rel: 'canonical', href: canonical }],
    ...(scripts.length ? { scripts } : {}),
  }
}

export function createBreadcrumbJsonLd(path: string, name: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${SITE_URL}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name,
        item: canonicalFor(path),
      },
    ],
  }
}

export function createFaqJsonLd(faq: Array<FaqEntry>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  }
}

const PUBLISHER_ID = `${SITE_URL}/#author`

/**
 * Home-page graph: the site, the application it hosts, and who publishes both.
 * A single @graph keeps the nodes cross-referenced by @id rather than repeating
 * them as disconnected objects.
 */
export const SITE_JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Person',
      '@id': PUBLISHER_ID,
      name: 'Rifki Fajar Ramadhani',
      url: `${SITE_URL}/`,
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: 'Comprimage',
      url: `${SITE_URL}/`,
      description:
        'Private image compression, resizing, and format conversion in your browser.',
      inLanguage: 'en',
      publisher: { '@id': PUBLISHER_ID },
    },
    {
      '@type': 'WebApplication',
      '@id': `${SITE_URL}/#webapp`,
      name: 'Comprimage',
      url: `${SITE_URL}/`,
      description:
        'Compress, resize, and convert images entirely in the browser with MozJPEG, WebP, AVIF, OxiPNG, and JPEG XL. Images are never uploaded.',
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Any',
      browserRequirements: 'Requires a browser with WebAssembly support',
      inLanguage: 'en',
      isAccessibleForFree: true,
      publisher: { '@id': PUBLISHER_ID },
      screenshot: `${SITE_URL}${SOCIAL_IMAGE_PATH}`,
      featureList: [
        'Resize images while preserving aspect ratio',
        'Compress images with MozJPEG, WebP, AVIF, OxiPNG, and JPEG XL',
        'Convert between JPG, PNG, WebP, AVIF, and JPEG XL',
        'Batch process multiple images and download them as a ZIP',
        'Side-by-side before and after quality comparison',
        '100% client-side processing with no uploads',
      ],
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    },
  ],
} as const
