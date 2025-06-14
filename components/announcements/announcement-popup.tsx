"use client"

import { useEffect, useState } from "react"
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAnnouncements } from "@/context/announcement-context"
import { useAuth } from "@/context/auth-context"
import { cn } from "@/lib/utils"

const typeIcons = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  error: AlertCircle,
}

const typeColors = {
  info: "border-blue-500 bg-blue-50 dark:bg-blue-950",
  warning: "border-yellow-500 bg-yellow-50 dark:bg-yellow-950",
  success: "border-green-500 bg-green-50 dark:bg-green-950",
  error: "border-red-500 bg-red-50 dark:bg-red-950",
}

const priorityStyles = {
  low: "border-l-4",
  medium: "border-l-8",
  high: "border-l-12 shadow-lg",
}

export default function AnnouncementPopup() {
  const { activeAnnouncement, dismissAnnouncement } = useAnnouncements()
  const { isAdmin } = useAuth()
  const [isVisible, setIsVisible] = useState(false)

  // Only show to non-admin users
  useEffect(() => {
    console.log("Popup effect - activeAnnouncement:", activeAnnouncement)
    console.log("Popup effect - isAdmin:", isAdmin)
    if (activeAnnouncement && !isAdmin) {
      console.log("Setting popup visible")
      setIsVisible(true)
    } else {
      console.log("Hiding popup")
      setIsVisible(false)
    }
  }, [activeAnnouncement, isAdmin])

  if (!isVisible || !activeAnnouncement) {
    return null
  }

  const Icon = typeIcons[activeAnnouncement.type]

  const handleDismiss = () => {
    dismissAnnouncement(activeAnnouncement.id)
    setIsVisible(false)
  }

  const customStyle = {
    backgroundColor: activeAnnouncement.backgroundColor || undefined,
    color: activeAnnouncement.textColor || undefined,
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card
        className={cn(
          "w-full max-w-2xl mx-auto animate-in fade-in-0 zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto",
          !activeAnnouncement.backgroundColor && typeColors[activeAnnouncement.type],
          priorityStyles[activeAnnouncement.priority],
        )}
        style={activeAnnouncement.backgroundColor ? customStyle : undefined}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Icon
                className={cn(
                  "h-6 w-6 flex-shrink-0",
                  !activeAnnouncement.textColor && activeAnnouncement.type === "info" && "text-blue-600",
                  !activeAnnouncement.textColor && activeAnnouncement.type === "warning" && "text-yellow-600",
                  !activeAnnouncement.textColor && activeAnnouncement.type === "success" && "text-green-600",
                  !activeAnnouncement.textColor && activeAnnouncement.type === "error" && "text-red-600",
                )}
                style={activeAnnouncement.textColor ? { color: activeAnnouncement.textColor } : undefined}
              />
              <CardTitle className="text-xl font-semibold leading-tight">{activeAnnouncement.title}</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 flex-shrink-0"
              onClick={handleDismiss}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          {activeAnnouncement.priority === "high" && (
            <div className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400 mt-2">
              <AlertCircle className="h-4 w-4" />
              High Priority
            </div>
          )}
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          {activeAnnouncement.imageUrl && (
            <div className="w-full">
              <img
                src={activeAnnouncement.imageUrl || "/placeholder.svg"}
                alt="Announcement"
                className="w-full h-auto max-h-64 object-cover rounded-lg shadow-sm"
                onError={(e) => {
                  e.currentTarget.style.display = "none"
                }}
              />
            </div>
          )}

          <div className="space-y-3">
            <p
              className="text-base leading-relaxed whitespace-pre-wrap"
              style={activeAnnouncement.textColor ? { color: activeAnnouncement.textColor } : undefined}
            >
              {activeAnnouncement.message}
            </p>

            {activeAnnouncement.expiresAt && (
              <p className="text-sm opacity-75 border-t pt-3">
                Expires: {activeAnnouncement.expiresAt.toLocaleDateString()} at{" "}
                {activeAnnouncement.expiresAt.toLocaleTimeString()}
              </p>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button
              onClick={handleDismiss}
              className="px-8 py-2"
              variant={activeAnnouncement.type === "error" ? "destructive" : "default"}
              size="lg"
            >
              Got it
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
