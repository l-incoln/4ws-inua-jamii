import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  FileText,
  Heart,
  Settings,
  LogOut,
  Leaf,
  BarChart3,
  ShieldCheck,
  Megaphone,
} from 'lucide-react'
import { signOut } from '@/app/actions/auth'

const navItems = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/members', label: 'Members', icon: Users },
  { href: '/admin/events', label: 'Events', icon: CalendarDays },
  { href: '/admin/content', label: 'Blog & Content', icon: FileText },
  { href: '/admin/announcements', label: 'Announcements', icon: Megaphone },
  { href: '/admin/donations', label: 'Donations', icon: Heart },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // In production, check role from profiles table
  // const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  // if (profile?.role !== 'admin') redirect('/dashboard')

  const displayName = user.user_metadata?.full_name || 'Administrator'
  const initials = displayName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800 fixed inset-y-0 left-0 z-40">
        {/* Logo */}
        <div className="p-5 border-b border-slate-800">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-bold text-sm text-white leading-none">4W&apos;S Inua Jamii</div>
              <div className="text-xs text-slate-400 leading-none mt-0.5">Admin Panel</div>
            </div>
          </Link>
        </div>

        {/* Admin badge */}
        <div className="mx-4 mt-4 mb-2 p-3 rounded-xl bg-primary-900/30 border border-primary-800/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary-700 flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
            <div>
              <div className="text-xs font-semibold text-white truncate">{displayName}</div>
              <div className="flex items-center gap-1 text-xs text-primary-400">
                <ShieldCheck className="w-3 h-3" /> Administrator
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          <p className="text-xs text-slate-500 uppercase tracking-widest px-3 py-2 mt-1">Management</p>
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all duration-150"
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-slate-800 space-y-0.5">
          <Link href="/admin/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
            <Settings className="w-4 h-4" />
            Settings
          </Link>
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
            <LayoutDashboard className="w-4 h-4" />
            Member Portal
          </Link>
          <form action={signOut}>
            <button type="submit" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-all">
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 lg:ml-64 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}

