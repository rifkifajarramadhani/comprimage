export const SITE_URL = 'https://comprimage.rifkiramadhani.my.id'

const SOCIAL_IMAGE_PATH = '/og/comprimage-social.png'
const SOCIAL_IMAGE_ALT =
  'Comprimage — private image tools with nothing uploaded'

interface SeoOptions {
  path: string
  title: string
  description: string
  noIndex?: boolean
}

export function createSeoHead({
  path,
  title,
  description,
  noIndex = false,
}: SeoOptions) {
  const canonical = path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`
  const socialImage = `${SITE_URL}${SOCIAL_IMAGE_PATH}`

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
  }
}

export const WEBSITE_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Comprimage',
  url: `${SITE_URL}/`,
  description:
    'Private image compression, resizing, and format conversion in your browser.',
} as const
