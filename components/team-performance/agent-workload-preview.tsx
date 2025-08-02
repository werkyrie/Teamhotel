"use client"

import { useState, useEffect } from "react"
import { Calendar, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { db } from "@/lib/firebase"
import { collection, onSnapshot, doc, getDoc } from "firebase/firestore"

// Interface for client assignment data
interface ClientAssignment {
  id: string
  name: string
  assignedAgent: string
  date: string
}

// Interface for agent workload stats
interface AgentWorkload {
  total: number
  daily: number
}

interface AgentWorkloadPreviewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function AgentWorkloadPreview({ open, onOpenChange }: AgentWorkloadPreviewProps) {
  const [clients, setClients] = useState<ClientAssignment[]>([])
  const [agents, setAgents] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Load workload agents from Firestore
  useEffect(() => {
    if (!open) return

    const loadWorkloadAgents = async () => {
      try {
        const workloadAgentsDoc = await getDoc(doc(db, "settings", "workloadAgents"))
        if (workloadAgentsDoc.exists()) {
          const workloadAgentsData = workloadAgentsDoc.data().agents
          if (Array.isArray(workloadAgentsData) && workloadAgentsData.length > 0) {
            setAgents(workloadAgentsData)
          } else {
            // Fallback to default agents
            const defaultAgents = ["Cuu", "Jhe", "Kel", "Ken", "Kyrie", "Lovely", "Mar", "Primo", "Vivian"]
            setAgents(defaultAgents)
          }
        } else {
          // Fallback to default agents
          const defaultAgents = ["Cuu", "Jhe", "Kel", "Ken", "Kyrie", "Lovely", "Mar", "Primo", "Vivian"]
          setAgents(defaultAgents)
        }
      } catch (error) {
        console.error("Error loading workload agents:", error)
        // Fallback to default agents
        const defaultAgents = ["Cuu", "Jhe", "Kel", "Ken", "Kyrie", "Lovely", "Mar", "Primo", "Vivian"]
        setAgents(defaultAgents)
      }
    }

    loadWorkloadAgents()
  }, [open])

  // Load clients from Firestore on component mount
  useEffect(() => {
    if (!open) return

    setLoading(true)

    // Set up real-time listener for client assignments
    const clientsRef = collection(db, "clientAssignments")
    const unsubscribe = onSnapshot(
      clientsRef,
      (snapshot) => {
        const clientsData: ClientAssignment[] = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          clientsData.push({
            id: doc.id,
            name: data.name || "",
            assignedAgent: data.assignedAgent || "",
            date: data.date || new Date().toISOString().split("T")[0],
          })
        })
        setClients(clientsData)
        setLoading(false)
      },
      (error) => {
        console.error("Error fetching client assignments:", error)
        // Fallback to localStorage if Firestore fails
        const savedClients = localStorage.getItem("assignedClients")
        if (savedClients) {
          try {
            setClients(JSON.parse(savedClients))
          } catch (e) {
            console.error("Failed to parse saved clients", e)
          }
        }
        setLoading(false)
      },
    )

    // Clean up the listener on unmount or when dialog closes
    return () => unsubscribe()
  }, [open])

  // Calculate agent workloads
  const calculateAgentWorkloads = (): Record<string, AgentWorkload> => {
    const today = new Date().toISOString().split("T")[0] // Format: YYYY-MM-DD

    return agents.reduce(
      (acc, agent) => {
        const agentName = agent.toLowerCase()
        const agentClients = clients.filter((client) => client.assignedAgent.toLowerCase() === agentName)

        // Total clients for this agent
        const total = agentClients.length

        // Clients added today for this agent
        const daily = agentClients.filter((client) => client.date === today).length

        acc[agentName] = { total, daily }
        return acc
      },
      {} as Record<string, AgentWorkload>,
    )
  }

  const agentWorkloads = calculateAgentWorkloads()

  // Find top agent
  const findTopAgent = (): string => {
    const workloads = Object.entries(agentWorkloads)
    if (workloads.length === 0) return "-"

    const sorted = workloads.sort((a, b) => b[1].total - a[1].total)
    if (sorted[0][1].total === 0) return "-"

    return agents.find((a) => a.toLowerCase() === sorted[0][0]) || "-"
  }

  const topAgentName = findTopAgent()
  const totalClients = clients.length
  const todayClients = clients.filter((client) => client.date === new Date().toISOString().split("T")[0]).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Agent Workload Preview
          </DialogTitle>
          <DialogDescription>Current workload distribution across all agents</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center">
            <p>Loading agent workload data...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-none shadow-sm bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
                <CardContent className="pt-6 text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Calendar className="h-5 w-5 text-blue-500 mr-2" />
                    <p className="text-sm text-muted-foreground">Today</p>
                  </div>
                  <p className="text-3xl font-bold">{todayClients}</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
                <CardContent className="pt-6 text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Users className="h-5 w-5 text-gray-500 mr-2" />
                    <p className="text-sm text-muted-foreground">Total</p>
                  </div>
                  <p className="text-3xl font-bold">{totalClients}</p>
                </CardContent>
              </Card>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span className="text-gray-600 dark:text-gray-300">Daily Added</span>
                </div>
                <div className="flex items-center gap-1 ml-4">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-300">Total Clients</span>
                </div>
                <div className="flex items-center gap-1 ml-4">
                  <div className="h-3 w-3 bg-red-500 rounded-full"></div>
                  <span className="text-gray-600 dark:text-gray-300">Divisible by 4</span>
                </div>
              </div>
            </div>

            {/* Agent Workload Grid */}
            <div className="grid grid-cols-3 gap-3">
              {agents.map((agent) => {
                const workload = agentWorkloads[agent.toLowerCase()] || { total: 0, daily: 0 }
                const isTotal4Divisible = workload.total % 4 === 0 && workload.total > 0

                return (
                  <Card key={agent} className="overflow-hidden border shadow-sm dark:bg-gray-800 dark:border-gray-700">
                    <CardContent className="p-3">
                      <p className="font-medium text-sm mb-2 text-center dark:text-gray-300">{agent}</p>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 text-blue-500 mr-1" />
                            <span className="text-xs text-gray-600 dark:text-gray-400">Daily:</span>
                          </div>
                          <span className="font-semibold text-sm">{workload.daily}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Users className="h-3 w-3 text-gray-500 mr-1" />
                            <span className="text-xs text-gray-600 dark:text-gray-400">Total:</span>
                          </div>
                          <span
                            className={`font-semibold text-sm ${isTotal4Divisible ? "text-red-500 dark:text-red-400" : ""}`}
                          >
                            {workload.total}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Top Agent */}
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">Top Performing Agent</p>
              <p className="text-xl font-bold">{topAgentName}</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
