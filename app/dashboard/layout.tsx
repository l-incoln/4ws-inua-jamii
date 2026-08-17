import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import DashboardSidebar from '@/components/layout/DashboardSidebar'
import MembershipPaymentButton from '@/components/dashboard/MembershipPaymentButton'
import { createClient } from '@/lib/supabase/server'
import { AlertTriangle, Clock, CheckCircle, Settings, Bell, LogOut } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Fetch profile including membership status and payment info
  const { data: profile } = await supabase
    .from('profiles')
    .select('membership_status, payment_confirmed, payment_reference, tier, selected_tier, phone')
    .eq('id', user.id)
    .single()

  // Fetch unread notification count
  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('read', false)

  const unread = unreadCount ?? 0

  const displayName = user.user_metadata?.full_name || user.email || 'Member'
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const membershipStatus  = profile?.membership_status ?? 'pending'
  const paymentConfirmed  = profile?.payment_confirmed ?? false
  const isPending         = membershipStatus === 'pending'
  const isRejected        = membershipStatus === 'rejected'

  // Rejected members can only access settings (to delete account) and notifications
  const headersList = await headers()
  const currentPath = headersList.get('x-path') ?? ''
  const rejectedAllowedPaths = ['/dashboard/settings', '/dashboard/notifications']
  const isRejectedAndBlocked = isRejected && !rejectedAllowedPaths.some((p) => currentPath.startsWith(p))

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DashboardSidebar
        displayName={displayName}
        email={user.email ?? ''}
        initials={initials}
        unread={unread}
        isPending={isPending}
      />

      {/* Main content */}
      <main className="flex-1 lg:ml-64 pt-[calc(4rem+env(safe-area-inset-top))] lg:pt-0 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0">
        <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-4">
          {/* Pending member banner */}
          {isPending && !paymentConfirmed && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
              <Clock className="w-5 h-5 mt-0.5 flex-shrink-0 text-amber-500" />
              <div className="flex-1">
                <p className="font-semibold text-sm">Membership Pending Approval</p>
                <p className="text-xs mt-0.5">
                  Your application is awaiting review. Pay your membership fee via M-Pesa below to speed up activation, or pay via bank transfer and send proof to our admin team. Full access will be granted after approval.
                </p>
                <MembershipPaymentButton phone={profile?.phone ?? null} />
              </div>
            </div>
          )}
          {isPending && paymentConfirmed && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800">
              <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-blue-500" />
              <div>
                <p className="font-semibold text-sm">Payment Received — Awaiting Admin Approval</p>
                <p className="text-xs mt-0.5">Your payment has been recorded. An admin will review and activate your membership shortly.</p>
              </div>
            </div>
          )}
          {isRejected && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800">
              <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-500" />
              <div>
                <p className="font-semibold text-sm">Membership Application Not Approved</p>
                <p className="text-xs mt-0.5">Your membership application was not approved. Please contact our team for more information.</p>
              </div>
            </div>
          )}
          {/* Rejected members: block access to dashboard content except settings & notifications */}
          {isRejectedAndBlocked ? (
            <div className="max-w-lg mx-auto mt-12 text-center space-y-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Access Restricted</h1>
                <p className="text-slate-500 mt-2 text-sm">
                  Your membership application was not approved. You can still access your settings to update your
                  information or delete your account, or view your notifications.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/dashboard/settings"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Account Settings
                </Link>
                <Link
                  href="/dashboard/notifications"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors"
                >
                  <Bell className="w-4 h-4" />
                  Notifications
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          ) : (
            children
          )}
        </div>
      </main>
    </div>
  )
}

