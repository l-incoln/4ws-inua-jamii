import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Under Maintenance' }

export default async function MaintenancePage() {
  const supabase = await createClient()
  const { data: siteName } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'site_name')
    .single()

  const name = siteName?.value ?? '4W\'S Inua Jamii Foundation'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-slate-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-primary-600 flex items-center justify-center shadow-lg">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.737-.483L22 7.5m-5.5 3.5l2.5-2.5m-9.5 5.5l-2.5 2.5m11-11l-3.5-3.5" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">We&apos;ll be right back</h1>
        <p className="text-slate-500 text-sm leading-relaxed">
          {name} is undergoing scheduled maintenance to improve your experience.
          We expect to be back shortly. Thank you for your patience.
        </p>
        <div className="mt-6 text-xs text-slate-400">
          If you&apos;re an administrator, you can{' '}
          <a href="/admin" className="text-primary-600 hover:underline font-medium">log in here</a>.
        </div>
      </div>
    </div>
  )
}
