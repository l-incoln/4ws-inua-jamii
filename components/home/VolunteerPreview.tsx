import Link from 'next/link'
import { ArrowRight, HandHeart, Clock, Tag } from 'lucide-react'

type Task = {
  id: string
  title: string
  description: string | null
  skills_required: string[]
  deadline: string | null
  status: string
}

export default function VolunteerPreview({ tasks = [] }: { tasks?: Task[] }) {
  if (tasks.length === 0) return null

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <span className="bg-purple-100 text-purple-800 badge text-xs uppercase tracking-widest mb-3 inline-block">
              Volunteer
            </span>
            <h2 className="section-title">Get Involved</h2>
            <p className="section-subtitle max-w-xl mt-2">
              Lend your skills to a cause that matters. Open opportunities need you.
            </p>
          </div>
          <Link href="/dashboard/tasks" className="btn-secondary shrink-0">
            All Opportunities
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Task cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.slice(0, 3).map((task) => {
            const days = task.deadline
              ? Math.ceil((new Date(task.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              : null

            return (
              <div
                key={task.id}
                className="card group hover:shadow-xl transition-shadow duration-300 flex flex-col"
              >
                <div className="p-5 flex-1">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <HandHeart className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="font-bold text-slate-900 group-hover:text-purple-700 transition-colors line-clamp-2 pt-1">
                      {task.title}
                    </h3>
                  </div>

                  {task.description && (
                    <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed mb-4">
                      {task.description}
                    </p>
                  )}

                  {/* Skills */}
                  {task.skills_required && task.skills_required.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {task.skills_required.slice(0, 3).map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-purple-700 bg-purple-50 rounded-full px-2.5 py-1"
                        >
                          <Tag className="w-2.5 h-2.5" />
                          {skill}
                        </span>
                      ))}
                      {task.skills_required.length > 3 && (
                        <span className="text-[11px] text-slate-500 px-1">
                          +{task.skills_required.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-5 pb-5 flex items-center justify-between border-t border-gray-50 pt-3">
                  {days !== null ? (
                    <span className={`text-xs font-semibold flex items-center gap-1 ${
                      days <= 3 ? 'text-red-700' : days <= 7 ? 'text-amber-700' : 'text-slate-500'
                    }`}>
                      <Clock className="w-3 h-3" />
                      {days > 0 ? `${days} day${days > 1 ? 's' : ''} left` : 'Due today'}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500">Flexible deadline</span>
                  )}
                  <Link
                    href="/dashboard/tasks"
                    className="text-xs font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1 group/link transition-colors"
                  >
                    Claim Task
                    <ArrowRight className="w-3 h-3 group-hover/link:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
