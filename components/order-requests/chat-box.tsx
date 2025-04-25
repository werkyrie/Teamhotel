"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { useClientContext } from "@/context/client-context"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Send, User, ShieldAlert, AlertCircle } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { ChatMessage } from "@/types/client"
import { db } from "@/lib/firebase"
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

interface ChatBoxProps {
  orderRequestId: string
  onMessagesRead?: () => void
}

export default function ChatBox({ orderRequestId, onMessagesRead }: ChatBoxProps) {
  const { addChatMessage, getChatMessages } = useClientContext()
  const { user, isAdmin } = useAuth()
  const { toast } = useToast()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [usingRealtime, setUsingRealtime] = useState(true)
  const [indexError, setIndexError] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesMarkedAsRead = useRef(false)

  // Load messages using regular fetch as fallback
  const loadMessagesWithFallback = useCallback(async () => {
    try {
      setLoading(true)
      const chatMessages = await getChatMessages(orderRequestId)
      setMessages(chatMessages)

      // Mark messages as read after loading
      if (!messagesMarkedAsRead.current) {
        markMessagesAsRead(chatMessages)
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
      toast({
        title: "Error loading messages",
        description: "Please try refreshing the page",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [orderRequestId, getChatMessages, toast])

  // Mark messages as read
  const markMessagesAsRead = useCallback(
    async (messagesToMark: ChatMessage[]) => {
      if (!user) return

      try {
        // Find messages that haven't been read by the current user
        const unreadMessages = messagesToMark.filter(
          (msg) => !(msg.readBy || []).includes(user.uid) && msg.userId !== user.uid,
        )

        if (unreadMessages.length === 0) return

        // Update each message's readBy array
        for (const message of unreadMessages) {
          const messageRef = doc(db, "chatMessages", message.id)
          await updateDoc(messageRef, {
            readBy: arrayUnion(user.uid),
          })
        }

        // Mark as done to prevent repeated updates
        messagesMarkedAsRead.current = true

        // Notify parent component that messages were read
        if (onMessagesRead) {
          onMessagesRead()
        }

        console.log(`Marked ${unreadMessages.length} messages as read`)
      } catch (error) {
        console.error("Error marking messages as read:", error)
      }
    },
    [user, onMessagesRead],
  )

  // Set up message fetching - tries real-time first, falls back to regular fetch
  useEffect(() => {
    setLoading(true)
    messagesMarkedAsRead.current = false

    // Try to use real-time listener first
    try {
      // Create a query for messages related to this order request
      const messagesQuery = query(collection(db, "chatMessages"), where("orderRequestId", "==", orderRequestId))

      // Set up the real-time listener
      const unsubscribe = onSnapshot(
        messagesQuery,
        async (snapshot) => {
          const messagesData: ChatMessage[] = []

          snapshot.forEach((doc) => {
            const data = doc.data()
            messagesData.push({
              id: doc.id,
              orderRequestId: data.orderRequestId,
              userId: data.userId,
              userName: data.userName,
              content: data.content,
              isAdmin: data.isAdmin,
              timestamp: data.timestamp ? data.timestamp.seconds * 1000 : Date.now(),
              readBy: data.readBy || [],
            })
          })

          // Sort messages by timestamp since we're not using orderBy in the query
          messagesData.sort((a, b) => a.timestamp - b.timestamp)

          setMessages(messagesData)
          setLoading(false)
          setUsingRealtime(true)
          setIndexError(false)

          // Mark messages as read after loading
          if (!messagesMarkedAsRead.current) {
            markMessagesAsRead(messagesData)
          }

          // Scroll to bottom after messages load
          setTimeout(() => {
            if (scrollAreaRef.current) {
              scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
            }
          }, 100)
        },
        (error) => {
          console.error("Error getting real-time messages:", error)

          // Check if it's an index error
          if (error.message && error.message.includes("requires an index")) {
            setIndexError(true)
            console.log("Index error detected. Falling back to regular fetching.")
          }

          // Fall back to regular fetch
          setUsingRealtime(false)
          loadMessagesWithFallback()
        },
      )

      // Clean up the listener when component unmounts
      return () => unsubscribe()
    } catch (error) {
      console.error("Error setting up real-time listener:", error)
      setUsingRealtime(false)
      loadMessagesWithFallback()
    }
  }, [orderRequestId, loadMessagesWithFallback, markMessagesAsRead])

  // Set up polling if not using real-time updates
  useEffect(() => {
    if (!usingRealtime) {
      // Poll for new messages every 5 seconds
      const interval = setInterval(loadMessagesWithFallback, 5000)
      return () => clearInterval(interval)
    }
  }, [usingRealtime, loadMessagesWithFallback])

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim() || !user) return

    setSending(true)

    try {
      await addChatMessage({
        orderRequestId,
        userId: user.uid,
        userName: user.displayName || user.email || "User",
        content: newMessage.trim(),
        isAdmin: isAdmin,
      })

      setNewMessage("")

      // If not using real-time, manually refresh messages
      if (!usingRealtime) {
        await loadMessagesWithFallback()
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error sending message",
        description: "Please try again",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  // Format timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="border rounded-md overflow-hidden bg-background">
      <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
        <div className="flex items-center">
          <h3 className="font-medium">Chat</h3>
          <span className="text-xs text-muted-foreground ml-2">
            {messages.length} {messages.length === 1 ? "message" : "messages"}
          </span>
        </div>
        {!usingRealtime && (
          <div className="flex items-center text-xs text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-3 w-3 mr-1" />
            <span>Auto-refresh every 5s</span>
          </div>
        )}
      </div>

      {indexError && (
        <Alert variant="warning" className="m-3 py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            For real-time chat, an admin needs to create a Firestore index. Using auto-refresh for now.
          </AlertDescription>
        </Alert>
      )}

      <ScrollArea className="h-[300px] p-3" ref={scrollAreaRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <User className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No messages yet</p>
            <p className="text-xs">Be the first to send a message</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 ${message.userId === user?.uid ? "justify-end" : "justify-start"}`}
              >
                {message.userId !== user?.uid && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback
                      className={message.isAdmin ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}
                    >
                      {message.isAdmin ? <ShieldAlert className="h-4 w-4" /> : getInitials(message.userName)}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div className={`max-w-[80%] ${message.userId === user?.uid ? "order-first" : "order-last"}`}>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-xs font-medium">
                      {message.userId === user?.uid ? "You" : message.userName}
                      {message.isAdmin && " (Admin)"}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatTime(message.timestamp)}</span>
                  </div>

                  <div
                    className={`rounded-lg px-3 py-2 text-sm ${
                      message.userId === user?.uid
                        ? "bg-primary text-primary-foreground"
                        : message.isAdmin
                          ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                          : "bg-muted"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>

                {message.userId === user?.uid && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className={isAdmin ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}>
                      {isAdmin ? (
                        <ShieldAlert className="h-4 w-4" />
                      ) : (
                        getInitials(user?.displayName || user?.email || "User")
                      )}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <form onSubmit={handleSendMessage} className="p-3 border-t flex gap-2">
        <Input
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={sending || !user}
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={sending || !newMessage.trim() || !user}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  )
}
