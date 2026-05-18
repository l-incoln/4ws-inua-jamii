'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Activity, User, FileText, Image, Calendar, Bell, Shield, Download, Archive, CheckCircle, Settings2, CreditCard } from 'lucide-react'

type LogEntry = {
  id: string
  user_id: string
  action: string
  entity_type: string | null
  entity_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  profiles: { full_name: string | null; email: string } | null
}

const ACTION_META: Record<string, { icon: React.ElementType; color: string }> = {
  insert:            { icon: FileText,     color: 'text-green-600 bg-green-50' },
  create:            { icon: FileText,     color: 'text-green-600 bg-green-50' },
  update:            { icon: FileText,     color: 'text-blue-600 bg-blue-50' },
  delete:            { icon: FileText,     color: 'text-red-600 bg-red-50' },
  login:             { icon: User,         color: 'text-purple-600 bg-purple-50' },
  upload:            { icon: Image,        color: 'text-sky-600 bg-sky-50' },
  rsvp:              { icon: Calendar,     color: 'text-amber-600 bg-amber-50' },
  badge:             { icon: Shield,       color: 'text-orange-600 bg-orange-50' },
  notify:            { icon: Bell,         color: 'text-teal-600 bg-teal-50' },
  approve:           { icon: CheckCircle,  color: 'text-emerald-600 bg-emerald-50' },
  reject:            { icon: User,         color: 'text-red-600 bg-red-50' },
  issue:             { icon: CreditCard,   color: 'text-indigo-600 bg-indigo-50' },
  archive:           { icon: Archive,      color: 'text-slate-600 bg-slate-100' },
  unarchive:         { icon: Archive,      color: 'text-slate-500 bg-slate-50' },
  settings:          { icon: Settings2,    color: 'text-violet-600 bg-violet-50' },
  payment_confirmed: { icon: CreditCard,   color: 'text-emerald-600 bg-emerald-50' },
}

function getActionMeta(action: string) {
  return ACTION_META[action] ?? { icon: Activity, color: 'text-slate-600 bg-slate-50' }
}

export default function ActivityLogClient({
  logs,
  uniqueActions,
  currentAction,
  currentEntity,
}: {
  logs: LogEntry[]
  uniqueActions: string[]
  currentAction: string | null
  currentEntity: string | null
}) {
  const router = useRouter()

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams()
    if (key !== 'action' && currentAction) params.set('action', currentAction)
    if (key !== 'entity' && currentEntity) params.set('entity', currentEntity)
    if (value) params.set(key, value)
    router.push('/admin/activity' + (params.toString() ? '?' + params.toString() : ''))
  }

  const handleExport = () => {
    const header = 'Timestamp,User,Action,Entity Type,Entity ID,Metadata\n'
    const rows = logs.map((log) => {
      const user = log.profiles?.full_name ?? log.profiles?.email ?? log.user_id
      const meta = log.metadata ? JSON.stringify(log.metadata).replace(/"/g, '""') : ''
      return `"${log.created_at}","${user}","${log.action}","${log.entity_type ?? ''}","${log.entity_id ?? ''}","${meta}"`
    })
    const csv = header + rows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `activity-log-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Activity Log</h1>
          <p className="text-slate-500 text-sm mt-1">All admin and platform activity ({logs.length} records)</p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={currentAction ?? ''}
          onChange={(e) => setFilter('action', e.target.value)}
          className="input text-sm w-auto pr-8"
        >
          <option value="">All Actions</option>
          {uniqueActions.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Filter by entity type…"
          defaultValue={currentEntity ?? ''}
          className="input text-sm w-48"
          onBlur={(e) => setFilter('entity', e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') setFilter('entity', (e.target as HTMLInputElement).value) }}
        />
        {(currentAction || currentEntity) && (
          <button
            onClick={() => router.push('/admin/activity')}
            className="text-xs text-red-500 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {logs.length === 0 ? (
        <div className="card p-12 text-center">
          <Activity className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No activity logged yet</p>
          <p className="text-slate-400 text-sm mt-1">Activity will appear here as admins make changes.</p>
        </div>
      ) : (
        <div className="card divide-y divide-slate-100 overflow-hidden">
          {logs.map((log) => {
            const meta = getActionMeta(log.action)
            const Icon = meta.icon
            const profile = log.profiles
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
                    <p className="text-xs text-slate-500 mt-0.5 break-all line-clamp-2">
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
