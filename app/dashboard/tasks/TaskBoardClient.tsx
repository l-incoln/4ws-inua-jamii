'use client'

import { useState, useTransition } from 'react'
import { CheckSquare, Tag, Calendar, User, AlertCircle, CheckCircle } from 'lucide-react'
import { claimTask, unclaimTask, submitTaskCompletion } from '@/app/actions/tasks'
import type { TaskStatus } from '@/types'

interface Claimer { id: string; full_name: string | null }
interface Task {
  id: string
  title: string
  description: string | null
  skills_required: string[]
  deadline: string | null
  status: TaskStatus
  claimed_by: string | null
  claimed_at: string | null
  completed_at: string | null
  created_at: string
  claimer: Claimer | null
}

interface Props {
  tasks: Task[]
  currentUserId: string
  userRole: string
}

type FilterTab = 'available' | 'my-tasks' | 'completed'

const STATUS_STYLES: Record<TaskStatus, string> = {
  open:      'bg-sky-100 text-sky-700',
  claimed:   'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-slate-100 text-slate-500',
}

export default function TaskBoardClient({ tasks: initial, currentUserId, userRole }: Props) {
  const [tasks, setTasks] = useState(initial)
  const [activeTab, setActiveTab] = useState<FilterTab>('available')
  const [isPending, startTransition] = useTransition()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg }); setTimeout(() => setToast(null), 4000)
  }

  function handleClaim(taskId: string) {
    setLoadingId(taskId)
    startTransition(async () => {
      const result = await claimTask(taskId)
      if (result?.error) { showToast('error', result.error); setLoadingId(null); return }
      setTasks((prev) => prev.map((t) => t.id === taskId
        ? { ...t, status: 'claimed', claimed_by: currentUserId, claimed_at: new Date().toISOString(), claimer: { id: currentUserId, full_name: 'You' } }
        : t
      ))
      showToast('success', 'Task claimed! Get to work.')
      setLoadingId(null)
    })
  }

  function handleUnclaim(taskId: string) {
    setLoadingId(taskId)
    startTransition(async () => {
      const result = await unclaimTask(taskId)
      if (result?.error) { showToast('error', result.error); setLoadingId(null); return }
      setTasks((prev) => prev.map((t) => t.id === taskId
        ? { ...t, status: 'open', claimed_by: null, claimed_at: null, claimer: null }
        : t
      ))
      showToast('success', 'Task unclaimed.')
      setLoadingId(null)
    })
  }

  function handleComplete(taskId: string) {
    setLoadingId(taskId)
    startTransition(async () => {
      const result = await submitTaskCompletion(taskId)
      if (result?.error) { showToast('error', result.error); setLoadingId(null); return }
      setTasks((prev) => prev.map((t) => t.id === taskId
        ? { ...t, status: 'completed', completed_at: new Date().toISOString() }
        : t
      ))
      showToast('success', 'Task marked as completed. Thank you!')
      setLoadingId(null)
    })
  }

  const available  = tasks.filter((t) => t.status === 'open')
  const myTasks    = tasks.filter((t) => t.status === 'claimed' && t.claimed_by === currentUserId)
  const completed  = tasks.filter((t) => t.status === 'completed')

  const displayTasks: Task[] = {
    available,
    'my-tasks': myTasks,
    completed,
  }[activeTab]

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'available', label: 'Available',  count: available.length },
    { key: 'my-tasks',  label: 'My Tasks',   count: myTasks.length },
    { key: 'completed', label: 'Completed',  count: completed.length },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Volunteer Tasks</h1>
        <p className="text-slate-500 text-sm mt-1">Claim tasks and contribute to the community</p>
      </div>

      {toast && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${
          toast.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {tabs.map(({ key, label, count }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === key ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {label}
            {count > 0 && (
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === key ? 'bg-primary-100 text-primary-700' : 'bg-slate-200 text-slate-500'
              }`}>{count}</span>
            )}
          </button>
        ))}
      </div>

      {displayTasks.length === 0 && (
        <div className="card p-12 text-center text-slate-400">
          <CheckSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">
            {activeTab === 'available' ? 'No tasks available right now' :
             activeTab === 'my-tasks' ? "You haven't claimed any tasks" :
             'No completed tasks yet'}
          </p>
          {activeTab === 'my-tasks' && available.length > 0 && (
            <button onClick={() => setActiveTab('available')} className="btn-primary text-sm mt-4">Browse Available Tasks</button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayTasks.map((t) => {
          const isLoading = isPending && loadingId === t.id
          const isMine = t.claimed_by === currentUserId
          const deadlinePassed = t.deadline ? new Date(t.deadline) < new Date() : false

          return (
            <div key={t.id} className={`card p-5 space-y-3 ${t.status === 'completed' ? 'opacity-80' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-slate-900 text-sm flex-1">{t.title}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_STYLES[t.status]}`}>
                  {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                </span>
              </div>

              {t.description && (
                <p className="text-sm text-slate-600 leading-relaxed">{t.description}</p>
              )}

              <div className="flex flex-wrap gap-2">
                {t.skills_required?.map((skill) => (
                  <span key={skill} className="flex items-center gap-1 text-xs bg-sky-50 text-sky-700 px-2.5 py-1 rounded-full">
                    <Tag className="w-3 h-3" />{skill}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400">
                {t.deadline && (
                  <span className={`flex items-center gap-1 ${deadlinePassed && t.status !== 'completed' ? 'text-red-500' : ''}`}>
                    <Calendar className="w-3.5 h-3.5" />
                    Due: {new Date(t.deadline).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
                  </span>
                )}
                {t.claimer && !isMine && (
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    {t.claimer.full_name ?? 'Someone'} is working on this
                  </span>
                )}
                {t.completed_at && (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Done {new Date(t.completed_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
                  </span>
                )}
              </div>

              {/* Actions */}
              {t.status === 'open' && (
                <button
                  onClick={() => handleClaim(t.id)}
                  disabled={isLoading}
                  className="w-full py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Claiming…' : 'Claim This Task'}
                </button>
              )}
              {t.status === 'claimed' && isMine && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleComplete(t.id)}
                    disabled={isLoading}
                    className="flex-1 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <CheckSquare className="w-4 h-4" />
                    {isLoading ? 'Saving…' : 'Mark Done'}
                  </button>
                  <button
                    onClick={() => handleUnclaim(t.id)}
                    disabled={isLoading}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium transition-colors"
                  >
                    Unclaim
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
