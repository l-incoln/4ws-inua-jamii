import Image from 'next/image'

type Partner = {
  id: string
  name: string
  logo_url: string | null
  website_url: string | null
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
    <section className="py-16 md:py-24 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="badge-green text-xs uppercase tracking-widest mb-3 inline-block">
            Working Together
          </span>
          <h2 className="section-title">{title}</h2>
          <p className="section-subtitle mx-auto mt-3">
            We are proud to work alongside organisations that share our commitment to lasting community impact.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14">
          {partners.map((partner) => {
            const inner = partner.logo_url ? (
              <div className="h-20 w-44 relative flex items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-100 p-3 hover:shadow-md hover:border-primary-200 transition-all duration-300">
                <Image
                  src={partner.logo_url}
                  alt={partner.name}
                  fill
                  className="object-contain p-3 transition-transform duration-300 hover:scale-105"
                  unoptimized
                />
              </div>
            ) : (
              <div className="px-7 py-4 rounded-2xl border-2 border-slate-200 bg-white shadow-sm hover:border-primary-400 hover:shadow-md transition-all duration-300">
                <span className="text-base font-bold text-slate-700 hover:text-primary-700 transition-colors">
                  {partner.name}
                </span>
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
