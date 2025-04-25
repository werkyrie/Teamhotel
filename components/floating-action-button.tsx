"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Plus, FileText, Edit2, BarChart2, UserPlus } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/auth-context"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function FloatingActionButton() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null)
  const router = useRouter()
  const { isAdmin, isAuthenticated } = useAuth()
  const containerRef = useRef<HTMLDivElement>(null)

  // Check if mobile on mount and when window resizes
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Initial check
    checkIfMobile()

    // Add event listener
    window.addEventListener("resize", checkIfMobile)

    // Cleanup
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (isExpanded && containerRef.current && !containerRef.current.contains(target)) {
        setIsExpanded(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isExpanded])

  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  const handleNavigation = (path: string) => {
    setIsExpanded(false)
    router.push(path)
  }

  const actionItems = [
    {
      id: "add-client",
      label: "Add Client",
      description: "Create a new client profile in the system",
      icon: <UserPlus className="h-5 w-5" />,
      onClick: () => handleNavigation("/addedclients"),
      position: "translate-y-[-180px]",
      mobilePosition: "translate-y-[-180px]",
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      id: "create-report",
      label: "Create a Report",
      description: "Generate financial or performance reports",
      icon: <BarChart2 className="h-5 w-5" />,
      onClick: () => handleNavigation("/?tab=reports"),
      position: "translate-y-[-135px]",
      mobilePosition: "translate-y-[-135px]",
      color: "bg-purple-600 hover:bg-purple-700",
    },
    {
      id: "edit-table",
      label: "Edit Table",
      description: "Manage agent performance data",
      icon: <Edit2 className="h-5 w-5" />,
      onClick: () => handleNavigation("/?tab=team"),
      position: "translate-y-[-90px]",
      mobilePosition: "translate-y-[-90px]",
      color: "bg-amber-600 hover:bg-amber-700",
    },
    {
      id: "request-order",
      label: "Request an Order",
      description: "Create a new order request for processing",
      icon: <FileText className="h-5 w-5" />,
      onClick: () => handleNavigation("/?tab=order-requests"),
      position: "translate-y-[-45px]",
      mobilePosition: "translate-y-[-45px]",
      color: "bg-green-600 hover:bg-green-700",
    },
  ]

  // Only render for authenticated users
  if (!isAuthenticated) {
    return null
  }

  return (
    <TooltipProvider>
      <div ref={containerRef} className="floating-action-button-container fixed bottom-6 right-6 z-50">
        {/* Action Items */}
        {actionItems.map((item) => (
          <Tooltip key={item.id} open={activeTooltip === item.id}>
            <TooltipTrigger asChild>
              <button
                onClick={item.onClick}
                onMouseEnter={() => !isMobile && isExpanded && setActiveTooltip(item.id)}
                onMouseLeave={() => setActiveTooltip(null)}
                className={cn(
                  "absolute bottom-0 right-0 flex items-center justify-center transition-all duration-300 ease-in-out",
                  isExpanded
                    ? isMobile
                      ? item.mobilePosition
                      : item.position
                    : "translate-y-0 opacity-0 pointer-events-none",
                  "hover:scale-105 active:scale-95",
                  "focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50",
                  isExpanded ? "w-auto min-w-[14rem] pl-4 pr-5 rounded-full shadow-lg" : "w-14 h-14 rounded-full",
                  item.color,
                )}
                aria-label={item.label}
              >
                <div className={cn("flex items-center", isExpanded ? "justify-start w-full" : "justify-center")}>
                  <div
                    className={cn(
                      "flex items-center justify-center",
                      isExpanded ? "h-10 w-10 rounded-full bg-white bg-opacity-20" : "",
                    )}
                  >
                    {item.icon}
                  </div>
                  {isExpanded && <span className="ml-3 font-medium text-white whitespace-nowrap">{item.label}</span>}
                </div>
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-[200px]">
              <p className="text-xs">{item.description}</p>
            </TooltipContent>
          </Tooltip>
        ))}

        {/* Main FAB Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={toggleExpand}
              className={cn(
                "flex items-center justify-center rounded-full bg-gray-900 text-white shadow-lg transition-all duration-300 hover:bg-gray-800",
                "hover:scale-105 active:scale-95",
                "focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50",
                isExpanded ? "rotate-45 transform h-16 w-16" : "h-16 w-16",
              )}
              aria-label={isExpanded ? "Close actions menu" : "Open actions menu"}
            >
              <Plus className="h-8 w-8" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>{isExpanded ? "Close menu" : "Quick access to common tasks"}</p>
          </TooltipContent>
        </Tooltip>

        {/* Mobile Action Cards - Keeping this for very small screens */}
        {isMobile && isExpanded && (
          <div className="absolute bottom-20 right-0 w-64 space-y-2 rounded-lg bg-gray-800 p-3 text-white shadow-lg md:hidden">
            <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-gray-400">
              Quick Actions
            </p>
            {actionItems.map((item) => (
              <div
                key={`card-${item.id}`}
                className="cursor-pointer rounded-lg bg-gray-700 px-4 py-3 transition-all hover:bg-gray-600 active:scale-95"
                onClick={item.onClick}
              >
                <div className="flex items-center">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full",
                      item.color.split(" ")[0], // Use just the base color class
                    )}
                  >
                    {item.icon}
                  </div>
                  <div className="ml-3">
                    <p className="font-medium">{item.label}</p>
                    <p className="text-xs text-gray-300">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
