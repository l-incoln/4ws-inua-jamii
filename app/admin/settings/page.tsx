import { createClient } from '@/lib/supabase/server'
import AdminSettingsClient from '@/components/admin/AdminSettingsClient'
import { saveSiteSettings, saveImpactMetric, uploadSiteImage, saveLeadershipMember, deleteLeadershipMember } from '@/app/actions/admin'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Settings — Admin' }

export default async function AdminSettingsPage() {
  const supabase = await createClient()

  const [settingsResult, metricsResult, leadershipResult, galleryResult, mediaResult] = await Promise.all([
    supabase.from('site_settings').select('key, value'),
    supabase.from('impact_metrics').select('id, label, value, unit, sort_order').order('sort_order'),
    supabase.from('leadership_team').select('id, name, role, bio, image_url, sort_order, is_active').order('sort_order'),
    supabase.from('gallery_items').select('id, image_url, title').not('image_url', 'is', null).order('created_at', { ascending: false }).limit(100),
    supabase.from('media_assets').select('id, url, title, file_name').eq('file_type', 'image').order('created_at', { ascending: false }).limit(200),
  ])

  // Convert array to key-value map
  const settings: Record<string, string> = {}
  for (const row of settingsResult.data ?? []) {
    settings[row.key] = row.value ?? ''
  }

  return (
    <AdminSettingsClient
      settings={settings}
      metrics={(metricsResult.data ?? []) as any[]}
      leadership={(leadershipResult.data ?? []) as any[]}
      galleryItems={(galleryResult.data ?? []) as { id: string; image_url: string; title: string | null }[]}
      mediaItems={(mediaResult.data ?? []).map((m: any) => ({ id: m.id, image_url: m.url, title: m.title || m.file_name || null })) as { id: string; image_url: string; title: string | null }[]}
      saveSiteSettings={saveSiteSettings}
      saveImpactMetric={saveImpactMetric}
      uploadSiteImage={uploadSiteImage}
      saveLeadershipMember={saveLeadershipMember}
      deleteLeadershipMember={deleteLeadershipMember}
    />
  )
}
