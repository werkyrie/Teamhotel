"use client"

import { useClientContext } from "@/context/client-context"
import StatisticCard from "./statistic-card"
import { Users, ShoppingBag, Wallet, ArrowDownCircle, UserCheck, Clock, UserX, UserMinus } from "lucide-react"
import { useEffect, useState, useMemo } from "react"

export default function OptimizedStatisticsGrid() {
  const { clients, orders, deposits, withdrawals } = useClientContext()
  const [stats, setStats] = useState({
    totalClients: 0,
    totalOrders: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    activeClients: 0,
    inProcessClients: 0,
    eliminatedClients: 0,
    inactiveClients: 0,
  })

  // Optimize calculations with useMemo
  const calculatedStats = useMemo(() => {
    // Early return if data isn't loaded yet
    if (!clients.length) return null

    const totalClients = clients.length
    const totalOrders = orders.length

    // Use reduce once instead of multiple iterations
    const clientStatusCounts = clients.reduce((acc, client) => {
      const status = client.status
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})

    // Calculate financial totals with a single reduce
    const financialTotals = deposits.reduce(
      (acc, deposit) => {
        acc.totalDeposits += deposit.amount
        return acc
      },
      { totalDeposits: 0, totalWithdrawals: 0 },
    )

    // Add withdrawals to the same accumulator
    withdrawals.forEach((withdrawal) => {
      financialTotals.totalWithdrawals += withdrawal.amount
    })

    return {
      totalClients,
      totalOrders,
      totalDeposits: financialTotals.totalDeposits,
      totalWithdrawals: financialTotals.totalWithdrawals,
      activeClients: clientStatusCounts["Active"] || 0,
      inProcessClients: clientStatusCounts["In Process"] || 0,
      eliminatedClients: clientStatusCounts["Eliminated"] || 0,
      inactiveClients: clientStatusCounts["Inactive"] || 0,
    }
  }, [clients, orders, deposits, withdrawals])

  // Update state only when calculated values change
  useEffect(() => {
    if (calculatedStats) {
      setStats(calculatedStats)
    }
  }, [calculatedStats])

  // Memoize percentage calculations to avoid recalculating on every render
  const percentages = useMemo(() => {
    if (stats.totalClients === 0) return null

    return {
      activePercentage: ((stats.activeClients / stats.totalClients) * 100).toFixed(1),
      inProcessPercentage: ((stats.inProcessClients / stats.totalClients) * 100).toFixed(1),
      eliminatedPercentage: ((stats.eliminatedClients / stats.totalClients) * 100).toFixed(1),
      inactivePercentage: ((stats.inactiveClients / stats.totalClients) * 100).toFixed(1),
    }
  }, [stats.totalClients, stats.activeClients, stats.inProcessClients, stats.eliminatedClients, stats.inactiveClients])

  // Use CSS containment for better performance
  const gridStyle = {
    contain: "content",
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" style={gridStyle}>
      <StatisticCard title="Total Clients" value={stats.totalClients} icon={Users} iconColor="text-blue-500" />
      <StatisticCard title="Total Orders" value={stats.totalOrders} icon={ShoppingBag} iconColor="text-indigo-500" />
      <StatisticCard
        title="Total Deposits"
        value={`$${stats.totalDeposits.toFixed(2)}`}
        icon={Wallet}
        iconColor="text-green-500"
      />
      <StatisticCard
        title="Total Withdrawals"
        value={`$${stats.totalWithdrawals.toFixed(2)}`}
        icon={ArrowDownCircle}
        iconColor="text-red-500"
      />
      <StatisticCard
        title="Active Clients"
        value={stats.activeClients}
        description={percentages ? `${percentages.activePercentage}% of total clients` : "0% of total clients"}
        icon={UserCheck}
        iconColor="text-green-500"
      />
      <StatisticCard
        title="In-Process Clients"
        value={stats.inProcessClients}
        description={percentages ? `${percentages.inProcessPercentage}% of total clients` : "0% of total clients"}
        icon={Clock}
        iconColor="text-yellow-500"
      />
      <StatisticCard
        title="Eliminated Clients"
        value={stats.eliminatedClients}
        description={percentages ? `${percentages.eliminatedPercentage}% of total clients` : "0% of total clients"}
        icon={UserX}
        iconColor="text-red-500"
      />
      <StatisticCard
        title="Inactive Clients"
        value={stats.inactiveClients}
        description={percentages ? `${percentages.inactivePercentage}% of total clients` : "0% of total clients"}
        icon={UserMinus}
        iconColor="text-gray-500"
      />
    </div>
  )
}
