"use client"

import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, TrendingUp, TrendingDown, Users, Calendar, Filter, Download, Eye } from "lucide-react"
import { useClientContext } from "@/context/client-context"
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval } from "date-fns"

interface AgentRecordsModalProps {
  isOpen: boolean
  onClose: () => void
  agentName: string
  agentRole: string
  agentStatus: string
}

type FilterPeriod = "current" | "1" | "3" | "6" | "12" | "all"
type ClientStatusFilter = "all" | "Active" | "Inactive" | "In Process" | "Eliminated"
type PaymentModeFilter = "all" | "Crypto" | "Online Banking" | "Ewallet"

export default function AgentRecordsModal({
  isOpen,
  onClose,
  agentName,
  agentRole,
  agentStatus,
}: AgentRecordsModalProps) {
  const { clients, deposits, withdrawals } = useClientContext()

  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>("current")
  const [clientStatusFilter, setClientStatusFilter] = useState<ClientStatusFilter>("all")
  const [paymentModeFilter, setPaymentModeFilter] = useState<PaymentModeFilter>("all")

  // Get date range for filtering
  const getDateRange = (period: FilterPeriod) => {
    if (period === "all") return null

    const monthsBack = period === "current" ? 0 : Number.parseInt(period)
    const targetDate = subMonths(new Date(), monthsBack)

    return {
      start: startOfMonth(targetDate),
      end: endOfMonth(targetDate),
    }
  }

  // Filter data by date range
  const filterByDateRange = (items: any[], dateField: string) => {
    const dateRange = getDateRange(filterPeriod)
    if (!dateRange) return items

    return items.filter((item) => {
      const itemDate = new Date(item[dateField])
      return isWithinInterval(itemDate, dateRange)
    })
  }

  // Get agent's data
  const agentData = useMemo(() => {
    const agentClients = clients.filter((c) => c.agent === agentName)
    const agentDeposits = deposits.filter((d) => d.agent === agentName)
    const agentWithdrawals = withdrawals.filter((w) => w.agent === agentName)

    // Apply date filtering
    const filteredDeposits = filterByDateRange(agentDeposits, "date")
    const filteredWithdrawals = filterByDateRange(agentWithdrawals, "date")

    // Apply other filters
    const filteredClients = agentClients.filter((client) => {
      const matchesSearch =
        client.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.shopId.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = clientStatusFilter === "all" || client.status === clientStatusFilter
      return matchesSearch && matchesStatus
    })

    const filteredDepositsWithFilters = filteredDeposits.filter((deposit) => {
      const matchesSearch =
        deposit.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deposit.shopId.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesPaymentMode = paymentModeFilter === "all" || deposit.paymentMode === paymentModeFilter
      return matchesSearch && matchesPaymentMode
    })

    const filteredWithdrawalsWithFilters = filteredWithdrawals.filter((withdrawal) => {
      const matchesSearch =
        withdrawal.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        withdrawal.shopId.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesPaymentMode = paymentModeFilter === "all" || withdrawal.paymentMode === paymentModeFilter
      return matchesSearch && matchesPaymentMode
    })

    // Calculate totals
    const totalDeposits = filteredDeposits.reduce((sum, d) => sum + d.amount, 0)
    const totalWithdrawals = filteredWithdrawals.reduce((sum, w) => sum + w.amount, 0)
    const netAmount = totalDeposits - totalWithdrawals

    return {
      clients: filteredClients,
      deposits: filteredDepositsWithFilters,
      withdrawals: filteredWithdrawalsWithFilters,
      totalDeposits,
      totalWithdrawals,
      netAmount,
      totalClients: agentClients.length,
      activeClients: agentClients.filter((c) => c.status === "Active").length,
    }
  }, [clients, deposits, withdrawals, agentName, searchTerm, filterPeriod, clientStatusFilter, paymentModeFilter])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      Active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      Inactive: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      "In Process": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      Eliminated: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    }
    return variants[status as keyof typeof variants] || variants.Active
  }

  const getRoleBadge = (role: string) => {
    const variants = {
      Elite: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      Regular: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      Spammer: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    }
    return variants[role as keyof typeof variants] || variants.Regular
  }

  const getPaymentModeBadge = (mode: string) => {
    const variants = {
      Crypto: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      "Online Banking": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      Ewallet: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    }
    return variants[mode as keyof typeof variants] || variants.Crypto
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const periodOptions = [
    { value: "current", label: "Current Month" },
    { value: "1", label: "Last Month" },
    { value: "3", label: "Last 3 Months" },
    { value: "6", label: "Last 6 Months" },
    { value: "12", label: "Last 12 Months" },
    { value: "all", label: "All Time" },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 bg-purple-500">
                <AvatarFallback className="text-white font-bold">{getInitials(agentName)}</AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-2xl">{agentName} - Transactions</DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={getRoleBadge(agentRole)} variant="secondary">
                    {agentRole}
                  </Badge>
                  <Badge className={getStatusBadge(agentStatus)}>{agentStatus}</Badge>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </DialogHeader>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{agentData.totalClients}</div>
              <p className="text-xs text-muted-foreground">{agentData.activeClients} active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(agentData.totalDeposits)}</div>
              <p className="text-xs text-muted-foreground">{agentData.deposits.length} transactions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Withdrawals</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(agentData.totalWithdrawals)}</div>
              <p className="text-xs text-muted-foreground">{agentData.withdrawals.length} transactions</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search clients, shop IDs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={filterPeriod} onValueChange={(value: FilterPeriod) => setFilterPeriod(value)}>
            <SelectTrigger className="w-full sm:w-48">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={clientStatusFilter}
            onValueChange={(value: ClientStatusFilter) => setClientStatusFilter(value)}
          >
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
              <SelectItem value="In Process">In Process</SelectItem>
              <SelectItem value="Eliminated">Eliminated</SelectItem>
            </SelectContent>
          </Select>

          <Select value={paymentModeFilter} onValueChange={(value: PaymentModeFilter) => setPaymentModeFilter(value)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Payment Mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payment Modes</SelectItem>
              <SelectItem value="Crypto">Crypto</SelectItem>
              <SelectItem value="Online Banking">Online Banking</SelectItem>
              <SelectItem value="Ewallet">Ewallet</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="clients" className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="clients">Clients ({agentData.clients.length})</TabsTrigger>
            <TabsTrigger value="deposits">Deposits ({agentData.deposits.length})</TabsTrigger>
            <TabsTrigger value="withdrawals">Withdrawals ({agentData.withdrawals.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="clients" className="mt-4 overflow-auto max-h-96">
            <div className="space-y-2">
              {agentData.clients.map((client) => (
                <Card key={client.shopId} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 bg-blue-500">
                        <AvatarFallback className="text-white text-sm">{getInitials(client.clientName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{client.clientName}</div>
                        <div className="text-sm text-muted-foreground">ID: {client.shopId}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusBadge(client.status)}>{client.status}</Badge>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(client.kycDate), "MMM dd, yyyy")}
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {client.notes && <div className="mt-2 text-sm text-muted-foreground">{client.notes}</div>}
                </Card>
              ))}
              {agentData.clients.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No clients found matching the current filters.
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="deposits" className="mt-4 overflow-auto max-h-96">
            <div className="space-y-2">
              {agentData.deposits.map((deposit) => (
                <Card key={deposit.depositId} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium">{deposit.clientName}</div>
                        <div className="text-sm text-muted-foreground">ID: {deposit.shopId}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={getPaymentModeBadge(deposit.paymentMode)}>{deposit.paymentMode}</Badge>
                      <div className="text-right">
                        <div className="font-bold text-green-600">{formatCurrency(deposit.amount)}</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(deposit.date), "MMM dd, yyyy")}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              {agentData.deposits.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No deposits found matching the current filters.
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="withdrawals" className="mt-4 overflow-auto max-h-96">
            <div className="space-y-2">
              {agentData.withdrawals.map((withdrawal) => (
                <Card key={withdrawal.withdrawalId} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <div className="font-medium">{withdrawal.clientName}</div>
                        <div className="text-sm text-muted-foreground">ID: {withdrawal.shopId}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={getPaymentModeBadge(withdrawal.paymentMode)}>{withdrawal.paymentMode}</Badge>
                      <div className="text-right">
                        <div className="font-bold text-red-600">{formatCurrency(withdrawal.amount)}</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(withdrawal.date), "MMM dd, yyyy")}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              {agentData.withdrawals.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No withdrawals found matching the current filters.
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
