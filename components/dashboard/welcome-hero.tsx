"use client"

import { useEffect, useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"
import { useAuth } from "@/context/auth-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Clock, Sparkles } from "lucide-react"

export default function WelcomeHero() {
  const { user } = useAuth()
  const [currentTime, setCurrentTime] = useState(new Date())
  const { theme } = useTheme()
  const [showSparkle, setShowSparkle] = useState(false)

  // Memoize greeting calculation
  const greeting = useMemo(() => {
    const hour = currentTime.getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }, [currentTime])

  // Memoize date formatting to avoid recalculation
  const formattedDate = useMemo(() => {
    return currentTime.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }, [currentTime])

  // Memoize time formatting
  const formattedTime = useMemo(() => {
    return currentTime.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }, [currentTime])

  // Optimize time update to only run once per minute
  useEffect(() => {
    // Calculate milliseconds until the next minute
    const now = new Date()
    const nextMinute = new Date(now)
    nextMinute.setMinutes(now.getMinutes() + 1)
    nextMinute.setSeconds(0)
    nextMinute.setMilliseconds(0)
    const delay = nextMinute.getTime() - now.getTime()

    // Set initial timeout to sync with minute boundary
    const initialTimeout = setTimeout(() => {
      setCurrentTime(new Date())

      // Then set interval for every minute
      const timer = setInterval(() => {
        setCurrentTime(new Date())
      }, 60000)

      return () => clearInterval(timer)
    }, delay)

    return () => clearTimeout(initialTimeout)
  }, [])

  // Add sparkle effect on load
  useEffect(() => {
    setShowSparkle(true)
    const timer = setTimeout(() => {
      setShowSparkle(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.name) return "U"
    return user.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  // Get user's display name (username from email, nickname, or first name)
  const getUserDisplayName = () => {
    // If user has an email, extract the username part (before @)
    if (user?.email) {
      const emailParts = user.email.split("@")
      if (emailParts.length > 0) {
        return emailParts[0]
      }
    }

    // Fall back to nickname if available
    if (user?.nickname) return user.nickname

    // Fall back to first name if available
    if (user?.name) return user.name.split(" ")[0]

    // Default fallback
    return "User"
  }

  return (
    <div className="space-y-4">
      <Card className="border-none shadow-md overflow-hidden">
        <div className="relative">
          {/* Background gradient - black and white */}
          <div
            className={`absolute inset-0 ${
              theme === "dark"
                ? "bg-gradient-to-r from-black via-gray-900 to-black"
                : "bg-gradient-to-r from-gray-50 via-white to-gray-50"
            }`}
          />

          <div className="relative p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              {/* Left side - Greeting and user info */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-16 w-16 border-4 border-background shadow-lg">
                    <AvatarImage src={user?.image} alt={user?.name || "User"} />
                    <AvatarFallback className="bg-black text-white text-xl">{getUserInitials()}</AvatarFallback>
                  </Avatar>
                  {showSparkle && (
                    <motion.div
                      className="absolute -top-2 -right-2"
                      initial={{ scale: 0, rotate: -30 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    >
                      <Sparkles className="h-6 w-6 text-gray-400 drop-shadow-md" />
                    </motion.div>
                  )}
                </div>
                <div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h1 className="text-2xl md:text-3xl font-bold">
                      {greeting}, {getUserDisplayName()}!
                    </h1>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <div className="flex items-center gap-2 text-muted-foreground mt-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formattedDate}</span>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Right side - Time only */}
              <div className="flex items-center gap-2 text-lg font-medium">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span>{formattedTime}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
