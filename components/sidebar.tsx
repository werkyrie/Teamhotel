"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { useClientContext } from "@/context/client-context"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "./mode-toggle"
import NotificationCenter from "./notification/notification-center"
import { cn } from "@/lib/utils"
import {
  Home,
  Users,
  ShoppingBag,
  Wallet,
  ArrowDownCircle,
  Settings,
  LogOut,
  User,
  BarChart3,
  Shield,
  Menu,
  FileText,
  X,
  ChevronRight,
  ChevronDown,
  Database,
  ReceiptText,
  LineChart,
  Cog,
  LayoutDashboard,
  Video,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import OfflineDetector from "./offline-detector"
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import React from "react"

interface SidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

interface NavItemProps {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  label: string
  active: boolean
  onClick: () => void
  badge?: React.ReactNode
  collapsed?: boolean
}

const NavItem = React.memo(({ icon: Icon, label, active, onClick, badge, collapsed }: NavItemProps) => {
  return (
    <Button
      variant={active ? "default" : "ghost"}
      className={cn(
        "w-full justify-start transition-all duration-200 group pl-3 pr-2 py-2 h-auto",
        active ? "bg-primary text-primary-foreground font-medium" : "hover:bg-muted",
      )}
      onClick={onClick}
    >
      <div className="flex-shrink-0">
        <Icon className="h-5 w-5" />
      </div>
      <div className="ml-3 flex items-center justify-between w-full">
        <span className="text-sm">{label}</span>
        {badge && badge}
      </div>
    </Button>
  )
})

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const [isMobile, setIsMobile] = useState(isMobileInit())
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState({
    dashboard: true,
    clientData: true,
    transactions: true,
    analytics: true,
    system: true,
  })
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const router = useRouter()
  const { user, logout, isAdmin, isViewer } = useAuth()
  const { orderRequests } = useClientContext()
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      const savedState = localStorage.getItem("sidebarCollapsed")
      return savedState === "true"
    }
    return false
  })

  // Calculate pending order requests
  const pendingOrderRequests = orderRequests?.filter((request) => request.status === "Pending")?.length || 0

  function isMobileInit() {
    if (typeof window !== "undefined") {
      return window.innerWidth < 768
    }
    return false
  }

  // Check if mobile on mount and when window resizes
  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) {
        setCollapsed(true)
      } else {
        // On desktop, restore the saved collapsed state
        const savedState = localStorage.getItem("sidebarCollapsed")
        if (savedState !== null) {
          setCollapsed(savedState === "true")
        }
      }
    }

    // Initial check
    checkIfMobile()

    // Add event listener
    window.addEventListener("resize", checkIfMobile)

    // Cleanup
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  // Make sure the navigateTo function properly handles the dashboard case
  const navigateTo = (tab: string) => {
    if (tab === "dashboard") {
      router.push("/")
      setActiveTab("dashboard")
    } else if (tab === "addedclients") {
      router.push("/addedclients")
      setActiveTab("addedclients")
    } else {
      router.push(`/?tab=${tab}`)
      setActiveTab(tab)
    }

    // Close mobile menu if open
    if (isMobile) {
      setIsSheetOpen(false)
    }
  }

  const handleLogout = () => {
    logout()
  }

  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase()
  }

  // Get avatar based on role
  const getAvatarContent = () => {
    const customAvatar = localStorage.getItem("userAvatar")

    if (customAvatar) {
      return <AvatarImage src={customAvatar || "/placeholder.svg"} alt="User avatar" />
    }

    if (isAdmin) {
      return (
        <AvatarFallback className="bg-primary text-primary-foreground">
          <Shield className="h-5 w-5" />
        </AvatarFallback>
      )
    } else if (isViewer) {
      return (
        <AvatarFallback className="bg-gray-700 text-white">
          <User className="h-5 w-5" />
        </AvatarFallback>
      )
    } else {
      return (
        <AvatarFallback className="bg-gray-500 text-white">{user ? getInitials(user.username) : "?"}</AvatarFallback>
      )
    }
  }

  // Create order request badge
  const orderRequestBadge =
    pendingOrderRequests > 0 ? (
      <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full ml-auto animate-pulse">
        {pendingOrderRequests}
      </span>
    ) : null

  // Toggle group expansion
  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [group]: !prev[group],
    }))
  }

  const handleTabChange = useCallback(
    (tab: string) => {
      setActiveTab(tab)
      router.push(`/?tab=${tab}`)
    },
    [router, setActiveTab],
  )

  const toggleCollapse = useCallback(() => {
    setCollapsed(!collapsed)
    localStorage.setItem("sidebarCollapsed", String(!collapsed))
  }, [collapsed])

  // Define navigation structure
  const navStructure = [
    {
      title: "Dashboard",
      id: "dashboard",
      icon: <Home className="h-5 w-5" />,
      items: [
        {
          id: "dashboard",
          label: "Dashboard",
          icon: <Home className="h-6 w-6" />,
        },
        {
          id: "videocall",
          label: "Video Call Template",
          icon: <Video className="h-6 w-6" />,
        },
      ],
    },
    {
      title: "Client Data",
      id: "clientData",
      icon: <Database className="h-5 w-5" />,
      items: [
        {
          id: "clients",
          label: "Clients",
          icon: <Users className="h-6 w-6" />,
        },
      ],
    },
    {
      title: "Transactions",
      id: "transactions",
      icon: <ReceiptText className="h-5 w-5" />,
      items: [
        {
          id: "orders",
          label: "Orders",
          icon: <ShoppingBag className="h-6 w-6" />,
        },
        {
          id: "order-requests",
          label: "Order Requests",
          icon: <FileText className="h-6 w-6" />,
          badge: orderRequestBadge,
        },
        {
          id: "deposits",
          label: "Deposits",
          icon: <Wallet className="h-6 w-6" />,
        },
        {
          id: "withdrawals",
          label: "Withdrawals",
          icon: <ArrowDownCircle className="h-6 w-6" />,
        },
      ],
    },
    {
      title: "Analytics",
      id: "analytics",
      icon: <LineChart className="h-5 w-5" />,
      items: [
        {
          id: "team",
          label: "Team Performance",
          icon: <BarChart3 className="h-6 w-6" />,
        },
        {
          id: "reports",
          label: "Reports",
          icon: <FileText className="h-6 w-6" />,
        },
        {
          id: "inventory",
          label: "Inventory",
          icon: <Database className="h-6 w-6" />,
        },
        {
          id: "addedclients",
          label: "Added Clients",
          icon: <Users className="h-6 w-6" />,
        },
      ],
    },
    {
      title: "System",
      id: "system",
      icon: <Cog className="h-5 w-5" />,
      items: [
        {
          id: "settings",
          label: "Settings",
          icon: <Settings className="h-6 w-6" />,
        },
      ],
    },
  ]

  const navigationSections = useMemo(
    () => [
      {
        title: "Dashboard",
        items: [
          {
            icon: LayoutDashboard,
            label: "Dashboard",
            tab: "dashboard",
            onClick: () => handleTabChange("dashboard"),
          },
          {
            icon: Video,
            label: "Video Call Template",
            tab: "videocall",
            onClick: () => handleTabChange("videocall"),
          },
        ],
      },
      {
        title: "Client Data",
        items: [
          {
            icon: Users,
            label: "Clients",
            tab: "clients",
            onClick: () => handleTabChange("clients"),
          },
        ],
      },
      {
        title: "Transactions",
        items: [
          {
            icon: ShoppingBag,
            label: "Orders",
            tab: "orders",
            onClick: () => handleTabChange("orders"),
          },
          {
            icon: FileText,
            label: "Order Requests",
            tab: "order-requests",
            onClick: () => handleTabChange("order-requests"),
            badge:
              pendingOrderRequests > 0 ? (
                <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
                  {pendingOrderRequests}
                </span>
              ) : null,
          },
          {
            icon: Wallet,
            label: "Deposits",
            tab: "deposits",
            onClick: () => handleTabChange("deposits"),
          },
          {
            icon: ArrowDownCircle,
            label: "Withdrawals",
            tab: "withdrawals",
            onClick: () => handleTabChange("withdrawals"),
          },
        ],
      },
      {
        title: "Analytics",
        items: [
          {
            icon: BarChart3,
            label: "Team Performance",
            tab: "team",
            onClick: () => handleTabChange("team"),
          },
          {
            icon: FileText,
            label: "Reports",
            tab: "reports",
            onClick: () => handleTabChange("reports"),
          },
          {
            icon: Database,
            label: "Inventory",
            tab: "inventory",
            onClick: () => handleTabChange("inventory"),
          },
          {
            icon: Users,
            label: "Added Clients",
            tab: "addedclients",
            onClick: () => handleTabChange("addedclients"),
          },
        ],
      },
      {
        title: "System",
        items: [
          {
            icon: Settings,
            label: "Settings",
            tab: "settings",
            onClick: () => handleTabChange("settings"),
          },
        ],
      },
    ],
    [pendingOrderRequests, handleTabChange],
  )

  // Mobile sidebar using Sheet component
  if (isMobile) {
    return (
      <>
        <div className="fixed top-0 left-0 z-40 flex items-center h-16 px-4 bg-background border-b w-full">
          <div className="flex items-center">
            <span className="font-bold text-primary text-xl">CMS</span>
          </div>

          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open menu"
                className="ml-auto hover:bg-primary/10 transition-all duration-300"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0 sm:max-w-sm">
              <div className="flex flex-col h-full">
                {/* Header with close button */}
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="font-bold text-primary text-xl">CMS</div>
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Close menu"
                      className="hover:bg-primary/10 transition-all duration-300"
                    >
                      <X className="h-6 w-6" />
                    </Button>
                  </SheetClose>
                </div>

                {/* User info */}
                <div className="flex items-center p-4 border-b bg-muted/30">
                  <div className="relative">
                    <Avatar className="h-12 w-12 border-2 border-primary/20">{getAvatarContent()}</Avatar>
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></span>
                  </div>
                  <div className="ml-3">
                    <p className="font-medium">{user?.username}</p>
                    <p className="text-xs text-muted-foreground">{user?.role}</p>
                  </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-2">
                  {navStructure.map((group) => (
                    <div key={group.id} className="mb-2">
                      <div
                        className="flex items-center px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer"
                        onClick={() => toggleGroup(group.id)}
                      >
                        <div className="mr-2 transition-transform duration-200 hover:scale-110">{group.icon}</div>
                        <span className="ml-1">{group.title}</span>
                        <ChevronDown
                          className={cn(
                            "ml-auto h-5 w-5 transition-transform duration-300",
                            expandedGroups[group.id as keyof typeof expandedGroups] ? "transform rotate-180" : "",
                          )}
                        />
                      </div>
                      {expandedGroups[group.id as keyof typeof expandedGroups] && (
                        <ul className="mt-1 space-y-1 px-2 animate-slideInUp">
                          {group.items.map((item) => (
                            <li key={item.id}>
                              <Button
                                variant={activeTab === item.id ? "default" : "ghost"}
                                className={cn(
                                  "w-full justify-start transition-all duration-300 group pl-3 pr-2 py-3 h-auto",
                                  activeTab === item.id
                                    ? "bg-primary text-primary-foreground font-medium shadow-md"
                                    : "hover:bg-muted hover:scale-[1.02]",
                                )}
                                onClick={() => navigateTo(item.id)}
                                onMouseEnter={() => setHoveredItem(item.id)}
                                onMouseLeave={() => setHoveredItem(null)}
                              >
                                <div
                                  className={cn(
                                    "flex-shrink-0 transition-transform duration-300",
                                    hoveredItem === item.id && "scale-110",
                                  )}
                                >
                                  {item.icon}
                                </div>
                                <div className="ml-3 flex items-center justify-between w-full">
                                  <span className="text-sm font-medium">{item.label}</span>
                                  {item.badge && item.badge}
                                </div>
                              </Button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t">
                  <div className="flex items-center justify-between mb-4">
                    <OfflineDetector />
                    <NotificationCenter />
                    <ModeToggle />
                  </div>
                  <Button
                    variant="default"
                    className="w-full justify-start bg-gray-800 hover:bg-gray-700 text-white transition-all duration-300 hover:scale-[1.02]"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-6 w-6 mr-2" />
                    Logout
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Spacer to push content below the fixed header */}
        <div className="h-16"></div>
      </>
    )
  }

  // Desktop sidebar
  return (
    <TooltipProvider delayDuration={200}>
      <div
        className={`fixed left-0 top-0 z-30 flex h-screen flex-col border-r bg-background transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${
          collapsed ? "w-[80px]" : "w-[260px]"
        }`}
        style={{
          willChange: "width, transform",
          contain: "layout",
          position: "fixed", // Ensure it stays fixed
        }}
      >
        {/* Logo and collapse button */}
        <div className="flex items-center justify-between p-4 border-b h-16">
          {!collapsed && (
            <div className="flex items-center">
              <span className="font-bold text-primary text-xl">CMS</span>
            </div>
          )}
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="mx-auto transition-all duration-300 hover:bg-primary/10"
                  onClick={toggleCollapse}
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Expand Sidebar</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto transition-all duration-300 hover:bg-primary/10"
              onClick={toggleCollapse}
            >
              <ChevronRight className={cn("h-6 w-6 transition-transform duration-300", "rotate-180")} />
            </Button>
          )}
        </div>

        {/* User info */}
        <div
          className={cn(
            "flex items-center p-4 border-b bg-muted/30 transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)]",
            collapsed ? "justify-center" : "",
          )}
        >
          <div className="relative">
            <Avatar
              className={cn(
                "border-2 border-primary/20 transition-all duration-500 hover:border-primary/50 hover:scale-105",
                collapsed ? "h-10 w-10" : "h-12 w-12",
              )}
            >
              {getAvatarContent()}
            </Avatar>
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></span>
          </div>
          <div
            className={cn(
              "ml-3 flex-1 transition-all duration-500 ease-in-out overflow-hidden",
              collapsed ? "opacity-0 w-0" : "opacity-100 w-auto",
            )}
          >
            <p className="font-medium whitespace-nowrap">{user?.username}</p>
            <p className="text-xs text-muted-foreground whitespace-nowrap">{user?.role}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto h-8 w-8 transition-all duration-300 hover:bg-primary/10 active:scale-95"
            onClick={toggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronRight
              className={cn(
                "h-5 w-5 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                collapsed ? "" : "rotate-180",
              )}
            />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {navStructure.map((group) => (
            <div key={group.id} className="mb-4">
              {!collapsed && (
                <div
                  className="flex items-center px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors duration-200"
                  onClick={() => toggleGroup(group.id)}
                >
                  <div className="transition-transform duration-200 hover:scale-110">{group.icon}</div>
                  <span className="ml-2">{group.title}</span>
                  <ChevronDown
                    className={cn(
                      "ml-auto h-5 w-5 transition-transform duration-300",
                      expandedGroups[group.id as keyof typeof expandedGroups] ? "transform rotate-180" : "",
                    )}
                  />
                </div>
              )}
              {/* Section headers are not shown when collapsed */}
              {(expandedGroups[group.id as keyof typeof expandedGroups] || collapsed) && (
                <ul
                  className={cn(
                    "space-y-2",
                    collapsed ? "px-2 mb-4" : "px-3 mt-1",
                    !collapsed && expandedGroups[group.id as keyof typeof expandedGroups] && "animate-slideInUp",
                  )}
                >
                  {group.items.map((item) => (
                    <li key={item.id}>
                      {collapsed ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant={activeTab === item.id ? "default" : "ghost"}
                              className={cn(
                                "w-full justify-center transition-all duration-300 group p-3 h-16",
                                activeTab === item.id
                                  ? "bg-primary text-primary-foreground font-medium shadow-md"
                                  : "hover:bg-muted/70 hover:scale-105",
                              )}
                              onClick={() => navigateTo(item.id)}
                              onMouseEnter={() => setHoveredItem(item.id)}
                              onMouseLeave={() => setHoveredItem(null)}
                            >
                              <div className="flex items-center justify-center relative">
                                <div
                                  className={cn(
                                    "flex-shrink-0 transition-transform duration-300",
                                    (hoveredItem === item.id || activeTab === item.id) && "scale-110",
                                    activeTab === item.id ? "" : "text-muted-foreground group-hover:text-foreground",
                                  )}
                                >
                                  {item.icon}
                                </div>
                                {item.badge && <span className="absolute -top-2 -right-2 z-10">{item.badge}</span>}
                                {item.id === "addedclients" && (
                                  <span className="absolute -top-2 -right-2 h-2.5 w-2.5 bg-green-500 rounded-full animate-pulse"></span>
                                )}
                              </div>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent
                            side="right"
                            className="bg-primary text-primary-foreground font-medium px-3 py-1.5 text-sm"
                          >
                            <div className="flex items-center">
                              {item.label}
                              {item.id === "addedclients" && (
                                <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold bg-green-500 text-white rounded-md">
                                  NEW
                                </span>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Button
                          variant={activeTab === item.id ? "default" : "ghost"}
                          className={cn(
                            "w-full justify-start transition-all duration-300 group pl-3 pr-2 py-3 h-auto",
                            activeTab === item.id
                              ? "bg-primary text-primary-foreground font-medium shadow-md"
                              : "hover:bg-muted/70 hover:scale-[1.02]",
                          )}
                          onClick={() => navigateTo(item.id)}
                          onMouseEnter={() => setHoveredItem(item.id)}
                          onMouseLeave={() => setHoveredItem(null)}
                        >
                          <div
                            className={cn(
                              "flex-shrink-0 transition-transform duration-300",
                              (hoveredItem === item.id || activeTab === item.id) && "scale-110",
                            )}
                          >
                            {item.icon}
                          </div>
                          <div className="ml-3 flex items-center justify-between w-full">
                            <div className="flex items-center">
                              <span
                                className={cn(
                                  "text-sm font-medium",
                                  activeTab === item.id ? "" : "text-muted-foreground group-hover:text-foreground",
                                )}
                              >
                                {item.label}
                              </span>
                              {item.id === "addedclients" && (
                                <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold bg-green-500 text-white rounded-md animate-pulse">
                                  NEW
                                </span>
                              )}
                            </div>
                            {item.badge && item.badge}
                          </div>
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className={cn("p-4 border-t", collapsed ? "flex flex-col items-center" : "")}>
          {!collapsed ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <OfflineDetector />
                <NotificationCenter />
              </div>
              <ModeToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="transition-all duration-300 hover:bg-red-500/10 hover:text-red-500"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-5">
              <OfflineDetector />
              <NotificationCenter />
              <ModeToggle />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className="h-10 w-10 transition-all duration-300 hover:bg-red-500/10 hover:text-red-500"
                  >
                    <LogOut className="h-6 w-6" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Logout</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
