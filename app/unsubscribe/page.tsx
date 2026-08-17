import Navbar from '@/components/layout/NavbarWrapper'
import Footer from '@/components/layout/Footer'
import UnsubscribeForm from './UnsubscribeForm'

export const dynamic = 'force-dynamic'

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const params = await searchParams
  const email = params.email ?? ''

  return (
    <>
      <Navbar />
      <main className="pt-20 min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <UnsubscribeForm initialEmail={email} />
        </div>
      </main>
      <Footer />
    </>
  )
}
