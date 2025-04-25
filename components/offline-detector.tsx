"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Wifi, WifiOff } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function OfflineDetector() {
  const [isOnline, setIsOnline] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine)

    // Handle online status changes
    const handleOnline = () => {
      setIsOnline(true)
      toast({
        title: "You are online",
        description: "Your changes will be synchronized",
        variant: "success",
      })
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast({
        title: "You are offline",
        description: "You can still view and edit data. Changes will be saved locally.",
        variant: "warning",
      })
    }

    // Add event listeners
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Clean up
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [toast])

  if (isOnline) {
    return (
      <Badge
        variant="outline"
        className="flex items-center gap-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      >
        <Wifi className="h-3 w-3" />
        Online
      </Badge>
    )
  }

  return (
    <Badge
      variant="outline"
      className="flex items-center gap-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    >
      <WifiOff className="h-3 w-3" />
      Offline Mode
    </Badge>
  )
}
