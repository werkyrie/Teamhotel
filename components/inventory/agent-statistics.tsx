"use client"

import { useMemo } from "react"
import type { AgentStats } from "@/types/inventory"
import { Card, CardContent } from "@/components/ui/card"

interface AgentStatisticsProps {
  agentStats: AgentStats
}

export default function AgentStatistics({ agentStats }: AgentStatisticsProps) {
  // Sort agents by device count (highest first)
  const sortedAgents = useMemo(() => {
    return Object.entries(agentStats).sort((a, b) => b[1] - a[1])
  }, [agentStats])

  if (sortedAgents.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">No agent data available yet. Add devices to see statistics.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {sortedAgents.map(([agent, count]) => (
        <Card key={agent} className="overflow-hidden transition-all hover:shadow-md">
          <CardContent className="p-6 text-center">
            <h3 className="font-medium text-lg mb-2">{agent}</h3>
            <p className="text-4xl font-bold text-primary mb-1">{count}</p>
            <p className="text-sm text-muted-foreground">{count === 1 ? "device" : "devices"}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
