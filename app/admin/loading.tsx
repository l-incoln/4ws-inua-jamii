export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-52 bg-slate-700 rounded-xl" />
      <div className="h-4 w-64 bg-slate-800 rounded-lg" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-slate-800 rounded-2xl p-5 space-y-3">
            <div className="w-10 h-10 bg-slate-700 rounded-xl" />
            <div className="h-7 w-16 bg-slate-700 rounded-lg" />
            <div className="h-4 w-28 bg-slate-800/80 rounded" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-2xl p-5 space-y-4">
          <div className="h-5 w-36 bg-slate-700 rounded-lg" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-9 h-9 bg-slate-700 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-700 rounded w-3/4" />
                <div className="h-3 bg-slate-800/80 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
        <div className="bg-slate-800 rounded-2xl p-5 space-y-4">
          <div className="h-5 w-36 bg-slate-700 rounded-lg" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-9 h-9 bg-slate-700 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-700 rounded w-3/4" />
                <div className="h-3 bg-slate-800/80 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
