import Link from 'next/link'
import { Cake } from 'lucide-react'

export type CommunityBirthday = {
  user_id: string
  full_name: string | null
  avatar_url: string | null
}

/**
 * Rendered on the member dashboard:
 *  - `isMyBirthday` → personalised celebration for the member themselves
 *  - `others`       → members who opted in to a public celebration today
 */
export default function BirthdayCelebration({
  isMyBirthday,
  memberName,
  others,
}: {
  isMyBirthday: boolean
  memberName: string
  others: CommunityBirthday[]
}) {
  if (!isMyBirthday && others.length === 0) return null

  return (
    <div className="space-y-4">
      {isMyBirthday && (
        <div className="relative overflow-hidden rounded-2xl border border-pink-200 bg-gradient-to-r from-pink-50 via-rose-50 to-amber-50 p-6">
          <div className="absolute -top-8 -right-6 text-8xl opacity-20 select-none" aria-hidden>🎂</div>
          <div className="relative flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center text-2xl flex-shrink-0" aria-hidden>
              🎉
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-pink-600">Happy Birthday</p>
              <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">
                Happy birthday, {memberName}! 🎈
              </h2>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed max-w-xl">
                The whole 4W&rsquo;S Inua Jamii family is celebrating you today. Thank you for the
                wisdom, wellness, wealth and worth you bring to this community.
              </p>
            </div>
          </div>
        </div>
      )}

      {others.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Cake className="w-4 h-4 text-pink-600" />
            <h2 className="font-bold text-slate-900 text-sm">Celebrating today</h2>
          </div>
          <ul className="flex flex-wrap gap-3">
            {others.map((m) => (
              <li key={m.user_id} className="flex items-center gap-2 bg-pink-50 border border-pink-100 rounded-full pl-1.5 pr-3.5 py-1.5">
                <span className="w-7 h-7 rounded-full overflow-hidden bg-pink-100 flex items-center justify-center text-xs font-bold text-pink-700">
                  {m.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (m.full_name ?? 'M').charAt(0).toUpperCase()
                  )}
                </span>
                <span className="text-sm font-semibold text-slate-800">{m.full_name ?? 'A member'}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-slate-400 mt-3">
            Only members who chose to celebrate publicly appear here.{' '}
            <Link href="/dashboard/settings" className="text-primary-600 hover:underline">
              Manage your birthday privacy
            </Link>
          </p>
        </div>
      )}
    </div>
  )
}
