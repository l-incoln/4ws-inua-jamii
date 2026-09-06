import { fetchSeoSettings, SITE_URL } from '@/lib/seo'

/**
 * JSON-LD structured data component.
 * Renders <script type="application/ld+json"> tags for Google rich results.
 *
 * Usage:
 *   <JsonLd type="organization" />
 *   <JsonLd type="website" />
 *   <JsonLd type="event" data={{ name, startDate, location, image, url }} />
 *   <JsonLd type="article" data={{ headline, image, datePublished, author }} />
 *   <JsonLd type="breadcrumb" data={{ items: [{ name, url }] }} />
 */

type JsonLdType = 'organization' | 'website' | 'event' | 'article' | 'breadcrumb'

interface EventData {
  name: string
  startDate: string
  endDate?: string
  location?: string
  description?: string
  image?: string
  url: string
  organizer?: string
}

interface ArticleData {
  headline: string
  image?: string
  datePublished: string
  dateModified?: string
  author?: string
  url: string
}

interface BreadcrumbData {
  items: { name: string; url: string }[]
}

interface JsonLdProps {
  type: JsonLdType
  data?: EventData | ArticleData | BreadcrumbData
}

export default async function JsonLd({ type, data }: JsonLdProps) {
  const seo = await fetchSeoSettings()

  let schema: Record<string, any> = {}

  switch (type) {
    case 'organization': {
      const sameAs = [
        seo.facebookUrl,
        seo.twitterUrl,
        seo.instagramUrl,
        seo.youtubeUrl,
        seo.linkedinUrl,
        seo.tiktokUrl,
      ].filter(Boolean)

      schema = {
        '@context': 'https://schema.org',
        '@type': 'NGO',
        name: seo.siteName,
        alternateName: '4WS Inua Jamii Foundation',
        url: SITE_URL,
        logo: seo.logoUrl ?? `${SITE_URL}/icon`,
        description: seo.metaDescription,
        email: seo.contactEmail ?? undefined,
        telephone: seo.contactPhone ?? undefined,
        address: seo.address
          ? { '@type': 'PostalAddress', addressLocality: seo.address, addressCountry: 'KE' }
          : undefined,
        areaServed: 'KE',
        sameAs: sameAs.length > 0 ? sameAs : undefined,
      }
      break
    }

    case 'website': {
      schema = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: seo.siteName,
        url: SITE_URL,
        description: seo.metaDescription,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${SITE_URL}/blog?search={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      }
      break
    }

    case 'event': {
      const d = data as EventData
      schema = {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: d.name,
        startDate: d.startDate,
        endDate: d.endDate,
        description: d.description,
        image: d.image ? [d.image] : undefined,
        url: d.url,
        organizer: {
          '@type': 'NGO',
          name: d.organizer ?? seo.siteName,
          url: SITE_URL,
        },
        location: d.location
          ? { '@type': 'Place', name: d.location }
          : { '@type': 'Place', name: 'TBD' },
      }
      break
    }

    case 'article': {
      const d = data as ArticleData
      schema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: d.headline,
        image: d.image ? [d.image] : undefined,
        datePublished: d.datePublished,
        dateModified: d.dateModified ?? d.datePublished,
        author: d.author
          ? { '@type': 'Person', name: d.author }
          : { '@type': 'Organization', name: seo.siteName },
        publisher: {
          '@type': 'Organization',
          name: seo.siteName,
          logo: { '@type': 'ImageObject', url: seo.logoUrl ?? `${SITE_URL}/icon` },
        },
        url: d.url,
      }
      break
    }

    case 'breadcrumb': {
      const d = data as BreadcrumbData
      schema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: d.items.map((item, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: item.name,
          item: item.url,
        })),
      }
      break
    }
  }

  // Remove undefined values for cleaner output.
  const clean = JSON.parse(JSON.stringify(schema), (_k, v) => (v === undefined ? undefined : v))

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(clean) }}
    />
  )
}
