import { Bell, Megaphone, Star } from 'lucide-react'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Activity Feed' }

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor(diff / 3600000)
  const mins = Math.floor(diff / 60000)
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  return `${mins}m ago`
}

export default async function FeedPage() {
  const supabase = await createClient()

  const { data: announcements } = await supabase
    .from('announcements')
    .select('id, title, body, is_pinned, created_at')
    .order('created_at', { ascending: false })
    .limit(20)

  const feed = announcements ?? []

  // Items created in the last 7 days are "new"
  const sevenDaysAgo = Date.now() - 7 * 86400000
  const newCount = feed.filter((a) => new Date(a.created_at).getTime() > sevenDaysAgo).length

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Activity Feed</h1>
          <p className="text-slate-500 text-sm mt-1">
            Foundation updates, announcements, and news.
          </p>
        </div>
        {newCount > 0 && (
          <span className="badge-green">{newCount} new</span>
        )}
      </div>

      <div className="space-y-3">
        {feed.map((item) => {
          const isNew = new Date(item.created_at).getTime() > sevenDaysAgo
          const Icon = item.is_pinned ? Star : Megaphone
          const iconBg = item.is_pinned ? 'bg-sky-100' : 'bg-primary-100'
          const iconColor = item.is_pinned ? 'text-sky-600' : 'text-primary-600'
          return (
            <div
              key={item.id}
              className={`card p-5 flex items-start gap-4 ${isNew ? 'border-l-4 border-primary-500' : ''}`}
            >
              <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                  <div className="flex items-center gap-2 shrink-0">
                    {isNew && (
                      <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />
                    )}
                    <span className="text-xs text-slate-400 whitespace-nowrap">{timeAgo(item.created_at)}</span>
                  </div>
                </div>
                {item.body && (
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">{item.body}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {feed.length === 0 && (
        <div className="card p-12 text-center">
          <Bell className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-slate-400">No updates yet. Check back soon!</p>
        </div>
      )}
    </div>
  )
}

