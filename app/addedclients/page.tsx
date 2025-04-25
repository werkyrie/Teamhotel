"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import AgentAssignmentDashboard from "@/components/agent-assignment/agent-assignment-dashboard"
import Sidebar from "@/components/sidebar"
import NavBar from "@/components/nav-bar"
import { useAuth } from "@/context/auth-context"

export default function AddedClientsPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("addedclients")

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, router])

  // Set page title
  useEffect(() => {
    document.title = "Agent Assignment Dashboard | CMS"
  }, [])

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 pl-16 md:pl-64">
        <NavBar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="pt-16 px-4 md:px-8">
          <div className="container mx-auto py-6">
            <AgentAssignmentDashboard />
          </div>
        </main>
      </div>
    </div>
  )
}
