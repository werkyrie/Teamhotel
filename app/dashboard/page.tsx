"use client"

import { Suspense, lazy, useEffect } from "react"
import DashboardSkeleton from "@/components/dashboard/dashboard-skeleton"

// Lazy load the dashboard component with a custom loader
const OptimizedDashboard = lazy(() =>
  import("@/components/dashboard/optimized-dashboard").then((module) => ({
    default: module.default,
  })),
)

export default function DashboardPage() {
  // Preload critical components
  useEffect(() => {
    // Preload main dashboard components
    const preloadComponents = async () => {
      // Preload in sequence to avoid overwhelming the browser
      const preloads = [
        () => import("@/components/dashboard/welcome-hero"),
        () => import("@/components/dashboard/optimized-statistics-grid"),
        () => import("@/components/dashboard/top-agents-card"),
        () => import("@/components/dashboard/admin-order-requests-card"),
      ]

      for (const preload of preloads) {
        try {
          await preload()
          // Small delay to not block the main thread
          await new Promise((r) => setTimeout(r, 10))
        } catch (e) {
          // Silent fail on preload
        }
      }
    }

    // Use requestIdleCallback if available, otherwise setTimeout
    if (typeof window !== "undefined") {
      if ("requestIdleCallback" in window) {
        ;(window as any).requestIdleCallback(preloadComponents)
      } else {
        setTimeout(preloadComponents, 200)
      }
    }

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
