'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/app/actions/auth'
import {
  LayoutDashboard, Users, CalendarDays, FileText, Heart,
  Settings, LogOut, BarChart3, ShieldCheck, Megaphone,
  FolderOpen, Mail, Target, MessageSquare, ClipboardList,
  CheckSquare, ImageIcon, GalleryHorizontal, Activity, Menu, X,
} from 'lucide-react'
import SiteLogoClient from '@/components/layout/SiteLogoClient'
import GlobalSearch from '@/components/ui/GlobalSearch'

const mainNavItems = [
  { href: '/admin',               label: 'Overview',      icon: LayoutDashboard, exact: true },
  { href: '/admin/members',       label: 'Members',       icon: Users },
  { href: '/admin/events',        label: 'Events',        icon: CalendarDays },
  { href: '/admin/content',       label: 'Blog & Content',icon: FileText },
  { href: '/admin/gallery',       label: 'Gallery',       icon: GalleryHorizontal },
  { href: '/admin/media',         label: 'Media Library', icon: ImageIcon },
  { href: '/admin/documents',     label: 'Documents',     icon: FolderOpen },
  { href: '/admin/announcements', label: 'Announcements', icon: Megaphone },
  { href: '/admin/donations',     label: 'Donations',     icon: Heart },
  { href: '/admin/analytics',     label: 'Analytics',     icon: BarChart3 },
  { href: '/admin/activity',      label: 'Activity Log',  icon: Activity },
]

const communityNavItems = [
  { href: '/admin/campaigns',    label: 'Campaigns',    icon: Target },
  { href: '/admin/applications', label: 'Applications', icon: ClipboardList },
  { href: '/admin/volunteers',   label: 'Volunteers',   icon: CheckSquare },
  { href: '/admin/comments',     label: 'Comments',     icon: MessageSquare },
]

interface Props {
  displayName: string
  initials: string
  unreadMessages: number
}

function AdminNavItem({ href, label, icon: Icon, exact = false, badge }: {
  href: string; label: string; icon: React.ElementType; exact?: boolean; badge?: number
}) {
  const pathname = usePathname()
  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
        isActive
          ? 'bg-primary-700/30 text-primary-300 font-semibold'
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="flex-1">{label}</span>
      {badge != null && badge > 0 && (
        <span className="min-w-[1.25rem] h-5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  )
}

export default function AdminSidebar({ displayName, initials, unreadMessages }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const SidebarContent = () => (
    <>
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

      {/* Search */}
      <div className="px-3 pt-3 pb-1">
        <GlobalSearch />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto" onClick={() => setMobileOpen(false)}>
        <p className="text-xs text-slate-500 uppercase tracking-widest px-3 py-2 mt-1">Management</p>
        {mainNavItems.map(({ href, label, icon, exact }) => (
          <AdminNavItem key={href} href={href} label={label} icon={icon} exact={exact} />
        ))}
        <AdminNavItem href="/admin/messages" label="Messages" icon={Mail} badge={unreadMessages} />

        <p className="text-xs text-slate-500 uppercase tracking-widest px-3 py-2 mt-3">Community</p>
        {communityNavItems.map(({ href, label, icon }) => (
          <AdminNavItem key={href} href={href} label={label} icon={icon} />
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-slate-800 space-y-0.5" onClick={() => setMobileOpen(false)}>
        <AdminNavItem href="/admin/settings" label="Settings"      icon={Settings} exact />
        <AdminNavItem href="/dashboard"      label="Member Portal" icon={LayoutDashboard} exact />
        <form action={signOut}>
          <button type="submit" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-all">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </form>
      </div>
    </>
  )

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800 fixed inset-y-0 left-0 z-40">
        {/* Logo */}
        <div className="p-5 border-b border-slate-800">
          <SiteLogoClient
            subLabel="Admin Panel"
            nameColor="text-white"
            subColor="text-slate-400"
          />
        </div>
        <SidebarContent />
      </aside>

      {/* ── Mobile top bar ── */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-40 bg-slate-900 border-b border-slate-800 h-14 flex items-center justify-between px-4">
        <SiteLogoClient
          subLabel="Admin"
          nameColor="text-white"
          subColor="text-slate-400"
        />
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <aside className="relative flex flex-col w-72 max-w-[85vw] bg-slate-900 h-full shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
              <SiteLogoClient
                subLabel="Admin Panel"
                nameColor="text-white"
                subColor="text-slate-400"
              />
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col flex-1 overflow-y-auto">
              <SidebarContent />
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
