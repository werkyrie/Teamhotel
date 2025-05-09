import { Crown, Shield, Hexagon, Pentagon } from "lucide-react"
import { cn } from "@/lib/utils"

// Function to get rank name based on position
export function getRankName(rank: number): string {
  switch (rank) {
    case 1:
      return "Mythic Glory"
    case 2:
      return "Mythic"
    case 3:
      return "Legend"
    case 4:
      return "Epic"
    case 5:
      return "Grandmaster"
    case 6:
      return "Master"
    case 7:
      return "Elite"
    default:
      return "Warrior"
  }
}

// Function to get text color based on rank
export function getRankTextColor(rank: number): string {
  switch (rank) {
    case 1:
      return "text-purple-600 dark:text-purple-400"
    case 2:
      return "text-pink-600 dark:text-pink-400"
    case 3:
      return "text-amber-600 dark:text-amber-400"
    case 4:
      return "text-emerald-600 dark:text-emerald-400"
    case 5:
      return "text-blue-600 dark:text-blue-400"
    case 6:
      return "text-yellow-600 dark:text-yellow-400"
    case 7:
      return "text-gray-600 dark:text-gray-400"
    default:
      return "text-amber-800 dark:text-amber-600"
  }
}

interface RankBadgeProps {
  rank: number
  className?: string
}

export function RankBadge({ rank, className }: RankBadgeProps) {
  // Determine badge style based on rank
  switch (rank) {
    case 1: // Mythic Glory - Purple and gold badge with crown
      return (
        <div className={cn("relative flex items-center justify-center", className)}>
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-yellow-400 rounded-full blur-[2px] opacity-50"></div>
          <div className="relative w-10 h-10 bg-gradient-to-br from-purple-600 to-yellow-500 rounded-full flex items-center justify-center border-2 border-yellow-300 shadow-lg animate-pulse-slow">
            <Crown className="w-5 h-5 text-white" />
          </div>
        </div>
      )

    case 2: // Mythic - Pink and gold badge
      return (
        <div className={cn("relative flex items-center justify-center", className)}>
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-yellow-400 rounded-full blur-[1px] opacity-40"></div>
          <div className="relative w-9 h-9 bg-gradient-to-br from-pink-600 to-yellow-500 rounded-full flex items-center justify-center border-2 border-yellow-300 shadow-md">
            <span className="text-xs font-bold text-white">2</span>
          </div>
        </div>
      )

    case 3: // Legend - Amber and gold shield badge
      return (
        <div className={cn("relative flex items-center justify-center", className)}>
          <div className="w-9 h-9 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-yellow-400 clip-path-shield-pointed blur-[1px] opacity-40"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-amber-600 to-yellow-500 clip-path-shield-pointed flex items-center justify-center border-2 border-yellow-300 shadow-md">
              <Shield className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      )

    case 4: // Epic - Teal/emerald pentagon badge
      return (
        <div className={cn("relative flex items-center justify-center", className)}>
          <div className="w-8 h-8 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500 to-emerald-400 clip-path-pentagon blur-[1px] opacity-40"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-teal-600 to-emerald-500 clip-path-pentagon flex items-center justify-center border border-emerald-300 shadow-md">
              <Pentagon className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      )

    case 5: // Grandmaster - Blue shield badge
      return (
        <div className={cn("relative flex items-center justify-center", className)}>
          <div className="w-8 h-8 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-400 clip-path-shield blur-[1px] opacity-40"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-cyan-500 clip-path-shield flex items-center justify-center border border-blue-300 shadow-md">
              <span className="text-xs font-bold text-white">5</span>
            </div>
          </div>
        </div>
      )

    case 6: // Master - Gold shield badge
      return (
        <div className={cn("relative flex items-center justify-center", className)}>
          <div className="w-8 h-8 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 to-yellow-300 clip-path-shield blur-[1px] opacity-40"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-600 to-yellow-400 clip-path-shield flex items-center justify-center border border-yellow-200 shadow-md">
              <span className="text-xs font-bold text-white">6</span>
            </div>
          </div>
        </div>
      )

    case 7: // Elite - Silver hexagon badge
      return (
        <div className={cn("relative flex items-center justify-center", className)}>
          <div className="w-8 h-8 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-400 to-gray-300 clip-path-hexagon blur-[1px] opacity-40"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-gray-500 to-gray-400 clip-path-hexagon flex items-center justify-center border border-gray-200 shadow-md">
              <Hexagon className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      )

    default: // Warrior - Bronze shield badge (8-10)
      return (
        <div className={cn("relative flex items-center justify-center", className)}>
          <div className="w-7 h-7 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-700 to-amber-500 clip-path-shield-round blur-[1px] opacity-40"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-amber-800 to-amber-600 clip-path-shield-round flex items-center justify-center border border-amber-400 shadow-md">
              <span className="text-xs font-bold text-white">{rank}</span>
            </div>
          </div>
        </div>
      )
  }
}
