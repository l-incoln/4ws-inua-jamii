import Image from 'next/image'

type Partner = {
  id: string
  name: string
  logo_url: string | null
  website_url: string | null
}

export default function PartnersSection({
  partners,
  title = 'Our Partners & Supporters',
}: {
  partners: Partner[]
  title?: string
}) {
  if (partners.length === 0) return null

  return (
    <section className="py-12 bg-white border-y border-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-400 mb-8">
          {title}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {partners.map((partner) => {
            const inner = partner.logo_url ? (
              <div className="h-12 w-32 relative flex items-center justify-center">
                <Image
                  src={partner.logo_url}
                  alt={partner.name}
                  fill
                  className="object-contain grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100"
                  unoptimized
                />
              </div>
            ) : (
              <span className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">
                {partner.name}
              </span>
            )

            if (partner.website_url) {
              return (
                <a
                  key={partner.id}
                  href={partner.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={partner.name}
                >
                  {inner}
                </a>
              )
            }

            return (
              <div key={partner.id} title={partner.name}>
                {inner}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
