interface LoadingSkeletonProps {
  className?: string
  count?: number
}

export function SkeletonBox({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-gray-700 animate-pulse rounded ${className}`} />
  )
}

export function SkeletonText({ className = '' }: { className?: string }) {
  return (
    <div className={`h-4 bg-gray-700 animate-pulse rounded ${className}`} />
  )
}

export function CharacterCardSkeleton() {
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      <SkeletonBox className="w-full h-48" />
      <div className="p-4 space-y-3">
        <SkeletonText className="w-3/4 h-6" />
        <SkeletonText className="w-1/2 h-4" />
        <div className="flex gap-4 pt-2">
          <SkeletonText className="w-16 h-4" />
          <SkeletonText className="w-16 h-4" />
        </div>
        <SkeletonBox className="w-full h-10 rounded-lg mt-4" />
      </div>
    </div>
  )
}

export function DashboardCardSkeleton() {
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
      <SkeletonBox className="w-12 h-12 rounded-lg mb-4" />
      <SkeletonText className="w-3/4 h-5 mb-2" />
      <SkeletonText className="w-1/2 h-4" />
    </div>
  )
}

export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex gap-4 p-4 border-b border-gray-700">
      {Array.from({ length: columns }).map((_, i) => (
        <SkeletonText key={i} className="flex-1" />
      ))}
    </div>
  )
}

export function CampaignCardSkeleton() {
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
      <SkeletonText className="w-3/4 h-6 mb-3" />
      <SkeletonText className="w-full h-4 mb-2" />
      <SkeletonText className="w-5/6 h-4 mb-4" />
      <div className="flex gap-4 pt-4 border-t border-gray-700">
        <SkeletonText className="w-24 h-4" />
        <SkeletonText className="w-24 h-4" />
      </div>
    </div>
  )
}

export default function LoadingSkeleton({ className = '', count = 1 }: LoadingSkeletonProps) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonBox key={i} className="w-full h-32 mb-4" />
      ))}
    </div>
  )
}
