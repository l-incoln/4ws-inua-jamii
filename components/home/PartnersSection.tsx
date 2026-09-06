import Image from 'next/image'

type Partner = {
  id: string
  name: string
  logo_url: string | null
  website_url: string | null
  description?: string | null
  valid_from?: string | null
  valid_until?: string | null
}

export default function PartnersSection({
  partners,
  title = 'Our Partners & Sponsors',
}: {
  partners: Partner[]
  title?: string
}) {
  if (partners.length === 0) return null

  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="badge-green text-xs uppercase tracking-widest mb-4 inline-block">
            Working Together
          </span>
          <h2 className="section-title">{title}</h2>
          <p className="section-subtitle mx-auto mt-3">
            We are proud to work alongside organisations that share our commitment to lasting community impact.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
          {partners.map((partner) => {
            const inner = partner.logo_url ? (
              <div className="h-32 w-full relative flex items-center justify-center rounded-2xl bg-white shadow-md border border-slate-100 p-5 hover:shadow-lg hover:border-primary-200 transition-all duration-300">
                <Image
                  src={partner.logo_url}
                  alt={partner.name}
                  fill
                  className="object-contain p-5 transition-transform duration-300 hover:scale-105"
                  unoptimized
                />
              </div>
            ) : (
              <div className="h-32 w-full flex items-center justify-center rounded-2xl border-2 border-slate-200 bg-white shadow-sm hover:border-primary-400 hover:shadow-md transition-all duration-300 px-5">
                <span className="text-lg font-bold text-slate-700 hover:text-primary-700 transition-colors text-center">
                  {partner.name}
                </span>
              </div>
            )

            const card = (
              <div className="text-center">
                {inner}
                <div className="mt-3">
                  <div className="text-sm font-semibold text-slate-800">{partner.name}</div>
                  {partner.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{partner.description}</p>
                  )}
                </div>
              </div>
            )

            if (partner.website_url) {
              return (
                <a
                  key={partner.id}
                  href={partner.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={partner.name}
                  className="block transition-transform duration-200 hover:scale-105"
                >
                  {card}
                </a>
              )
            }

            return (
              <div key={partner.id} title={partner.name}>
                {card}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
