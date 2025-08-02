"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { CalendarDays, DollarSign, X } from "lucide-react"
import { useTeamContext } from "@/context/team-context"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

interface AgentDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  agentName: string
  agentRole: string
  agentStatus: string
}

const agentColors = [
  "bg-purple-500",
  "bg-blue-500",
  "bg-green-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-teal-500",
  "bg-orange-500",
  "bg-red-500",
  "bg-yellow-500",
  "bg-cyan-500",
]

export default function AgentDetailsModal({
  isOpen,
  onClose,
  agentName,
  agentRole,
  agentStatus,
}: AgentDetailsModalProps) {
  const { attendance, penalties } = useTeamContext()

  // Filter data for the specific agent
  const agentAttendance = attendance.filter((record) => record.agentName === agentName)
  const agentPenalties = penalties.filter((penalty) => penalty.agentName === agentName)

  // Sort by date (most recent first)
  const sortedAttendance = [...agentAttendance].sort((a, b) => {
    const dateA = new Date(a.date).getTime()
    const dateB = new Date(b.date).getTime()
    return dateB - dateA
  })

  const sortedPenalties = [...agentPenalties].sort((a, b) => {
    const dateA = new Date(a.date).getTime()
    const dateB = new Date(b.date).getTime()
    return dateB - dateA
  })

  // Calculate totals
  const totalPenaltyAmount = agentPenalties.reduce((sum, penalty) => sum + penalty.amount, 0)
  const totalAbsences = agentAttendance.length

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Whole Day":
        return "bg-green-500"
      case "Half Day":
        return "bg-yellow-500"
      case "Leave":
        return "bg-blue-500"
      case "Undertime":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getRoleBadge = (role: string) => {
    const variants = {
      "Team Leader": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
      Elite: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
      Regular: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      Spammer: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    }
    return variants[role as keyof typeof variants] || variants.Regular
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      inactive: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      resigned: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    }
    return variants[status as keyof typeof variants] || variants.active
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-4">
            <Avatar className={cn("h-16 w-16", agentColors[0])}>
              <AvatarFallback className="text-white font-bold text-lg">{getInitials(agentName)}</AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-2xl">{agentName}</DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={getRoleBadge(agentRole)} variant="secondary">
                  {agentRole}
                </Badge>
                <Badge className={getStatusBadge(agentStatus)}>{agentStatus}</Badge>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Absences</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAbsences}</div>
              <p className="text-xs text-muted-foreground">
                {sortedAttendance.filter((a) => a.status === "Whole Day").length} whole day,{" "}
                {sortedAttendance.filter((a) => a.status === "Half Day").length} half day
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Penalties</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(totalPenaltyAmount)}</div>
              <p className="text-xs text-muted-foreground">{agentPenalties.length} penalty records</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Absences and Penalties */}
        <Tabs defaultValue="absences" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="absences" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Absences ({totalAbsences})
            </TabsTrigger>
            <TabsTrigger value="penalties" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Penalties ({agentPenalties.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="absences" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  Absence Records
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sortedAttendance.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Remarks</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedAttendance.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium">
                              {format(new Date(record.date), "MMM dd, yyyy")}
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(record.status)}>{record.status}</Badge>
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <div className="truncate" title={record.remarks}>
                                {record.remarks || "No remarks"}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Absence Records</h3>
                    <p className="text-muted-foreground">This agent has no recorded absences.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="penalties" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Penalty Records
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sortedPenalties.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Description</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedPenalties.map((penalty) => (
                          <TableRow key={penalty.id}>
                            <TableCell className="font-medium">
                              {format(new Date(penalty.date), "MMM dd, yyyy")}
                            </TableCell>
                            <TableCell>
                              <span className="font-medium text-red-600">{formatCurrency(penalty.amount)}</span>
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <div className="truncate" title={penalty.description}>
                                {penalty.description}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Penalty Records</h3>
                    <p className="text-muted-foreground">This agent has no recorded penalties.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
