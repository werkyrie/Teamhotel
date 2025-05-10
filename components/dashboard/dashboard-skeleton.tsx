import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardSkeleton() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Welcome Hero Skeleton */}
      <Card className="w-full border-slate-200 dark:border-slate-700">
        <CardContent className="p-6">
          <Skeleton className="h-12 w-3/4 mb-4 bg-slate-200 dark:bg-slate-700" />
          <Skeleton className="h-6 w-1/2 bg-slate-200 dark:bg-slate-700" />
        </CardContent>
      </Card>

      {/* Statistics Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-slate-200 dark:border-slate-700">
            <CardContent className="p-6">
              <Skeleton className="h-8 w-1/2 mb-4 bg-slate-200 dark:bg-slate-700" />
              <Skeleton className="h-6 w-1/4 bg-slate-200 dark:bg-slate-700" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card className="border-slate-200 dark:border-slate-700">
            <CardContent className="p-6">
              <Skeleton className="h-8 w-1/2 mb-4 bg-slate-200 dark:bg-slate-700" />
              <Skeleton className="h-6 w-3/4 mb-2 bg-slate-200 dark:bg-slate-700" />
              <Skeleton className="h-24 w-full bg-slate-200 dark:bg-slate-700" />
            </CardContent>
          </Card>
        </div>
        <div>
          <Card className="border-slate-200 dark:border-slate-700">
            <CardContent className="p-6">
              <Skeleton className="h-8 w-1/2 mb-4 bg-slate-200 dark:bg-slate-700" />
              <Skeleton className="h-6 w-3/4 mb-2 bg-slate-200 dark:bg-slate-700" />
              <Skeleton className="h-24 w-full bg-slate-200 dark:bg-slate-700" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
