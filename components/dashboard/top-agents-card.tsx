"use client"

import { useClientContext } from "@/context/client-context"
import { useEffect, useState, useMemo, memo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Trophy, ArrowRight } from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"

interface AgentStat {
  agent: string
  value: number
  percentage: number
}

// Memoized agent list item component
const AgentListItem = memo(
  ({
    agent,
    index,
    value,
    percentage,
    valueLabel,
    getAgentColor,
  }: {
    agent: string
    index: number
    value: number | string
    percentage: number
    valueLabel?: string
    getAgentColor: (agent: string) => string
  }) => {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Avatar className="h-8 w-8 border-2 border-background">
                <AvatarFallback className={getAgentColor(agent)}>{agent.substring(0, 2)}</AvatarFallback>
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
              <p className="text-sm font-medium">{agent}</p>
            </div>
          </div>
          <p className="text-sm font-semibold">
            {value}
            {valueLabel}
          </p>
        </div>
        <Progress value={percentage} className="h-2 progress-bar-animate" />
      </div>
    )
  },
)

function TopAgentsCard() {
  const { clients, deposits } = useClientContext()
  const [topDepositAgents, setTopDepositAgents] = useState<AgentStat[]>([])
  const [topClientAgents, setTopClientAgents] = useState<AgentStat[]>([])
  const { theme } = useTheme()

  // Generate a consistent color based on agent name - memoized
  const getAgentColor = useMemo(() => {
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

    // Create a memoized function
    return (agent: string) => {
      // Simple hash function to get a consistent index
      const hash = agent.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
      return colors[hash % colors.length]
    }
  }, [])

  // Calculate agent statistics - optimized with useMemo
  const agentStats = useMemo(() => {
    if (clients.length === 0) return null

    // Calculate deposits per agent with a single reduce
    const agentDeposits = deposits.reduce(
      (acc, deposit) => {
        acc[deposit.agent] = (acc[deposit.agent] || 0) + deposit.amount
        return acc
      },
      {} as Record<string, number>,
    )

    // Calculate clients per agent with a single reduce
    const agentClients = clients.reduce(
      (acc, client) => {
        acc[client.agent] = (acc[client.agent] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    // Convert to arrays and sort
    const depositEntries = Object.entries(agentDeposits)
      .map(([agent, value]) => ({ agent, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)

    const clientEntries = Object.entries(agentClients)
      .map(([agent, value]) => ({ agent, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)

    // Calculate max values for percentage
    const maxDeposit = depositEntries.length > 0 ? depositEntries[0].value : 0
    const maxClients = clientEntries.length > 0 ? clientEntries[0].value : 0

    // Calculate percentages
    const depositStats = depositEntries.map((item) => ({
      agent: item.agent,
      value: item.value,
      percentage: maxDeposit > 0 ? (item.value / maxDeposit) * 100 : 0,
    }))

    const clientStats = clientEntries.map((item) => ({
      agent: item.agent,
      value: item.value,
      percentage: maxClients > 0 ? (item.value / maxClients) * 100 : 0,
    }))

    return { depositStats, clientStats }
  }, [clients, deposits])

  // Update state only when calculated values change
  useEffect(() => {
    if (agentStats) {
      setTopDepositAgents(agentStats.depositStats)
      setTopClientAgents(agentStats.clientStats)
    }
  }, [agentStats])

  return (
    <Card className="dashboard-card" style={{ contain: "content" }}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center">
          <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
          Top Performing Agents
        </CardTitle>
        <CardDescription>Agent performance metrics</CardDescription>
        <Link
          href="/team-performance"
          className="mt-2 text-xs flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          View all agents <ArrowRight className="ml-1 h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="deposits" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="deposits">Highest Deposits</TabsTrigger>
            <TabsTrigger value="clients">Most Clients</TabsTrigger>
          </TabsList>

          <TabsContent value="deposits" className="space-y-4 animate-slide-in">
            {topDepositAgents.length > 0 ? (
              topDepositAgents.map((agent, index) => (
                <AgentListItem
                  key={agent.agent}
                  agent={agent.agent}
                  index={index}
                  value={`$${agent.value.toFixed(2)}`}
                  percentage={agent.percentage}
                  getAgentColor={getAgentColor}
                />
              ))
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <p>No deposit data available</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="clients" className="space-y-4 animate-slide-in">
            {topClientAgents.length > 0 ? (
              topClientAgents.map((agent, index) => (
                <AgentListItem
                  key={agent.agent}
                  agent={agent.agent}
                  index={index}
                  value={agent.value}
                  valueLabel=" clients"
                  percentage={agent.percentage}
                  getAgentColor={getAgentColor}
                />
              ))
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <p>No client data available</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

// Export as memoized component
export default memo(TopAgentsCard)
