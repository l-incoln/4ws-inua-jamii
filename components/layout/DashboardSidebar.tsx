'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/app/actions/auth'
import {
  LayoutDashboard, User, CalendarCheck, Rss, Heart,
  CheckSquare, CreditCard, Trophy, FolderOpen, Settings,
  Bell, LogOut, ExternalLink,
} from 'lucide-react'
import SiteLogoClient from '@/components/layout/SiteLogoClient'

const navItems = [
  { href: '/dashboard',                label: 'Dashboard',      icon: LayoutDashboard, exact: true },
  { href: '/dashboard/profile',        label: 'My Profile',     icon: User },
  { href: '/dashboard/events',         label: 'My Events',      icon: CalendarCheck },
  { href: '/dashboard/feed',           label: 'Activity Feed',  icon: Rss },
  { href: '/dashboard/donations',      label: 'My Donations',   icon: Heart },
  { href: '/dashboard/tasks',          label: 'Volunteer Tasks',icon: CheckSquare },
  { href: '/dashboard/membership-card',label: 'Membership Card',icon: CreditCard },
  { href: '/dashboard/achievements',   label: 'Achievements',   icon: Trophy },
  { href: '/dashboard/resources',      label: 'Resources',      icon: FolderOpen },
]

const RESTRICTED_HREFS = ['/dashboard/membership-card', '/dashboard/achievements', '/dashboard/tasks']

const mobileNavItems = [
  { href: '/dashboard',                label: 'Home',         icon: LayoutDashboard, exact: true },
  { href: '/dashboard/profile',        label: 'Profile',      icon: User },
  { href: '/dashboard/events',         label: 'Events',       icon: CalendarCheck },
  { href: '/dashboard/feed',           label: 'Feed',         icon: Rss },
  { href: '/dashboard/donations',      label: 'Donations',    icon: Heart },
  { href: '/dashboard/tasks',          label: 'Tasks',        icon: CheckSquare },
  { href: '/dashboard/membership-card',label: 'Card',         icon: CreditCard },
  { href: '/dashboard/achievements',   label: 'Awards',       icon: Trophy },
  { href: '/dashboard/resources',      label: 'Resources',    icon: FolderOpen },
  { href: '/dashboard/notifications',  label: 'Alerts',       icon: Bell, badge: true },
  { href: '/dashboard/settings',       label: 'Settings',     icon: Settings },
]

interface Props {
  displayName: string
  email: string
  initials: string
  unread: number
  isPending?: boolean
}

function NavItem({ href, label, icon: Icon, exact = false, badge }: {
  href: string; label: string; icon: React.ElementType; exact?: boolean; badge?: number
}) {
  const pathname = usePathname()
  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
        isActive
          ? 'bg-primary-50 text-primary-700 font-semibold'
          : 'text-slate-600 hover:bg-gray-50 hover:text-slate-900'
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

function MobileNavItem({
  href,
  label,
  icon: Icon,
  exact = false,
  unread = 0,
  disabled = false,
}: {
  href: string
  label: string
  icon: React.ElementType
  exact?: boolean
  unread?: number
  disabled?: boolean
}) {
  const pathname = usePathname()
  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')

  const labelEl = (
    <span className="text-[10px] leading-tight text-center w-full px-0.5 truncate">{label}</span>
  )

  const iconEl = (
    <div className="relative">
      <Icon className="w-5 h-5" />
      {unread > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[1.1rem] h-4 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </div>
  )

  if (disabled) {
    return (
      <span
        title="Available after membership is approved"
        className="min-w-[4.5rem] flex-1 flex flex-col items-center gap-0.5 py-3 text-slate-300 cursor-not-allowed select-none"
      >
        {iconEl}
        {labelEl}
      </span>
    )
  }

  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={`min-w-[4.5rem] flex-1 flex flex-col items-center gap-0.5 py-3 transition-colors ${
        isActive ? 'text-primary-600' : 'text-slate-500 hover:text-primary-600'
      }`}
    >
      {iconEl}
      {labelEl}
    </Link>
  )
}

export default function DashboardSidebar({ displayName, email, initials, unread, isPending = false }: Props) {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-100 fixed inset-y-0 left-0 z-40">
        {/* Logo */}
        <div className="p-6 border-b border-gray-100">
          <SiteLogoClient subLabel="Member Portal" />
        </div>

        {/* User info */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
              {initials}
            </div>
            <div className="overflow-hidden">
              <div className="font-semibold text-sm text-slate-900 truncate">{displayName}</div>
              <div className="text-xs text-slate-400 truncate">{email}</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            // Restrict sensitive pages for pending members
            const restricted = isPending && ['/dashboard/membership-card', '/dashboard/achievements', '/dashboard/tasks'].includes(href)
            if (restricted) return (
              <span key={href} title="Available after membership is approved" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 cursor-not-allowed select-none">
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{label}</span>
                <span className="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full font-semibold">Pending</span>
              </span>
            )
            return <NavItem key={href} href={href} label={label} icon={Icon} exact={exact} />
          })}
          <NavItem href="/dashboard/notifications" label="Notifications" icon={Bell} exact badge={unread} />
        </nav>

        {/* Bottom */}
        <div className="p-4 border-t border-gray-100 space-y-0.5">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-500 hover:bg-gray-50 hover:text-slate-700 transition-all"
          >
            <ExternalLink className="w-4 h-4 shrink-0" />
            Back to Website
          </Link>
          <NavItem href="/dashboard/settings" label="Settings" icon={Settings} />
          <form action={signOut}>
            <button type="submit" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 hover:text-red-600 transition-all w-full text-left">
              <LogOut className="w-4 h-4 shrink-0" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile top bar — matches pt-[calc(4rem+env(safe-area-inset-top))] */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 min-h-16 pt-[env(safe-area-inset-top)] bg-white border-b border-gray-100 px-4 flex items-center justify-between">
        <SiteLogoClient subLabel="Member Portal" maxSize={36} />
        <div className="flex items-center gap-3">
          <Link href="/dashboard/notifications" className="relative p-1.5 rounded-lg text-slate-500 hover:bg-gray-100 transition-colors">
            <Bell className="w-5 h-5" />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </Link>
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs">
            {initials}
          </div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 flex overflow-x-auto scrollbar-hide min-h-16 pb-[env(safe-area-inset-bottom)]">
        {mobileNavItems.map(({ href, label, icon, exact, badge }) => {
          const disabled = isPending && RESTRICTED_HREFS.includes(href)
          return (
            <MobileNavItem
              key={href}
              href={href}
              label={label}
              icon={icon}
              exact={exact}
              unread={badge ? unread : 0}
              disabled={disabled}
            />
          )
        })}
      </nav>
    </>
  )
}
