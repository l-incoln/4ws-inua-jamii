import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  LayoutDashboard,
  User,
  CalendarCheck,
  Rss,
  LogOut,
  Leaf,
  Settings,
  Bell,
} from 'lucide-react'
import { signOut } from '@/app/actions/auth'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/profile', label: 'My Profile', icon: User },
  { href: '/dashboard/events', label: 'My Events', icon: CalendarCheck },
  { href: '/dashboard/feed', label: 'Activity Feed', icon: Rss },
]

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const displayName = user.user_metadata?.full_name || user.email || 'Member'
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-100 fixed inset-y-0 left-0 z-40">
        {/* Logo */}
        <div className="p-6 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900 leading-none">4W&apos;S Inua Jamii</div>
              <div className="text-xs text-primary-600 leading-none mt-0.5">Member Portal</div>
            </div>
          </Link>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
              {initials}
            </div>
            <div className="overflow-hidden">
              <div className="font-semibold text-sm text-slate-900 truncate">{displayName}</div>
              <div className="text-xs text-slate-400 truncate">{user.email}</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="sidebar-link">
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="p-4 border-t border-gray-100 space-y-1">
          <Link href="/dashboard/settings" className="sidebar-link">
            <Settings className="w-4 h-4" />
            Settings
          </Link>
          <form action={signOut}>
            <button type="submit" className="sidebar-link w-full text-left text-red-500 hover:bg-red-50 hover:text-red-600">
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
            <Leaf className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-sm text-slate-900">Member Portal</span>
        </Link>
        <div className="flex items-center gap-3">
          <button className="p-1.5 rounded-lg text-slate-500 hover:bg-gray-100 transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs">
            {initials}
          </div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 flex">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-slate-500 hover:text-primary-600 transition-colors"
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs">{label}</span>
          </Link>
        ))}
      </nav>

      {/* Main content */}
      <main className="flex-1 lg:ml-64 pt-16 lg:pt-0 pb-20 lg:pb-0">
        <div className="max-w-5xl mx-auto p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}

