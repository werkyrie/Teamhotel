"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useClientContext } from "./client-context"

export type NotificationType = "info" | "warning" | "error" | "success"

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: number
  read: boolean
  link?: string
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void
  markAsRead: () => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearAll: () => void
  clearAllNotifications: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const { orderRequests } = useClientContext()

  // Load notifications from localStorage on initial render
  useEffect(() => {
    const savedNotifications = localStorage.getItem("notifications")
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications))
    }
  }, [])

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("notifications", JSON.stringify(notifications))
  }, [notifications])

  // Monitor order requests and create notifications for new ones
  useEffect(() => {
    if (orderRequests && orderRequests.length > 0) {
      // Check for new pending order requests
      const pendingRequests = orderRequests.filter((request) => request.status === "Pending")

      if (pendingRequests.length > 0) {
        // Check if we already have a notification for pending requests
        const hasOrderRequestNotification = notifications.some(
          (notification) => notification.title === "Pending Order Requests",
        )

        // If we don't have a notification yet, create one
        if (!hasOrderRequestNotification && pendingRequests.length > 0) {
          addNotification({
            type: "info",
            title: "Pending Order Requests",
            message: `You have ${pendingRequests.length} pending order request${pendingRequests.length > 1 ? "s" : ""} that need your attention.`,
            link: "/order-requests",
          })
        }
      }
    }
  }, [orderRequests])

  const unreadCount = notifications.filter((notification) => !notification.read).length

  const addNotification = (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      read: false,
    }

    setNotifications((prev) => [newNotification, ...prev])
  }

  const markAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
  }

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  const clearAllNotifications = () => {
    setNotifications([])
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead: markAllAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
        clearAllNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotificationContext() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}
