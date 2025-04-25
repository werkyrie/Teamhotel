"use client"

import { useState, useEffect } from "react"
import { useNotificationContext } from "@/context/notification-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Bell } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export default function NotificationCenter() {
  const { notifications, markAsRead, clearAll } = useNotificationContext()
  const [hasUnread, setHasUnread] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  // Check for unread notifications
  useEffect(() => {
    const unreadExists = notifications.some((notification) => !notification.read)
    setHasUnread(unreadExists)
  }, [notifications])

  // Mark all as read when dropdown is opened
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open && hasUnread) {
      // Small delay to ensure the user sees the notification dot before it disappears
      setTimeout(() => {
        markAsRead()
      }, 500)
    }
  }

  // Handle notification click
  const handleNotificationClick = (notification: any) => {
    // If notification has a link, navigate to it
    if (notification.link) {
      router.push(notification.link)
    }
    setIsOpen(false)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {hasUnread && <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {notifications.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAll} className="h-8 text-xs">
              Clear all
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup className="max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">No notifications</div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  "flex flex-col items-start p-3 cursor-pointer hover:bg-muted",
                  !notification.read && "bg-blue-50 dark:bg-blue-900/20",
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="font-medium">{notification.title}</div>
                <div className="text-sm text-muted-foreground">{notification.message}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {new Date(notification.timestamp).toLocaleString()}
                </div>
                {notification.link && <div className="text-xs text-blue-500 mt-1 hover:underline">Click to view</div>}
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
