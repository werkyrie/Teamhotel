"use client"

import { CardContent } from "@/components/ui/card"

import { Card } from "@/components/ui/card"

import { useState, useEffect, useCallback } from "react"
import { useClientContext } from "@/context/client-context"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  CheckCircle,
  XCircle,
  Calendar,
  MapPin,
  DollarSign,
  User,
  MessageSquare,
  Trash2,
  ClipboardCopy,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { OrderRequest, OrderRequestStatus } from "@/types/client"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import ChatBox from "./chat-box"
import { cn } from "@/lib/utils"

interface OrderRequestCardProps {
  request: OrderRequest
}

export default function OrderRequestCard({ request }: OrderRequestCardProps) {
  const { updateOrderRequestStatus, deleteOrderRequest, getChatMessages } = useClientContext()
  const { user, isAdmin } = useAuth()
  const { toast } = useToast()
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)

  // Get status badge variant
  const getStatusVariant = (status: OrderRequestStatus): string => {
    switch (status) {
      case "Pending":
        return "pending"
      case "Approved":
        return "approved"
      case "Rejected":
        return "rejected"
      default:
        return "outline"
    }
  }

  // Handle status update
  const handleStatusUpdate = (status: OrderRequestStatus) => {
    setIsUpdating(true)

    // Simulate a delay for better UX
    setTimeout(() => {
      updateOrderRequestStatus(request.id, status)

      let description = `Order request has been ${status.toLowerCase()}.`
      if (status === "Approved") {
        description = "Order request has been marked as approved."
      } else if (status === "Rejected") {
        description = "Order request has been rejected."
      }

      toast({
        title: `Request ${status}`,
        description: description,
        variant: status === "Approved" ? "success" : status === "Rejected" ? "destructive" : "default",
      })

      setIsUpdating(false)
    }, 500)
  }

  // Handle delete request
  const handleDeleteRequest = () => {
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    deleteOrderRequest(request.id)
    toast({
      title: "Request Deleted",
      description: "Order request has been deleted successfully.",
      variant: "default",
    })
    setIsDeleteDialogOpen(false)
  }

  // Handle copy information
  const handleCopyInformation = () => {
    // Create a simplified message with order request information
    const message = `Shop ID: ${request.shopId}
Location: ${request.location}
Price: ${formatCurrency(request.price || 0)}`

    // Copy to clipboard
    navigator.clipboard.writeText(message)

    toast({
      title: "Information Copied",
      description: "Order details copied to clipboard!",
    })
  }

  // Check for unread messages
  const checkForUnreadMessages = useCallback(async () => {
    if (!user) return

    const messages = await getChatMessages(request.id)
    let unreadCount = 0

    for (const message of messages) {
      // Check if the message is unread by the current user
      const hasRead = (message.readBy || []).includes(user.uid)

      // Only count messages from other users as unread
      if (!hasRead && message.userId !== user.uid) {
        unreadCount++
      }
    }

    setUnreadMessageCount(unreadCount)
  }, [getChatMessages, request.id, user])

  // Handle messages being read
  const handleMessagesRead = useCallback(() => {
    // Reset the unread count when messages are read
    setUnreadMessageCount(0)
  }, [])

  useEffect(() => {
    // Check for unread messages when the component mounts
    checkForUnreadMessages()

    // Set up an interval to periodically check for new messages
    const interval = setInterval(checkForUnreadMessages, 10000) // Check every 10 seconds

    return () => clearInterval(interval)
  }, [checkForUnreadMessages])

  // Handle show chat
  const handleShowChat = () => {
    setShowChat(!showChat)
  }

  return (
    <TooltipProvider>
      <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="text-lg font-semibold">{request.clientName}</h3>
            <p className="text-sm text-muted-foreground">Shop ID: {request.shopId}</p>
          </div>
          <div className="flex items-center">
            <Badge variant={getStatusVariant(request.status as OrderRequestStatus)}>{request.status}</Badge>
          </div>
        </div>

        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {formatDate(request.date)}{" "}
                {request.date && new Date(request.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span>{formatCurrency(request.price || 0)}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{request.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{request.agent}</span>
            </div>
          </div>

          {request.remarks && (
            <div className="text-sm text-muted-foreground">
              <strong>Remarks:</strong> {request.remarks}
            </div>
          )}

          <div className="flex flex-wrap gap-2 justify-between">
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-9 relative",
                unreadMessageCount > 0 && "border-blue-400 text-blue-600 dark:border-blue-500 dark:text-blue-400",
              )}
              onClick={handleShowChat}
            >
              <MessageSquare className={cn("h-4 w-4 mr-1", unreadMessageCount > 0 && "text-blue-500 animate-pulse")} />
              {showChat ? "Hide Chat" : "Show Chat"}
              {unreadMessageCount > 0 && (
                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-gray-900">
                  {unreadMessageCount > 9 ? "9+" : unreadMessageCount}
                  <span className="sr-only">{unreadMessageCount} unread messages</span>
                </span>
              )}
            </Button>

            <div className="flex gap-2">
              {isAdmin && request.status === "Pending" && (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleStatusUpdate("Rejected")}
                        disabled={isUpdating}
                        className="hover:bg-red-100 hover:text-red-500"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Reject</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="default"
                        size="icon"
                        onClick={() => handleStatusUpdate("Approved")}
                        disabled={isUpdating}
                        className="hover:bg-green-100 hover:text-green-500"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Approve</TooltipContent>
                  </Tooltip>
                </>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleCopyInformation}>
                    <ClipboardCopy className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy Info</TooltipContent>
              </Tooltip>

              {isAdmin && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={handleDeleteRequest}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>

          {showChat && (
            <div className="mt-4">
              <ChatBox orderRequestId={request.id} onMessagesRead={handleMessagesRead} />
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the order request. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  )
}
