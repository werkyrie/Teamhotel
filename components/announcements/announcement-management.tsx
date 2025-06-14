"use client"

import { useState } from "react"
import { Plus, Power, PowerOff, Edit, Trash2, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAnnouncements } from "@/context/announcement-context"
import { useAuth } from "@/context/auth-context"
import AnnouncementModal from "./announcement-modal"
import { cn } from "@/lib/utils"
import type { Announcement } from "@/types/announcement"

const typeColors = {
  info: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  error: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
}

const priorityColors = {
  low: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  medium: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
}

export default function AnnouncementManagement() {
  const { announcements, loading, activateAnnouncement, deactivateAnnouncement, deleteAnnouncement } =
    useAnnouncements()
  const { isAdmin } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Access denied. Admin privileges required.</p>
      </div>
    )
  }

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement)
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setEditingAnnouncement(null)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this announcement?")) {
      await deleteAnnouncement(id)
    }
  }

  const handleToggleActive = async (announcement: Announcement) => {
    if (announcement.isActive) {
      await deactivateAnnouncement(announcement.id)
    } else {
      await activateAnnouncement(announcement.id)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Announcement Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Create and manage system announcements for viewers</p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Announcement
        </Button>
      </div>

      {announcements.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">No announcements yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Create your first announcement to notify viewers about important updates.
              </p>
              <Button onClick={handleCreate}>Create First Announcement</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {announcements.map((announcement) => (
            <Card key={announcement.id} className={cn("relative", announcement.isActive && "ring-2 ring-green-500")}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{announcement.title}</CardTitle>
                      {announcement.isActive && (
                        <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                          ACTIVE
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={typeColors[announcement.type]}>{announcement.type.toUpperCase()}</Badge>
                      <Badge className={priorityColors[announcement.priority]}>
                        {announcement.priority.toUpperCase()} PRIORITY
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleToggleActive(announcement)}
                      className={cn(
                        announcement.isActive
                          ? "text-green-600 hover:text-green-700 border-green-300"
                          : "text-gray-400 hover:text-gray-600",
                      )}
                    >
                      {announcement.isActive ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleEdit(announcement)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(announcement.id)}
                      className="text-red-600 hover:text-red-700 border-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-700 dark:text-gray-300 mb-3">{announcement.message}</p>
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-4">
                    <span>Created: {announcement.createdAt.toLocaleDateString()}</span>
                    {announcement.expiresAt && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Expires: {announcement.expiresAt.toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <span>By: {announcement.createdBy}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AnnouncementModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingAnnouncement(null)
        }}
        announcement={editingAnnouncement}
      />
    </div>
  )
}
