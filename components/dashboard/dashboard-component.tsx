"use client"

import { useState, useEffect } from "react"
import { useClientContext } from "@/context/client-context"
import { useAuth } from "@/context/auth-context"
import { differenceInDays, format, subMonths, startOfMonth, endOfMonth } from "date-fns"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  ArrowRight,
  Users,
  ShoppingBag,
  CreditCard,
  TrendingUp,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Activity,
  Trophy,
} from "lucide-react"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"

import WelcomeHero from "./welcome-hero"
import DebugDashboard from "./debug-dashboard"
import { RankBadge, getRankName, getRankTextColor } from "./rank-badges"
import { RankShowcase } from "./rank-showcase"

export default function DashboardComponent() {
  const router = useRouter()
  const { clients, orders, deposits, withdrawals, orderRequests } = useClientContext()
  const { isAdmin, isDebugMode, user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [inactiveOrderClients, setInactiveOrderClients] = useState<any[]>([])
  const [inactiveDepositClients, setInactiveDepositClients] = useState<any[]>([])
  const [pendingOrderRequests, setPendingOrderRequests] = useState<any[]>([])
  const [selectedMonth, setSelectedMonth] = useState<string>("current")
  const [topAgents, setTopAgents] = useState<any[]>([])
  const [showRankInfo, setShowRankInfo] = useState(false)
  const [stats, setStats] = useState({
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalOrders: 0,
    activeClients: 0,
    inactiveClients: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    monthlyDeposits: 0,
    monthlyWithdrawals: 0,
    monthlyOrders: 0,
  })
  const [globalMonthFilter, setGlobalMonthFilter] = useState<string>("current")

  // Get date range based on month filter
  const getDateRangeFromFilter = (monthFilter: string) => {
    const today = new Date()
    let startDate, endDate

    if (monthFilter === "current") {
      startDate = startOfMonth(today)
      endDate = today
    } else if (monthFilter === "all") {
      startDate = new Date(2000, 0, 1) // Far in the past
      endDate = today
    } else {
      // Parse the month value (e.g., "1" for 1 month ago)
      const monthsAgo = Number.parseInt(monthFilter)
      const targetMonth = subMonths(today, monthsAgo)
      startDate = startOfMonth(targetMonth)
      endDate = endOfMonth(targetMonth)
    }

    return { startDate, endDate }
  }

  useEffect(() => {
    // Reduce loading time to make it feel more instant
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!orderRequests) return

    const pending = orderRequests.filter((req) => req.status === "Pending")
    setPendingOrderRequests(pending)

    // Update stats
    const approved = orderRequests.filter((req) => req.status === "Approved").length
    const rejected = orderRequests.filter((req) => req.status === "Rejected").length

    setStats((prev) => ({
      ...prev,
      pendingRequests: pending.length,
      approvedRequests: approved,
      rejectedRequests: rejected,
    }))
  }, [orderRequests])

  // Calculate top agents based on selected month
  useEffect(() => {
    if (!deposits || !clients) return

    let filteredDeposits = [...deposits]

    // Filter deposits based on selected month
    if (selectedMonth !== "all") {
      let startDate, endDate

      if (selectedMonth === "current") {
        const now = new Date()
        startDate = startOfMonth(now)
        endDate = endOfMonth(now)
      } else {
        // Parse the month value (e.g., "1" for 1 month ago)
        const monthsAgo = Number.parseInt(selectedMonth)
        const now = new Date()
        const targetMonth = subMonths(now, monthsAgo)
        startDate = startOfMonth(targetMonth)
        endDate = endOfMonth(targetMonth)
      }

      filteredDeposits = deposits.filter((deposit) => {
        const depositDate = new Date(deposit.date)
        return depositDate >= startDate && depositDate <= endDate
      })
    }

    // Calculate deposits by agent
    const agentDeposits: Record<string, number> = {}
    const agentClients: Record<string, Set<string>> = {}

    filteredDeposits.forEach((deposit) => {
      const { agent, amount, shopId } = deposit

      if (!agent) return

      if (!agentDeposits[agent]) {
        agentDeposits[agent] = 0
        agentClients[agent] = new Set()
      }

      agentDeposits[agent] += amount
      agentClients[agent].add(shopId)
    })

    // Convert to array and sort
    const sortedAgents = Object.entries(agentDeposits)
      .map(([agent, value]) => ({
        agent,
        value,
        clientCount: agentClients[agent].size,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)

    // Calculate percentages
    const maxDeposit = sortedAgents.length > 0 ? sortedAgents[0].value : 0

    const agentsWithPercentage = sortedAgents.map((item) => ({
      ...item,
      percentage: maxDeposit > 0 ? (item.value / maxDeposit) * 100 : 0,
    }))

    setTopAgents(agentsWithPercentage)
  }, [deposits, clients, selectedMonth])

  useEffect(() => {
    if (!clients || !orders || !deposits || !withdrawals) return

    const { startDate, endDate } = getDateRangeFromFilter(globalMonthFilter)

    // Calculate filtered stats
    const filteredDeposits = deposits.filter((d) => new Date(d.date) >= startDate && new Date(d.date) <= endDate)

    const filteredWithdrawals = withdrawals.filter((w) => new Date(w.date) >= startDate && new Date(w.date) <= endDate)

    const filteredOrders = orders.filter((o) => new Date(o.date) >= startDate && new Date(o.date) <= endDate)

    // Calculate total stats (unfiltered)
    const totalDeposits = deposits.reduce((sum, d) => sum + d.amount, 0)
    const totalWithdrawals = withdrawals.reduce((sum, w) => sum + w.amount, 0)
    const activeClients = clients.filter((c) => c.status === "Active").length
    const inactiveClients = clients.filter((c) => c.status !== "Active").length

    // Calculate filtered stats
    const periodDeposits = filteredDeposits.reduce((sum, d) => sum + d.amount, 0)
    const periodWithdrawals = filteredWithdrawals.reduce((sum, w) => sum + w.amount, 0)

    // Initialize rejected before using it
    const rejected = orderRequests ? orderRequests.filter((req) => req.status === "Rejected").length : 0

    setStats({
      totalDeposits,
      totalWithdrawals,
      totalOrders: orders.length,
      activeClients,
      inactiveClients,
      pendingRequests: stats.pendingRequests,
      approvedRequests: stats.approvedRequests,
      rejectedRequests: rejected,
      monthlyDeposits: periodDeposits,
      monthlyWithdrawals: periodWithdrawals,
      monthlyOrders: filteredOrders.length,
    })

    const activeClientsList = clients.filter((client) => client.status === "Active")

    // Find clients with order inactivity
    const orderInactiveClients = activeClientsList
      .map((client) => {
        const clientOrders = orders.filter((order) => order.shopId === client.shopId)

        if (clientOrders.length > 0) {
          // Sort orders by date (newest first)
          clientOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

          const latestOrderDate = new Date(clientOrders[0].date)
          const daysSinceLastOrder = differenceInDays(new Date(), latestOrderDate)

          return {
            ...client,
            daysSinceLastOrder,
            hasInactivity: daysSinceLastOrder >= 2,
          }
        } else {
          return {
            ...client,
            daysSinceLastOrder: null,
            hasInactivity: true,
          }
        }
      })
      .filter((client) => client.hasInactivity)

    // Find clients with deposit inactivity
    const depositInactiveClients = activeClientsList
      .map((client) => {
        const clientDeposits = deposits.filter((deposit) => deposit.shopId === client.shopId)

        if (clientDeposits.length > 0) {
          // Sort deposits by date (newest first)
          clientDeposits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

          const latestDepositDate = new Date(clientDeposits[0].date)
          const daysSinceLastDeposit = differenceInDays(new Date(), latestDepositDate)

          return {
            ...client,
            daysSinceLastDeposit,
            hasInactivity: daysSinceLastDeposit >= 3,
          }
        } else {
          return {
            ...client,
            daysSinceLastDeposit: null,
            hasInactivity: true,
          }
        }
      })
      .filter((client) => client.hasInactivity)

    setInactiveOrderClients(orderInactiveClients)
    setInactiveDepositClients(depositInactiveClients)
  }, [clients, orders, deposits, withdrawals, globalMonthFilter, orderRequests])

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="mb-8">
          <Card className="w-full border-slate-200 dark:border-slate-700">
            <CardContent className="p-6">
              <Skeleton className="h-12 w-3/4 mb-4 bg-slate-200 dark:bg-slate-700" />
              <Skeleton className="h-6 w-1/2 bg-slate-200 dark:bg-slate-700" />
            </CardContent>
          </Card>
        </div>

        <div className="mb-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-1/4 bg-slate-200 dark:bg-slate-700" />
            <Skeleton className="h-8 w-[200px] bg-slate-200 dark:bg-slate-700" />
          </div>
          <Skeleton className="h-4 w-1/3 mt-2 bg-slate-200 dark:bg-slate-700" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-slate-200 dark:border-slate-700">
              <CardHeader className="pb-2 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                <Skeleton className="h-6 w-1/2 bg-slate-200 dark:bg-slate-700" />
              </CardHeader>
              <CardContent className="pt-4">
                <Skeleton className="h-8 w-1/2 mb-2 bg-slate-200 dark:bg-slate-700" />
                <Skeleton className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (isDebugMode) {
    return <DebugDashboard />
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  // Generate a consistent color based on agent name
  const getAgentColor = (agent: string) => {
    const colors = [
      "bg-blue-500",
      "bg-purple-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-red-500",
      "bg-orange-500",
      "bg-teal-500",
      "bg-cyan-500",
    ]

    // Simple hash function to get a consistent index
    const hash = agent.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  // Get month name for display
  const getMonthName = (value: string) => {
    if (value === "current") return "Current Month"
    if (value === "all") return "All Time"

    const monthsAgo = Number.parseInt(value)
    const date = subMonths(new Date(), monthsAgo)
    return format(date, "MMMM yyyy")
  }

  return (
    <div className="container mx-auto p-4 animate-fade-in">
      {/* Welcome Section */}
      <div className="mb-8">
        <WelcomeHero />
      </div>

      {/* Global Month Filter */}
      <div className="mb-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Dashboard Time Period
          </h3>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={globalMonthFilter} onValueChange={setGlobalMonthFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current Month</SelectItem>
                <SelectItem value="1">Last Month</SelectItem>
                <SelectItem value="2">2 Months Ago</SelectItem>
                <SelectItem value="3">3 Months Ago</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Showing data for: <span className="font-medium">{getMonthName(globalMonthFilter)}</span>
        </p>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Stats Cards */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="overflow-hidden border-slate-200 dark:border-slate-800 h-full">
            <CardHeader className="pb-2 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-slate-500" />
                Clients
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-3xl font-bold mb-2">{clients?.length || 0}</div>
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{stats.activeClients} Active</span>
                </div>
                <div className="flex items-center gap-1 text-orange-500">
                  <AlertCircle className="h-4 w-4" />
                  <span>{stats.inactiveClients} Inactive</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs w-full justify-between"
                onClick={() => router.push("/?tab=clients")}
              >
                <span>View all clients</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </CardFooter>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="overflow-hidden border-slate-200 dark:border-slate-800 h-full">
            <CardHeader className="pb-2 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-slate-500" />
                Orders
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-3xl font-bold mb-2">{stats.totalOrders}</div>
              <div className="flex items-center gap-1 text-sm text-blue-600">
                <TrendingUp className="h-4 w-4" />
                <span>{stats.monthlyOrders} this month</span>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs w-full justify-between"
                onClick={() => router.push("/?tab=orders")}
              >
                <span>View all orders</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </CardFooter>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="overflow-hidden border-slate-200 dark:border-slate-800 h-full">
            <CardHeader className="pb-2 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-slate-500" />
                Deposits
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-3xl font-bold mb-2">{formatCurrency(stats.totalDeposits)}</div>
              <div className="flex items-center gap-1 text-sm text-green-600">
                <TrendingUp className="h-4 w-4" />
                <span>{formatCurrency(stats.monthlyDeposits)} this month</span>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs w-full justify-between"
                onClick={() => router.push("/?tab=deposits")}
              >
                <span>View all deposits</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </CardFooter>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="overflow-hidden border-slate-200 dark:border-slate-800 h-full">
            <CardHeader className="pb-2 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-slate-500" />
                Withdrawals
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-3xl font-bold mb-2">{formatCurrency(stats.totalWithdrawals)}</div>
              <div className="flex items-center gap-1 text-sm text-red-500">
                <Activity className="h-4 w-4" />
                <span>{formatCurrency(stats.monthlyWithdrawals)} this month</span>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs w-full justify-between"
                onClick={() => router.push("/?tab=withdrawals")}
              >
                <span>View all withdrawals</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="space-y-4">
        {/* Top Agents Card (Full Width) */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card className="overflow-hidden border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-2 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Top Performing Agents
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => setShowRankInfo(!showRankInfo)}
                  >
                    {showRankInfo ? "Hide Ranks" : "View Ranks"}
                  </Button>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-[180px] h-8 text-xs">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={globalMonthFilter}>Same as Dashboard</SelectItem>
                      <SelectItem value="current">Current Month</SelectItem>
                      <SelectItem value="1">Last Month</SelectItem>
                      <SelectItem value="2">2 Months Ago</SelectItem>
                      <SelectItem value="3">3 Months Ago</SelectItem>
                      <SelectItem value="all">All Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <CardDescription>
                Agent performance for{" "}
                {selectedMonth === globalMonthFilter
                  ? `Same as Dashboard (${getMonthName(globalMonthFilter)})`
                  : getMonthName(selectedMonth)}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {showRankInfo ? (
                <RankShowcase />
              ) : topAgents.length > 0 ? (
                <div className="space-y-6">
                  {/* Top 5 Leaderboard */}
                  <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-card shadow-sm">
                    <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-1 text-center">
                      <h3 className="text-white font-bold text-lg tracking-wide">TOP PERFORMERS LEADERBOARD</h3>
                    </div>
                    <div className="divide-y divide-slate-200 dark:divide-slate-700">
                      {topAgents.slice(0, 10).map((agent, index) => {
                        // Get rank based on position
                        const rank = index + 1
                        const rankName = getRankName(rank)
                        const rankTextColor = getRankTextColor(rank)

                        return (
                          <div
                            key={agent.agent}
                            className="flex items-center p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          >
                            {/* Rank Badge */}
                            <RankBadge rank={rank} className="mr-3" />

                            {/* Agent Info */}
                            <div className="flex flex-1 items-center">
                              <Avatar className="h-10 w-10 mr-3 border-2 border-white shadow-sm">
                                <AvatarFallback className={getAgentColor(agent.agent)}>
                                  {agent.agent.substring(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className={`font-medium ${rankTextColor}`}>{agent.agent}</p>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-muted-foreground">{agent.clientCount} clients</span>
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 ${rankTextColor}`}
                                  >
                                    {rankName}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Value/Amount */}
                            <div className="text-right">
                              <div className={`font-bold ${rankTextColor}`}>{formatCurrency(agent.value)}</div>

                              {/* Progress bar */}
                              <div className="w-24 h-2 bg-slate-100 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
                                <div
                                  className={`h-full ${
                                    rank === 1
                                      ? "bg-gradient-to-r from-purple-500 to-yellow-400"
                                      : rank === 2
                                        ? "bg-gradient-to-r from-pink-500 to-yellow-400"
                                        : rank === 3
                                          ? "bg-gradient-to-r from-amber-500 to-yellow-400"
                                          : rank === 4
                                            ? "bg-gradient-to-r from-teal-500 to-emerald-400"
                                            : rank === 5
                                              ? "bg-gradient-to-r from-blue-500 to-cyan-400"
                                              : "bg-blue-500"
                                  }`}
                                  style={{ width: `${agent.percentage}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <p>No agent data available for this period</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="pt-0">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs w-full justify-between"
                onClick={() => router.push("/?tab=team")}
              >
                <span>View all agents</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
