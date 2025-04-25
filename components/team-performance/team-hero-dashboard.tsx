"use client"

import type React from "react"

import { useTeamContext } from "@/context/team-context"
import { Card, CardContent } from "@/components/ui/card"
import { Users, CalendarPlus, Calendar, Briefcase, Wallet, TrendingUp, TrendingDown } from "lucide-react"

export default function TeamHeroDashboard() {
  const { metrics } = useTeamContext()

  // Sample trend data (you can replace with actual data)
  const trends = {
    totalAgents: { value: 5.2, positive: true },
    totalAddedToday: { value: 12.8, positive: true },
    totalMonthlyAdded: { value: 8.3, positive: true },
    totalOpenAccounts: { value: 2.1, positive: false },
    totalDeposits: { value: 7.5, positive: true },
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <MetricCard
        title="Total Agents"
        value={metrics.totalAgents}
        icon={<Users className="h-5 w-5 text-slate-600 dark:text-slate-300" />}
        trend={trends.totalAgents}
        className="team-metrics-card animate-fade-in shadow-sm hover:shadow-lg transition-all duration-300"
        bgColor="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/40 dark:to-slate-800/60"
        iconBgColor="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700/50 dark:to-slate-700/70"
      />

      <MetricCard
        title="Added Today"
        value={metrics.totalAddedToday}
        icon={<CalendarPlus className="h-5 w-5 text-slate-600 dark:text-slate-300" />}
        trend={trends.totalAddedToday}
        className="team-metrics-card animate-fade-in shadow-sm hover:shadow-lg transition-all duration-300"
        bgColor="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/40 dark:to-slate-800/60"
        iconBgColor="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700/50 dark:to-slate-700/70"
      />

      <MetricCard
        title="Monthly Added"
        value={metrics.totalMonthlyAdded}
        icon={<Calendar className="h-5 w-5 text-slate-600 dark:text-slate-300" />}
        trend={trends.totalMonthlyAdded}
        className="team-metrics-card animate-fade-in shadow-sm hover:shadow-lg transition-all duration-300"
        bgColor="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/40 dark:to-slate-800/60"
        iconBgColor="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700/50 dark:to-slate-700/70"
      />

      <MetricCard
        title="Open Accounts"
        value={metrics.totalOpenAccounts}
        icon={<Briefcase className="h-5 w-5 text-slate-600 dark:text-slate-300" />}
        trend={trends.totalOpenAccounts}
        className="team-metrics-card animate-fade-in shadow-sm hover:shadow-lg transition-all duration-300"
        bgColor="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/40 dark:to-slate-800/60"
        iconBgColor="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700/50 dark:to-slate-700/70"
      />

      <MetricCard
        title="Total Deposits"
        value={`$${metrics.totalDeposits.toLocaleString()}`}
        icon={<Wallet className="h-5 w-5 text-slate-600 dark:text-slate-300" />}
        trend={trends.totalDeposits}
        className="team-metrics-card animate-fade-in shadow-sm hover:shadow-lg transition-all duration-300"
        bgColor="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/40 dark:to-slate-800/60"
        iconBgColor="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700/50 dark:to-slate-700/70"
      />
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  trend: { value: number; positive: boolean }
  className?: string
  bgColor: string
  iconBgColor: string
}

function MetricCard({ title, value, icon, trend, className, bgColor, iconBgColor }: MetricCardProps) {
  return (
    <Card
      className={`${className} ${bgColor} border border-slate-200/50 dark:border-slate-700/50 overflow-hidden backdrop-blur-sm`}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{value}</p>

            {/* Trend indicator */}
            <div
              className={`flex items-center mt-2 text-xs font-medium ${
                trend.positive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {trend.positive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              <span>{trend.value}% from last period</span>
            </div>
          </div>
          <div
            className={`p-3 rounded-full ${iconBgColor} shadow-sm border border-slate-200/50 dark:border-slate-700/50 transform transition-transform hover:scale-105 duration-300`}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
