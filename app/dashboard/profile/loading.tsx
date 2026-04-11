export default function ProfileLoading() {
  return (
    <div className="space-y-6 animate-pulse max-w-2xl">
      <div className="h-8 w-40 bg-gray-200 rounded-xl" />

      <div className="card p-8 space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-gray-200 rounded-full" />
          <div className="space-y-2">
            <div className="h-5 w-32 bg-gray-200 rounded-lg" />
            <div className="h-4 w-24 bg-gray-100 rounded" />
          </div>
        </div>

        {/* Fields */}
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-28 bg-gray-200 rounded" />
            <div className="h-11 bg-gray-100 rounded-xl" />
          </div>
        ))}

        <div className="h-11 w-36 bg-gray-200 rounded-xl" />
      </div>
    </div>
  )
}
