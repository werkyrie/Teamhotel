"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useClientContext } from "@/context/client-context"
import { useAuth } from "@/context/auth-context"
import { LogOut, Search, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ModeToggle } from "./mode-toggle"
import NotificationCenter from "./notification/notification-center"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface NavBarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export default function NavBar({ activeTab, setActiveTab }: NavBarProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<Array<{ shopId: string; clientName: string }>>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { clients } = useClientContext()
  const { user, logout, isAdmin } = useAuth()

  // Handle clicks outside search results
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Handle search
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setSearchResults([])
      return
    }

    const term = searchTerm.toLowerCase()
    const results = clients
      .filter((client) => client.shopId.toLowerCase().includes(term) || client.clientName.toLowerCase().includes(term))
      .slice(0, 5) // Limit to 5 results
      .map((client) => ({
        shopId: client.shopId,
        clientName: client.clientName,
      }))

    setSearchResults(results)
  }, [searchTerm, clients])

  const navigateTo = (tab: string) => {
    if (tab === "dashboard") {
      router.push("/")
      setActiveTab("dashboard")
    } else {
      router.push(`/?tab=${tab}`)
      setActiveTab(tab)
    }
  }

  const handleClientClick = (shopId: string) => {
    router.push(`/clients/${shopId}`)
    setShowSearchResults(false)
    setSearchTerm("")
  }

  const handleLogout = () => {
    logout()
  }

  const getInitials = (name: string) => {
    return name?.substring(0, 2).toUpperCase() || "??"
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-30 bg-background/80 backdrop-blur-md border-b h-16 pl-16 md:pl-64 shadow-sm">
      <div className="flex items-center justify-between h-full px-4">
        {/* Left side - Empty or can be used for branding */}
        <div className="flex-1">{/* This space can be used for a logo or brand name if needed */}</div>

        {/* Right side - Controls */}
        <div className="flex items-center space-x-2">
          {/* Notification icon */}
          <div className="relative">
            <NotificationCenter />
          </div>

          {/* Search bar */}
          <div className="relative w-full max-w-[180px] sm:max-w-xs md:max-w-md mx-2" ref={searchRef}>
            <div className="relative group">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-200 z-10" />
              <Input
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setShowSearchResults(true)
                }}
                className="pl-10 w-full text-sm bg-background/80 hover:bg-background/90 focus:bg-background border-muted/50 focus:border-primary/50 transition-all duration-200 rounded-md"
                onFocus={() => setShowSearchResults(true)}
              />
            </div>
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-background/95 backdrop-blur-sm border rounded-md shadow-lg animate-fade-in overflow-hidden">
                {searchResults.map((result, index) => (
                  <div
                    key={result.shopId}
                    className={`p-3 hover:bg-primary/5 cursor-pointer transition-colors duration-150 ${
                      index !== searchResults.length - 1 ? "border-b border-border/50" : ""
                    }`}
                    onClick={() => handleClientClick(result.shopId)}
                  >
                    <div className="font-medium text-sm">{result.shopId}</div>
                    <div className="text-xs text-muted-foreground truncate">{result.clientName}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Theme toggle */}
          <div className="mx-1">
            <ModeToggle />
          </div>

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full h-9 w-9 p-0 ml-1 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-primary/10 scale-0 group-hover:scale-100 transition-transform duration-200 rounded-full"></div>
                <Avatar className="h-8 w-8 transition-transform group-hover:scale-105 duration-200">
                  <AvatarImage src={localStorage.getItem("userAvatar") || ""} alt="User avatar" />
                  <AvatarFallback className="bg-gradient-to-br from-gray-800 to-gray-900 text-white">
                    {user ? getInitials(user.username) : "??"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 overflow-hidden p-0">
              <div className="bg-primary/5 dark:bg-primary/10 px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-background">
                    <AvatarImage src={localStorage.getItem("userAvatar") || ""} alt="User avatar" />
                    <AvatarFallback className="bg-gradient-to-br from-gray-800 to-gray-900 text-white">
                      {user ? getInitials(user.username) : "??"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{user?.username}</p>
                    <p className="text-xs text-muted-foreground">{user?.role}</p>
                  </div>
                </div>
              </div>
              <div className="p-2">
                <DropdownMenuItem onClick={() => navigateTo("settings")} className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

interface NavButtonProps {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}

function NavButton({ icon, label, active, onClick }: NavButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn(
        "relative h-9 px-4 transition-all duration-200 overflow-hidden",
        active ? "text-primary font-medium" : "text-muted-foreground",
      )}
    >
      <div className="flex items-center">
        <span className={cn("mr-2", active ? "text-primary" : "text-muted-foreground")}>{icon}</span>
        <span>{label}</span>
      </div>
      {active && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full animate-fade-in" />}
    </Button>
  )
}
