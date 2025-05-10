"use client"
import { lazy } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import DashboardComponent from "./dashboard-component"

// Lazy load components with individual suspense boundaries
const WelcomeHero = lazy(() => import("@/components/dashboard/welcome-hero"))
const OptimizedStatisticsGrid = lazy(() => import("@/components/dashboard/optimized-statistics-grid"))
const TopAgentsCard = lazy(() => import("@/components/dashboard/top-agents-card"))
const AdminOrderRequestsCard = lazy(() => import("@/components/dashboard/admin-order-requests-card"))

// Skeleton components for each section
const WelcomeHeroSkeleton = () => (
  <Card className="w-full border-slate-200 dark:border-slate-700">
    <CardContent className="p-6">
      <Skeleton className="h-12 w-3/4 mb-4 bg-slate-200 dark:bg-slate-700" />
      <Skeleton className="h-6 w-1/2 bg-slate-200 dark:bg-slate-700" />
    </CardContent>
  </Card>
)

const StatisticsGridSkeleton = () => (
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
)

const CardSkeleton = () => (
  <Card className="border-slate-200 dark:border-slate-700">
    <CardContent className="p-6">
      <Skeleton className="h-8 w-1/2 mb-4 bg-slate-200 dark:bg-slate-700" />
      <Skeleton className="h-6 w-3/4 mb-2 bg-slate-200 dark:bg-slate-700" />
      <Skeleton className="h-24 w-full bg-slate-200 dark:bg-slate-700" />
    </CardContent>
  </Card>
)

function OptimizedDashboard() {
  // Use direct component instead of lazy loading for faster initial render
  return <DashboardComponent />
}

// Export as memoized component to prevent unnecessary re-renders
export default OptimizedDashboard
