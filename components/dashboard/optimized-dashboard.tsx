"use client"
import { lazy, Suspense, useState, useEffect, useMemo } from "react"
import { useAuth } from "@/context/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
// Lazy load components with individual suspense boundaries
const WelcomeHero = lazy(() => import("@/components/dashboard/welcome-hero"))
const OptimizedStatisticsGrid = lazy(() => import("@/components/dashboard/optimized-statistics-grid"))
const TopAgentsCard = lazy(() => import("@/components/dashboard/top-agents-card"))
const AdminOrderRequestsCard = lazy(() => import("@/components/dashboard/admin-order-requests-card"))

// Skeleton components for each section
const WelcomeHeroSkeleton = () => (
  <Card className="w-full">
    <CardContent className="p-6">
      <Skeleton className="h-12 w-3/4 mb-4" />
      <Skeleton className="h-6 w-1/2" />
    </CardContent>
  </Card>
)

const StatisticsGridSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {[...Array(4)].map((_, i) => (
      <Card key={i}>
        <CardContent className="p-6">
          <Skeleton className="h-8 w-1/2 mb-4" />
          <Skeleton className="h-6 w-1/4" />
        </CardContent>
      </Card>
    ))}
  </div>
)

const CardSkeleton = () => (
  <Card>
    <CardContent className="p-6">
      <Skeleton className="h-8 w-1/2 mb-4" />
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-24 w-full" />
    </CardContent>
  </Card>
)

function OptimizedDashboard() {
  const { isAdmin } = useAuth()
  const [mounted, setMounted] = useState(false)

  // Optimize initial render
  useEffect(() => {
    setMounted(true)

    // Add performance mark for measuring
    if (typeof performance !== "undefined") {
      performance.mark("dashboard-mounted")
    }

    return () => {
      // Clean up any potential memory leaks
      if (typeof performance !== "undefined") {
        performance.clearMarks("dashboard-mounted")
      }
    }
  }, [])

  // Optimize rendering order with staggered loading
  const [loadSecondary, setLoadSecondary] = useState(false)

  useEffect(() => {
    if (mounted) {
      const timer = setTimeout(() => {
        setLoadSecondary(true)
      }, 100) // Small delay to prioritize primary content

      return () => clearTimeout(timer)
    }
  }, [mounted])

  // Memoize the admin check to prevent unnecessary re-renders
  const showAdminCard = useMemo(() => isAdmin, [isAdmin])

  // Use CSS containment for better performance
  const containerStyle = useMemo(
    () => ({
      contain: "content" as const,
    }),
    [],
  )

  if (!mounted) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <WelcomeHeroSkeleton />
        <StatisticsGridSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CardSkeleton />
          {showAdminCard && <CardSkeleton />}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6" style={containerStyle}>
      {/* Primary content - load immediately */}
      <Suspense fallback={<WelcomeHeroSkeleton />}>
        <WelcomeHero />
      </Suspense>

      <Suspense fallback={<StatisticsGridSkeleton />}>
        <OptimizedStatisticsGrid />
      </Suspense>

      {/* Secondary content - load after primary */}
      {loadSecondary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Suspense fallback={<CardSkeleton />}>
            <TopAgentsCard />
          </Suspense>

          {showAdminCard && (
            <Suspense fallback={<CardSkeleton />}>
              <AdminOrderRequestsCard />
            </Suspense>
          )}
        </div>
      )}
    </div>
  )
}

// Export as memoized component to prevent unnecessary re-renders
export default OptimizedDashboard
