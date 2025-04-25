"use client"

import { useEffect } from "react"

export default function DebugDashboard() {
  useEffect(() => {
    console.log("Debug Dashboard component mounted")
  }, [])

  return (
    <div className="p-8 border-2 border-red-500 rounded-lg">
      <h1 className="text-2xl font-bold mb-4">Debug Dashboard</h1>
      <p>If you can see this, the dashboard is rendering correctly.</p>
    </div>
  )
}
