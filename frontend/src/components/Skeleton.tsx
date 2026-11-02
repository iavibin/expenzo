export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-[#1a2332] rounded-md ${className}`} />;
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 4 KPI Skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-5 rounded-xl bg-foundation-surface border border-foundation-border">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1 mr-3">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-7 w-32" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="w-11 h-11 rounded-lg shrink-0" />
            </div>
          </div>
        ))}
      </div>

      {/* Alert Banner Skeleton */}
      <div className="p-4 rounded-xl bg-foundation-surface border border-foundation-border space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 rounded-lg bg-foundation-surfaceElevated border border-foundation-borderSubtle space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* 2 Chart Skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {[1, 2].map((i) => (
          <div key={i} className="p-5 sm:p-6 rounded-xl bg-foundation-surface border border-foundation-border space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-6 w-20 rounded-md" />
            </div>
            <Skeleton className="h-[260px] w-full rounded-lg" />
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="p-5 sm:p-6 rounded-xl bg-foundation-surface border border-foundation-border space-y-4">
        <Skeleton className="h-5 w-44" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 w-full rounded-md" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-6">
      {/* Filter Bar Skeleton */}
      <div className="p-4 rounded-xl bg-foundation-surface border border-foundation-border flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2.5 flex-1 max-w-md">
          <Skeleton className="h-9 flex-1 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>

      {/* Summary KPI Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-3.5 rounded-lg bg-foundation-surface border border-foundation-border space-y-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-28" />
          </div>
        ))}
      </div>

      {/* Table Rows Skeleton */}
      <div className="rounded-xl bg-foundation-surface border border-foundation-border overflow-hidden">
        <div className="p-4 border-b border-foundation-border">
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="divide-y divide-foundation-borderSubtle">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/6" />
              <Skeleton className="h-4 w-1/6" />
              <Skeleton className="h-4 w-1/6" />
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function BudgetSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-5 rounded-xl bg-foundation-surface border border-foundation-border space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>

      {/* Budget Grid Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="p-5 rounded-xl bg-foundation-surface border border-foundation-border space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReportSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Period Banner Skeleton */}
      <div className="p-6 rounded-xl bg-foundation-surface border border-foundation-border flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-3.5 w-64" />
        </div>
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-5 rounded-xl bg-foundation-surface border border-foundation-border space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="rounded-xl bg-foundation-surface border border-foundation-border p-5 space-y-4">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-[220px] w-full rounded-lg" />
      </div>
    </div>
  );
}
