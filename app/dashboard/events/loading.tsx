export default function EventsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded-xl" />

      {/* Tabs skeleton */}
      <div className="flex gap-2">
        <div className="h-9 w-28 bg-gray-200 rounded-xl" />
        <div className="h-9 w-24 bg-gray-100 rounded-xl" />
      </div>

      {/* Event cards */}
      {[...Array(3)].map((_, i) => (
        <div key={i} className="card p-5 flex gap-4">
          <div className="w-14 h-14 bg-gray-200 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-gray-200 rounded w-2/3" />
            <div className="h-4 bg-gray-100 rounded w-1/3" />
            <div className="h-4 bg-gray-100 rounded w-1/2" />
          </div>
          <div className="w-20 h-8 bg-gray-200 rounded-xl flex-shrink-0" />
        </div>
      ))}
    </div>
  )
}
