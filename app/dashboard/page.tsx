"use client"

import { Suspense, lazy, useEffect, useState } from "react"
import DashboardSkeleton from "@/components/dashboard/dashboard-skeleton"
import { useClientContext } from "@/context/client-context"

// Lazy load dashboard components
const WelcomeHero = lazy(() => import("@/components/dashboard/welcome-hero"))
const OptimizedStatisticsGrid = lazy(() => import("@/components/dashboard/optimized-statistics-grid"))
const TopAgentsCard = lazy(() => import("@/components/dashboard/top-agents-card"))
const AdminOrderRequestsCard = lazy(() => import("@/components/dashboard/admin-order-requests-card"))

// Main dashboard component with lazy loading
const Dashboard = () => {
  const { clients, loading } = useClientContext()

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Suspense fallback={<div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />}>
        <WelcomeHero />
      </Suspense>

      <Suspense fallback={<div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />}>
        <OptimizedStatisticsGrid />
      </Suspense>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Suspense fallback={<div className="h-80 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />}>
          <TopAgentsCard />
        </Suspense>

        <Suspense fallback={<div className="h-80 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />}>
          <AdminOrderRequestsCard />
        </Suspense>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { clients } = useClientContext()
  const [isDataReady, setIsDataReady] = useState(false)

  // Check if data is ready
  useEffect(() => {
    if (clients && clients.length > 0) {
      setIsDataReady(true)
    }
  }, [clients])

  // Preload critical components
  useEffect(() => {
    // Preload main dashboard components
    const preloadComponents = async () => {
      // Start preloading immediately
      const preloads = [
        () => import("@/components/dashboard/welcome-hero"),
        () => import("@/components/dashboard/optimized-statistics-grid"),
        () => import("@/components/dashboard/top-agents-card"),
        () => import("@/components/dashboard/admin-order-requests-card"),
      ]

      // Use Promise.all to load components in parallel
      await Promise.all(preloads.map((loader) => loader().catch(() => null)))
    }

    // Start preloading immediately
    preloadComponents()

    // Add event listener for when the page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        preloadComponents()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [])

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard />
    </Suspense>
  )
}
