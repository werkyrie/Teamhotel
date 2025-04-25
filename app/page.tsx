"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import ClientsTable from "@/components/clients-table"
import OrdersTable from "@/components/orders-table"
import DepositsTable from "@/components/deposits-table"
import WithdrawalsTable from "@/components/withdrawals-table"
import SettingsPanel from "@/components/settings-panel"
import DashboardComponent from "@/components/dashboard/dashboard-component"
import TeamPerformancePage from "@/components/team-performance/team-page"
import OrderRequestPage from "@/components/order-requests/order-request-page"
import Sidebar from "@/components/sidebar"
import NavBar from "@/components/nav-bar"
import { useAuth } from "@/context/auth-context"
import ReportsPage from "@/components/reports/reports-page"
import InventoryPage from "@/components/inventory/inventory-page"
import VideoCallTemplate from "@/components/videocall/video-call-template"

export default function Home() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const [activeTab, setActiveTab] = useState("dashboard")
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // If not authenticated and not loading, redirect to login
    if (!loading && !isAuthenticated) {
      router.push("/login")
      return
    }

    // Set active tab from URL parameter
    if (tabParam) {
      setActiveTab(tabParam)
    } else {
      // If no tab parameter is provided, default to dashboard
      setActiveTab("dashboard")
    }
  }, [tabParam, isAuthenticated, loading, router])

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading...</h2>
          <p>Please wait while we set up your dashboard</p>
        </div>
      </div>
    )
  }

  // Don't render anything until authentication check is complete
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Only show NavBar on desktop */}
      <div className="hidden md:block">
        <NavBar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      <main className="flex-1 ml-16 md:ml-64 md:mt-16 p-4 sm:p-6 transition-all duration-300 ease-in-out">
        <Tabs value={activeTab} className="w-full">
          <TabsContent value="dashboard" className="mt-0">
            <DashboardComponent />
          </TabsContent>

          <TabsContent value="clients" className="mt-0">
            <ClientsTable />
          </TabsContent>

          <TabsContent value="orders" className="mt-0">
            <OrdersTable />
          </TabsContent>

          <TabsContent value="order-requests" className="mt-0">
            <OrderRequestPage />
          </TabsContent>

          <TabsContent value="deposits" className="mt-0">
            <DepositsTable />
          </TabsContent>

          <TabsContent value="withdrawals" className="mt-0">
            <WithdrawalsTable />
          </TabsContent>

          <TabsContent value="team" className="mt-0">
            <TeamPerformancePage />
          </TabsContent>

          <TabsContent value="reports" className="mt-0">
            <ReportsPage />
          </TabsContent>

          <TabsContent value="inventory" className="mt-0">
            <InventoryPage />
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <SettingsPanel />
          </TabsContent>

          <TabsContent value="videocall" className="mt-0">
            <VideoCallTemplate />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
