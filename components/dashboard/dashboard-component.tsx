"use client"

import { useState, useEffect } from "react"
import { useClientContext } from "@/context/client-context"
import { useAuth } from "@/context/auth-context"
import { differenceInDays, format, subMonths, startOfMonth, endOfMonth } from "date-fns"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  ArrowRight,
  ArrowUpRight,
  Clock,
  Users,
  ShoppingBag,
  CreditCard,
  TrendingUp,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  FileText,
  BarChart3,
  Activity,
  Trophy,
} from "lucide-react"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

import WelcomeHero from "./welcome-hero"
import DebugDashboard from "./debug-dashboard"

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
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)

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
      <div className="container mx-auto p-4 animate-pulse">
        <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-lg mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 h-64 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Order Requests Card (Admin Only) */}
          {isAdmin && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <Card
                className={cn(
                  "overflow-hidden border-2",
                  pendingOrderRequests.length > 0
                    ? "border-amber-200 dark:border-amber-800"
                    : "border-slate-200 dark:border-slate-800",
                )}
              >
                <CardHeader
                  className={cn(
                    "pb-2",
                    pendingOrderRequests.length > 0
                      ? "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20"
                      : "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800",
                  )}
                >
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText
                        className={cn("h-5 w-5", pendingOrderRequests.length > 0 ? "text-amber-500" : "text-slate-500")}
                      />
                      Order Requests
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => router.push("/?tab=order-requests")}
                    >
                      View All <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                  <CardDescription>
                    {pendingOrderRequests.length > 0
                      ? `You have ${pendingOrderRequests.length} pending order request${pendingOrderRequests.length > 1 ? "s" : ""}`
                      : "No pending order requests"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  {pendingOrderRequests.length > 0 ? (
                    <div className="space-y-3">
                      {pendingOrderRequests.slice(0, 3).map((request) => (
                        <div
                          key={request.id}
                          className="flex items-center justify-between p-3 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
                        >
                          <div className="flex items-start gap-3">
                            <Clock className="h-5 w-5 text-amber-500 mt-0.5" />
                            <div>
                              <p className="font-medium">{request.clientName}</p>
                              <p className="text-sm text-muted-foreground">{request.shopId}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs bg-amber-100 dark:bg-amber-800/30 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full">
                                  {formatCurrency(request.price)}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {format(new Date(request.date), "MMM d, yyyy")}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button size="sm" onClick={() => router.push(`/?tab=order-requests&view=${request.id}`)}>
                            Review
                          </Button>
                        </div>
                      ))}

                      {pendingOrderRequests.length > 3 && (
                        <Button
                          variant="outline"
                          className="w-full text-xs"
                          onClick={() => router.push("/?tab=order-requests")}
                        >
                          View all {pendingOrderRequests.length} requests
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <p>No pending order requests to review</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Top Agents Card (Moved from right column) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <Card className="overflow-hidden border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-2 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Top Performing Agents
                  </CardTitle>
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
                <CardDescription>
                  Agent performance for{" "}
                  {selectedMonth === globalMonthFilter
                    ? `Same as Dashboard (${getMonthName(globalMonthFilter)})`
                    : getMonthName(selectedMonth)}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {topAgents.length > 0 ? (
                  <div className="space-y-4">
                    {topAgents.map((agent, index) => (
                      <div key={agent.agent} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <Avatar className="h-8 w-8 border-2 border-background">
                                <AvatarFallback className={getAgentColor(agent.agent)}>
                                  {agent.agent.substring(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              {index < 3 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-background">
                                  <span
                                    className={`text-[10px] font-bold ${
                                      index === 0 ? "text-yellow-500" : index === 1 ? "text-gray-400" : "text-amber-700"
                                    }`}
                                  >
                                    {index + 1}
                                  </span>
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{agent.agent}</p>
                              <p className="text-xs text-muted-foreground">{agent.clientCount} clients</p>
                            </div>
                          </div>
                          <p className="text-sm font-semibold">{formatCurrency(agent.value)}</p>
                        </div>
                        <Progress
                          value={agent.percentage}
                          className="h-2 bg-slate-100 dark:bg-slate-800"
                          indicatorClassName={`${index === 0 ? "bg-yellow-500" : index === 1 ? "bg-gray-400" : index === 2 ? "bg-amber-700" : "bg-blue-500"}`}
                        />
                      </div>
                    ))}
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

          {/* Client Inactivity Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
            <Card className="overflow-hidden border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-2 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-slate-500" />
                  Client Inactivity Alerts
                </CardTitle>
                <CardDescription>Clients requiring attention</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <Tabs defaultValue="orders">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="orders">Order Inactivity</TabsTrigger>
                    <TabsTrigger value="deposits">Deposit Inactivity</TabsTrigger>
                  </TabsList>

                  <TabsContent value="orders" className="space-y-4 mt-4">
                    {inactiveOrderClients.length > 0 ? (
                      <div className="space-y-3">
                        {inactiveOrderClients.slice(0, 3).map((client) => (
                          <div
                            key={client.shopId}
                            className="flex items-center justify-between p-3 border rounded-md bg-yellow-50 dark:bg-yellow-900/20"
                          >
                            <div>
                              <p className="font-medium">{client.clientName}</p>
                              <p className="text-sm text-muted-foreground">{client.shopId}</p>
                              <p className="text-xs text-yellow-700 dark:text-yellow-400">
                                {client.daysSinceLastOrder === null
                                  ? "No orders yet"
                                  : `${client.daysSinceLastOrder} days since last order`}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs"
                              onClick={() => router.push(`/?tab=clients&view=${client.shopId}`)}
                            >
                              View <ArrowRight className="ml-1 h-3 w-3" />
                            </Button>
                          </div>
                        ))}

                        {inactiveOrderClients.length > 3 && (
                          <Button
                            variant="outline"
                            className="w-full text-xs"
                            onClick={() => router.push("/?tab=clients")}
                          >
                            View all {inactiveOrderClients.length} clients
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <p>No clients with order inactivity</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="deposits" className="space-y-4 mt-4">
                    {inactiveDepositClients.length > 0 ? (
                      <div className="space-y-3">
                        {inactiveDepositClients.slice(0, 3).map((client) => (
                          <div
                            key={client.shopId}
                            className="flex items-center justify-between p-3 border rounded-md bg-orange-50 dark:bg-orange-900/20"
                          >
                            <div>
                              <p className="font-medium">{client.clientName}</p>
                              <p className="text-sm text-muted-foreground">{client.shopId}</p>
                              <p className="text-xs text-orange-700 dark:text-orange-400">
                                {client.daysSinceLastDeposit === null
                                  ? "No deposits yet"
                                  : `${client.daysSinceLastDeposit} days since last deposit`}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs"
                              onClick={() => router.push(`/?tab=clients&view=${client.shopId}`)}
                            >
                              View <ArrowRight className="ml-1 h-3 w-3" />
                            </Button>
                          </div>
                        ))}

                        {inactiveDepositClients.length > 3 && (
                          <Button
                            variant="outline"
                            className="w-full text-xs"
                            onClick={() => router.push("/?tab=clients")}
                          >
                            View all {inactiveDepositClients.length} clients
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <p>No clients with deposit inactivity</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Column (1/3 width) */}
        <div className="space-y-4">
          {/* Order Request Status Card (Moved from left column) */}
          {isAdmin && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
              <Card className="overflow-hidden border-slate-200 dark:border-slate-800">
                <CardHeader className="pb-2 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-slate-500" />
                    Order Request Status
                  </CardTitle>
                  <CardDescription>Overview of all order requests</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-amber-500" />
                          Pending
                        </span>
                        <span className="font-medium">{stats.pendingRequests}</span>
                      </div>
                      <Progress
                        value={
                          (stats.pendingRequests /
                            (stats.pendingRequests + stats.approvedRequests + stats.rejectedRequests || 1)) *
                          100
                        }
                        className="h-2 bg-slate-100 dark:bg-slate-800"
                        indicatorClassName="bg-red-500"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs w-full justify-between"
                    onClick={() => router.push("/?tab=order-requests")}
                  >
                    <span>View all requests</span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}

          {/* Calendar Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
            <Card className="overflow-hidden border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-2 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-slate-500" />
                  {globalMonthFilter === "current" ? "Today" : getMonthName(globalMonthFilter)}
                </CardTitle>
                <CardDescription>{format(new Date(), "EEEE, MMMM d, yyyy")}</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-md bg-blue-50 dark:bg-blue-900/20">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                        <ShoppingBag className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                      </div>
                      <div>
                        <p className="font-medium">Recent Orders</p>
                        <p className="text-sm text-muted-foreground">
                          {orders?.filter((o) => {
                            const orderDate = new Date(o.date)
                            const today = new Date()
                            return orderDate.toDateString() === today.toDateString()
                          }).length || 0}{" "}
                          orders today
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => router.push("/?tab=orders")}>
                      <ArrowUpRight className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-md bg-green-50 dark:bg-green-900/20">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center">
                        <CreditCard className="h-4 w-4 text-green-600 dark:text-green-300" />
                      </div>
                      <div>
                        <p className="font-medium">Recent Deposits</p>
                        <p className="text-sm text-muted-foreground">
                          {deposits?.filter((d) => {
                            const depositDate = new Date(d.date)
                            const today = new Date()
                            return depositDate.toDateString() === today.toDateString()
                          }).length || 0}{" "}
                          deposits today
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => router.push("/?tab=deposits")}>
                      <ArrowUpRight className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-md bg-red-50 dark:bg-red-900/20">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-800 flex items-center justify-center">
                        <DollarSign className="h-4 w-4 text-red-600 dark:text-red-300" />
                      </div>
                      <div>
                        <p className="font-medium">Recent Withdrawals</p>
                        <p className="text-sm text-muted-foreground">
                          {withdrawals?.filter((w) => {
                            const withdrawalDate = new Date(w.date)
                            const today = new Date()
                            return withdrawalDate.toDateString() === today.toDateString()
                          }).length || 0}{" "}
                          withdrawals today
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => router.push("/?tab=withdrawals")}
                    >
                      <ArrowUpRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
