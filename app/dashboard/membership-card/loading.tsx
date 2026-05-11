export default function MembershipCardLoading() {
  return (
    <div className="space-y-6 max-w-2xl animate-pulse">
      <div className="flex items-start justify-between">
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded-xl" />
          <div className="h-4 w-64 bg-gray-100 rounded-lg mt-2" />
        </div>
      </div>
      {/* Tabs skeleton */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex-1 h-10 bg-gray-200 rounded-xl" />
        ))}
      </div>
      {/* Card skeleton */}
      <div className="flex justify-center">
        <div className="w-full max-w-[440px] rounded-[22px] bg-gray-200" style={{ aspectRatio: '1.586' }} />
      </div>
      {/* Action grid skeleton */}
      <div className="grid grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
