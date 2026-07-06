// Canonical origin + name for the deployed site. Used to build absolute URLs for
// canonical/Open Graph tags and the generated sitemap. Kept dependency-free so it
// can be imported from both app code and the Node build script (generate-sitemap).
export const SITE_URL = 'https://comprimage.rifkiramadhani.my.id'
export const SITE_NAME = 'Comprimage'

// Join SITE_URL with a route path, tolerating a leading slash or not.
// '/' maps to the bare origin; '/resize' → '<origin>/resize'.
export function absUrl(path: string): string {
  if (path === '/' || path === '') return `${SITE_URL}/`
  return `${SITE_URL}/${path.replace(/^\//, '')}`
}

// Build a route `head()` fragment: unique title + description, a self-referential
// canonical link, and og/twitter overrides. Merges over the root head (which sets
// the shared og:type/og:site_name/og:image + twitter:card), so each URL gets its
// own title/description/canonical while inheriting the shared social defaults.
export function seo(opts: {
  path: string
  title: string
  description: string
}) {
  const url = absUrl(opts.path)
  return {
    meta: [
      { title: opts.title },
      { name: 'description', content: opts.description },
      { property: 'og:title', content: opts.title },
      { property: 'og:description', content: opts.description },
      { property: 'og:url', content: url },
      { name: 'twitter:title', content: opts.title },
      { name: 'twitter:description', content: opts.description },
    ],
    links: [{ rel: 'canonical', href: url }],
  }
}
