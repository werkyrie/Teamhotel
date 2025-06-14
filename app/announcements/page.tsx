"use client"

import { useAuth } from "@/context/auth-context"
import AnnouncementManagement from "@/components/announcements/announcement-management"
import ProtectedRoute from "@/components/protected-route"

export default function AnnouncementsPage() {
  const { isAdmin } = useAuth()

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-6">
        {isAdmin ? (
          <AnnouncementManagement />
        ) : (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Access denied. Admin privileges required.</p>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
