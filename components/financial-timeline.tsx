"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useClientContext } from "@/context/client-context"
import { ArrowDown, ArrowUp, DollarSign, Activity } from "lucide-react"
import type { Deposit, Order, Withdrawal } from "@/types/client"
import { Badge } from "@/components/ui/badge"

interface TimelineEvent {
  id: string
  type: "deposit" | "withdrawal" | "order"
  date: string | Date
  amount: number
  clientName: string
  shopId: string
  agent: string
  paymentMode?: string
  status?: string
  location?: string
  timestamp: number
}

interface FinancialTimelineProps {
  shopId: string
}

export function FinancialTimeline({ shopId }: FinancialTimelineProps) {
  const { deposits, withdrawals, orders } = useClientContext()
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [totalDeposits, setTotalDeposits] = useState(0)
  const [totalWithdrawals, setTotalWithdrawals] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)

  useEffect(() => {
    if (!shopId) {
      setLoading(false)
      return
    }

    try {
      // Helper function to safely parse dates
      const safeParseDate = (dateInput: string | Date | undefined): Date => {
        if (!dateInput) return new Date()

        try {
          return typeof dateInput === "string" ? new Date(dateInput) : dateInput
        } catch (e) {
          console.error("Error parsing date:", e)
          return new Date()
        }
      }

      // Filter deposits for this client
      const clientDeposits: TimelineEvent[] = deposits
        .filter((deposit: Deposit) => deposit.shopId === shopId)
        .map((deposit: Deposit) => ({
          id: deposit.depositId,
          type: "deposit",
          date: deposit.date,
          amount: deposit.amount || 0,
          clientName: deposit.clientName || "",
          shopId: deposit.shopId,
          agent: deposit.agent || "",
          paymentMode: deposit.paymentMode || "Unknown",
          timestamp: safeParseDate(deposit.date).getTime(),
        }))

      // Filter withdrawals for this client
      const clientWithdrawals: TimelineEvent[] = withdrawals
        .filter((withdrawal: Withdrawal) => withdrawal.shopId === shopId)
        .map((withdrawal: Withdrawal) => ({
          id: withdrawal.withdrawalId,
          type: "withdrawal",
          date: withdrawal.date,
          amount: withdrawal.amount || 0,
          clientName: withdrawal.clientName || "",
          shopId: withdrawal.shopId,
          agent: withdrawal.agent || "",
          paymentMode: withdrawal.paymentMode || "Unknown",
          timestamp: safeParseDate(withdrawal.date).getTime(),
        }))

      // Filter orders for this client
      const clientOrders: TimelineEvent[] = orders
        .filter((order: Order) => order.shopId === shopId)
        .map((order: Order) => ({
          id: order.orderId,
          type: "order",
          date: order.date,
          amount: order.price || 0,
          clientName: order.clientName || "",
          shopId: order.shopId,
          agent: order.agent || "",
          status: order.status || "Unknown",
          location: order.location || "",
          timestamp: safeParseDate(order.date).getTime(),
        }))

      // Calculate totals
      const depositTotal = clientDeposits.reduce((sum, event) => sum + event.amount, 0)
      const withdrawalTotal = clientWithdrawals.reduce((sum, event) => sum + event.amount, 0)
      const orderTotal = clientOrders.reduce((sum, event) => sum + event.amount, 0)

      setTotalDeposits(depositTotal)
      setTotalWithdrawals(withdrawalTotal)
      setTotalOrders(orderTotal)

      // Combine all events and sort by date (newest first)
      const allEvents = [...clientDeposits, ...clientWithdrawals, ...clientOrders].sort(
        (a, b) => b.timestamp - a.timestamp,
      )

      setTimelineEvents(allEvents)
    } catch (error) {
      console.error("Error preparing timeline data:", error)
    } finally {
      setLoading(false)
    }
  }, [shopId, deposits, withdrawals, orders])

  // Safe date formatter
  const formatDate = (dateInput: string | Date | undefined): string => {
    if (!dateInput) return "Unknown date"

    try {
      const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch (e) {
      console.error("Error formatting date:", e)
      return "Invalid date"
    }
  }

  // Safe amount formatter
  const formatAmount = (amount: number | undefined): string => {
    if (amount === undefined || amount === null) return "$0.00"
    return `$${amount.toFixed(2)}`
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Financial Timeline</CardTitle>
          <CardDescription>Loading financial data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center p-4">Loading timeline...</div>
        </CardContent>
      </Card>
    )
  }

  if (timelineEvents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Financial Timeline</CardTitle>
          <CardDescription>No financial activity found for this client</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">This client has no financial transactions yet.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const balance = totalDeposits - totalWithdrawals - totalOrders

  return (
    <div className="space-y-6">
      {/* Financial Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Summary</CardTitle>
          <CardDescription>Overview of client's financial activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-green-800 dark:text-green-300">Total Deposits</h3>
                <ArrowDown className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300 mt-2">
                {formatAmount(totalDeposits)}
              </p>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Total Withdrawals</h3>
                <ArrowUp className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300 mt-2">{formatAmount(totalWithdrawals)}</p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">Total Orders</h3>
                <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-2">{formatAmount(totalOrders)}</p>
            </div>

            <div
              className={`rounded-lg p-4 ${balance >= 0 ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-amber-50 dark:bg-amber-900/20"}`}
            >
              <div className="flex items-center justify-between">
                <h3
                  className={`text-sm font-medium ${balance >= 0 ? "text-emerald-800 dark:text-emerald-300" : "text-amber-800 dark:text-amber-300"}`}
                >
                  Balance
                </h3>
                <DollarSign
                  className={`h-4 w-4 ${balance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}
                />
              </div>
              <p
                className={`text-2xl font-bold mt-2 ${balance >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}`}
              >
                {formatAmount(balance)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Timeline</CardTitle>
          <CardDescription>Recent financial activity for this client</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {timelineEvents.map((event) => (
              <div
                key={`${event.type}-${event.id}`}
                className={`border-l-4 pl-4 pb-4 ${
                  event.type === "deposit"
                    ? "border-green-500"
                    : event.type === "withdrawal"
                      ? "border-red-500"
                      : "border-blue-500"
                }`}
              >
                <div className="flex items-start">
                  <div className="mr-4 mt-1">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        event.type === "deposit"
                          ? "bg-green-100 text-green-600"
                          : event.type === "withdrawal"
                            ? "bg-red-100 text-red-600"
                            : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      {event.type === "deposit" && <ArrowDown className="h-4 w-4" />}
                      {event.type === "withdrawal" && <ArrowUp className="h-4 w-4" />}
                      {event.type === "order" && <DollarSign className="h-4 w-4" />}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center">
                        <p className="text-sm font-medium">
                          {event.type === "deposit" && "Deposit"}
                          {event.type === "withdrawal" && "Withdrawal"}
                          {event.type === "order" && "Order"}
                        </p>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {event.id}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 sm:mt-0">{formatDate(event.date)}</p>
                    </div>
                    <p
                      className={`mt-2 font-medium ${
                        event.type === "deposit"
                          ? "text-green-600"
                          : event.type === "withdrawal"
                            ? "text-red-600"
                            : "text-blue-600"
                      }`}
                    >
                      {formatAmount(event.amount)}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {event.type === "deposit" && `Via ${event.paymentMode || "Unknown"}`}
                      {event.type === "withdrawal" && `Via ${event.paymentMode || "Unknown"}`}
                      {event.type === "order" && `Status: ${event.status || "Unknown"}`}
                    </p>
                    <div className="mt-2 flex items-center text-xs text-muted-foreground">
                      <Activity className="mr-1 h-3 w-3" />
                      <span>Agent: {event.agent || "Unknown"}</span>
                      {event.location && (
                        <>
                          <span className="mx-1">•</span>
                          <span>Location: {event.location}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
