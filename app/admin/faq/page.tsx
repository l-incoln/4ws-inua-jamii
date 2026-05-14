import { createClient } from '@/lib/supabase/server'
import FaqManagerClient from '@/components/admin/FaqManagerClient'
import { saveFaq, deleteFaq, toggleFaqStatus } from '@/app/actions/admin'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'FAQ Management — Admin' }

export default async function AdminFaqPage() {
  const supabase = await createClient()

  const { data: faqs } = await supabase
    .from('faqs')
    .select('id, question, answer, category, sort_order, is_active, created_at')
    .order('category', { ascending: true })
    .order('sort_order', { ascending: true })

  return (
    <FaqManagerClient
      initialFaqs={(faqs ?? []) as any[]}
      saveFaq={saveFaq}
      deleteFaq={deleteFaq}
      toggleFaqStatus={toggleFaqStatus}
    />
  )
}
