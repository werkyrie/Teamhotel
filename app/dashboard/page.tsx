"use client"

import { Suspense, lazy, useEffect, useState } from "react"
import DashboardSkeleton from "@/components/dashboard/dashboard-skeleton"
import { useClientContext } from "@/context/client-context"

// Lazy load the dashboard component with a custom loader
const OptimizedDashboard = lazy(() =>
  import("@/components/dashboard/optimized-dashboard").then((module) => ({
    default: module.default,
  })),
)

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
        () => import("@/components/dashboard/dashboard-component"),
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
      <OptimizedDashboard />
    </Suspense>
  )
}
