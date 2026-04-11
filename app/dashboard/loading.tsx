export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="h-8 w-64 bg-gray-200 rounded-xl" />
      <div className="h-4 w-48 bg-gray-100 rounded-lg" />

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card p-5 space-y-3">
            <div className="w-10 h-10 bg-gray-200 rounded-xl" />
            <div className="h-7 w-20 bg-gray-200 rounded-lg" />
            <div className="h-4 w-32 bg-gray-100 rounded" />
          </div>
        ))}
      </div>

      {/* Content row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5 space-y-4">
          <div className="h-5 w-36 bg-gray-200 rounded-lg" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
        <div className="card p-5 space-y-4">
          <div className="h-5 w-36 bg-gray-200 rounded-lg" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
