import { Crown, Shield, Hexagon, Star, Gem, Flame, Zap } from "lucide-react"
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
      return "text-red-600 dark:text-red-400"
    case 4:
      return "text-purple-600 dark:text-purple-400"
    case 5:
      return "text-cyan-600 dark:text-cyan-400"
    case 6:
      return "text-yellow-600 dark:text-yellow-400"
    case 7:
      return "text-gray-300 dark:text-gray-400"
    default:
      return "text-amber-700 dark:text-amber-600"
  }
}

interface RankBadgeProps {
  rank: number
  className?: string
}

export function RankBadge({ rank, className }: RankBadgeProps) {
  // Determine badge style based on rank
  switch (rank) {
    case 1: // Mythic Glory - Ultimate rank with rainbow effects
      return (
        <div className={cn("relative flex items-center justify-center", className)}>
          {/* Outer glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 via-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 rounded-full blur-md opacity-60 animate-spin-slow"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full blur-sm opacity-40 animate-pulse-slow"></div>

          {/* Main badge */}
          <div className="relative w-12 h-12 bg-gradient-to-br from-purple-600 via-pink-500 to-yellow-400 rounded-full flex items-center justify-center border-4 border-yellow-300 shadow-2xl">
            {/* Inner glow */}
            <div className="absolute inset-1 bg-gradient-to-br from-white/20 to-transparent rounded-full"></div>
            <Crown className="w-6 h-6 text-white drop-shadow-lg relative z-10" />

            {/* Decorative elements */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping-slow"></div>
            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
          </div>
        </div>
      )

    case 2: // Mythic - High-tier with cosmic theme
      return (
        <div className={cn("relative flex items-center justify-center", className)}>
          {/* Outer effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full blur-sm opacity-50 animate-pulse-slow"></div>

          {/* Main badge */}
          <div className="relative w-11 h-11 bg-gradient-to-br from-pink-600 via-purple-600 to-indigo-600 rounded-full flex items-center justify-center border-3 border-pink-300 shadow-xl">
            <div className="absolute inset-1 bg-gradient-to-br from-white/15 to-transparent rounded-full"></div>
            <Star className="w-5 h-5 text-white drop-shadow-md relative z-10" />

            {/* Decorative stars */}
            <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-pink-300 rounded-full animate-pulse"></div>
            <div className="absolute -right-0.5 top-1/2 transform -translate-y-1/2 w-1 h-1 bg-purple-300 rounded-full animate-pulse"></div>
          </div>
        </div>
      )

    case 3: // Legend - Fiery red/orange theme
      return (
        <div className={cn("relative flex items-center justify-center", className)}>
          {/* Fire glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-orange-500 rounded-full blur-sm opacity-50 animate-pulse"></div>

          {/* Main badge with flame shape */}
          <div className="relative w-10 h-10 bg-gradient-to-br from-red-600 via-orange-500 to-yellow-500 clip-path-flame flex items-center justify-center border-2 border-orange-300 shadow-lg">
            <div className="absolute inset-1 bg-gradient-to-br from-white/20 to-transparent clip-path-flame"></div>
            <Flame className="w-4 h-4 text-white drop-shadow-md relative z-10" />

            {/* Flame particles */}
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-yellow-400 rounded-full animate-bounce-slow"></div>
          </div>
        </div>
      )

    case 4: // Epic - Purple gem theme
      return (
        <div className={cn("relative flex items-center justify-center", className)}>
          {/* Gem glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-violet-500 clip-path-diamond blur-sm opacity-50"></div>

          {/* Main diamond badge */}
          <div className="relative w-10 h-10 bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-600 clip-path-diamond flex items-center justify-center border-2 border-purple-300 shadow-lg">
            <div className="absolute inset-1 bg-gradient-to-br from-white/25 to-transparent clip-path-diamond"></div>
            <Gem className="w-4 h-4 text-white drop-shadow-md relative z-10" />

            {/* Sparkle effects */}
            <div className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-purple-300 rounded-full animate-ping"></div>
            <div
              className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-violet-300 rounded-full animate-ping"
              style={{ animationDelay: "0.5s" }}
            ></div>
          </div>
        </div>
      )

    case 5: // Grandmaster - Crystal blue theme
      return (
        <div className={cn("relative flex items-center justify-center", className)}>
          {/* Crystal glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-500 clip-path-hexagon blur-sm opacity-50"></div>

          {/* Main hexagonal badge */}
          <div className="relative w-9 h-9 bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-600 clip-path-hexagon flex items-center justify-center border-2 border-cyan-300 shadow-lg">
            <div className="absolute inset-1 bg-gradient-to-br from-white/20 to-transparent clip-path-hexagon"></div>
            <Zap className="w-4 h-4 text-white drop-shadow-md relative z-10" />

            {/* Electric effects */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0.5 h-2 bg-cyan-300 animate-pulse"></div>
          </div>
        </div>
      )

    case 6: // Master - Golden theme
      return (
        <div className={cn("relative flex items-center justify-center", className)}>
          {/* Golden glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 to-amber-500 clip-path-shield blur-sm opacity-50"></div>

          {/* Main shield badge */}
          <div className="relative w-9 h-9 bg-gradient-to-br from-yellow-600 via-amber-600 to-orange-600 clip-path-shield flex items-center justify-center border-2 border-yellow-300 shadow-lg">
            <div className="absolute inset-1 bg-gradient-to-br from-white/25 to-transparent clip-path-shield"></div>
            <Shield className="w-4 h-4 text-white drop-shadow-md relative z-10" />

            {/* Golden accents */}
            <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-yellow-300 rounded-full"></div>
          </div>
        </div>
      )

    case 7: // Elite - Silver theme
      return (
        <div className={cn("relative flex items-center justify-center", className)}>
          {/* Silver glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-400 to-slate-400 clip-path-hexagon blur-sm opacity-40"></div>

          {/* Main hexagonal badge */}
          <div className="relative w-8 h-8 bg-gradient-to-br from-gray-500 via-slate-500 to-zinc-500 clip-path-hexagon flex items-center justify-center border-2 border-gray-300 shadow-md">
            <div className="absolute inset-1 bg-gradient-to-br from-white/15 to-transparent clip-path-hexagon"></div>
            <Hexagon className="w-3 h-3 text-white drop-shadow-sm relative z-10" />
          </div>
        </div>
      )

    default: // Warrior - Bronze theme (8-10)
      return (
        <div className={cn("relative flex items-center justify-center", className)}>
          {/* Bronze glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-700 to-orange-700 rounded-full blur-sm opacity-40"></div>

          {/* Main circular badge */}
          <div className="relative w-7 h-7 bg-gradient-to-br from-amber-800 via-orange-800 to-red-900 rounded-full flex items-center justify-center border-2 border-amber-600 shadow-md">
            <div className="absolute inset-1 bg-gradient-to-br from-white/10 to-transparent rounded-full"></div>
            <span className="text-xs font-bold text-amber-200 drop-shadow-sm relative z-10">{rank}</span>
          </div>
        </div>
      )
  }
}
