import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminSidebar from '@/components/layout/AdminSidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const displayName = profile?.full_name || user.user_metadata?.full_name || 'Administrator'
  const initials = displayName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()

  // Fetch sidebar badge counts in parallel
  const [{ count: unreadMessages }, { count: pendingNotifications }] = await Promise.all([
    supabase.from('contact_messages').select('id', { count: 'exact', head: true }).eq('is_read', false),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('membership_status', 'pending'),
  ])

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <AdminSidebar
        displayName={displayName}
        initials={initials}
        unreadMessages={unreadMessages ?? 0}
        pendingNotifications={pendingNotifications ?? 0}
      />

      {/* Main content */}
      <main className="flex-1 lg:ml-64 min-h-screen bg-gray-50 pt-14 lg:pt-0">
        <div className="max-w-7xl mx-auto p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
