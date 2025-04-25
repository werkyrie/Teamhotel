"use client"

import { useClientContext } from "@/context/client-context"
import StatisticCard from "./statistic-card"
import { Users, ShoppingBag, Wallet, ArrowDownCircle, UserCheck, Clock, UserX, UserMinus } from "lucide-react"
import { useEffect, useState } from "react"

export default function StatisticsGrid() {
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

  useEffect(() => {
    // Calculate statistics
    const totalClients = clients.length
    const totalOrders = orders.length
    const totalDeposits = deposits.reduce((sum, deposit) => sum + deposit.amount, 0)
    const totalWithdrawals = withdrawals.reduce((sum, withdrawal) => sum + withdrawal.amount, 0)

    const activeClients = clients.filter((client) => client.status === "Active").length
    const inProcessClients = clients.filter((client) => client.status === "In Process").length
    const eliminatedClients = clients.filter((client) => client.status === "Eliminated").length
    const inactiveClients = clients.filter((client) => client.status === "Inactive").length

    setStats({
      totalClients,
      totalOrders,
      totalDeposits,
      totalWithdrawals,
      activeClients,
      inProcessClients,
      eliminatedClients,
      inactiveClients,
    })
  }, [clients, orders, deposits, withdrawals])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
        description={`${((stats.activeClients / stats.totalClients) * 100).toFixed(1)}% of total clients`}
        icon={UserCheck}
        iconColor="text-green-500"
      />
      <StatisticCard
        title="In-Process Clients"
        value={stats.inProcessClients}
        description={`${((stats.inProcessClients / stats.totalClients) * 100).toFixed(1)}% of total clients`}
        icon={Clock}
        iconColor="text-yellow-500"
      />
      <StatisticCard
        title="Eliminated Clients"
        value={stats.eliminatedClients}
        description={`${((stats.eliminatedClients / stats.totalClients) * 100).toFixed(1)}% of total clients`}
        icon={UserX}
        iconColor="text-red-500"
      />
      <StatisticCard
        title="Inactive Clients"
        value={stats.inactiveClients}
        description={`${((stats.inactiveClients / stats.totalClients) * 100).toFixed(1)}% of total clients`}
        icon={UserMinus}
        iconColor="text-gray-500"
      />
    </div>
  )
}
