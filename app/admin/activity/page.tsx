import { createClient } from '@/lib/supabase/server'
import { Activity, User, FileText, Image, Calendar, Bell, Shield } from 'lucide-react'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Activity Log | Admin' }

const ACTION_META: Record<string, { icon: React.ElementType; color: string }> = {
  'insert': { icon: FileText, color: 'text-green-600 bg-green-50' },
  'update': { icon: FileText, color: 'text-blue-600 bg-blue-50' },
  'delete': { icon: FileText, color: 'text-red-600 bg-red-50' },
  'login':  { icon: User,     color: 'text-purple-600 bg-purple-50' },
  'upload': { icon: Image,    color: 'text-sky-600 bg-sky-50' },
  'rsvp':   { icon: Calendar, color: 'text-amber-600 bg-amber-50' },
  'badge':  { icon: Shield,   color: 'text-orange-600 bg-orange-50' },
  'notify': { icon: Bell,     color: 'text-teal-600 bg-teal-50' },
}

function getActionMeta(action: string) {
  return ACTION_META[action] ?? { icon: Activity, color: 'text-slate-600 bg-slate-50' }
}

export default async function ActivityLogPage() {
  const supabase = await createClient()

  const { data: logs } = await supabase
    .from('activity_logs')
    .select('id, user_id, action, entity_type, entity_id, metadata, created_at, profiles(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Activity Log</h1>
        <p className="text-slate-500 text-sm mt-1">Last 100 events across the platform</p>
      </div>

      {(!logs || logs.length === 0) ? (
        <div className="card p-12 text-center">
          <Activity className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No activity logged yet</p>
          <p className="text-slate-400 text-sm mt-1">Activity will appear here once the migrations have been applied.</p>
        </div>
      ) : (
        <div className="card divide-y divide-slate-100 overflow-hidden">
          {(logs as any[]).map((log) => {
            const meta = getActionMeta(log.action)
            const Icon = meta.icon
            const profile = log.profiles as { full_name: string | null; email: string } | null
            const label = profile?.full_name ?? profile?.email ?? 'System'
            const date = new Date(log.created_at).toLocaleString('en-KE', {
              dateStyle: 'medium', timeStyle: 'short',
            })
            return (
              <div key={log.id} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${meta.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-800">{label}</span>
                    <span className="badge text-xs capitalize">{log.action}</span>
                    {log.entity_type && (
                      <span className="text-xs text-slate-400">{log.entity_type}</span>
                    )}
                  </div>
                  {log.metadata && (
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {typeof log.metadata === 'object' ? JSON.stringify(log.metadata) : String(log.metadata)}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-0.5">{date}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
