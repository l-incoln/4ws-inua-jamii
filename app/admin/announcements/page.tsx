import { createClient } from '@/lib/supabase/server'
import AnnouncementsClient from '@/components/admin/AnnouncementsClient'
import { saveAnnouncement, deleteAnnouncement } from '@/app/actions/admin'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Announcements — Admin' }

export default async function AnnouncementsPage() {
  const supabase = await createClient()

  const { data: announcements } = await supabase
    .from('announcements')
    .select('id, title, body, is_pinned, created_at')
    .order('created_at', { ascending: false })

  return (
    <AnnouncementsClient
      announcements={(announcements ?? []) as any[]}
      saveAnnouncement={saveAnnouncement}
      deleteAnnouncement={deleteAnnouncement}
    />
  )
}
