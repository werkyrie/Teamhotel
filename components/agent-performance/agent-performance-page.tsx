"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useTeamContext } from "@/context/team-context"
import { useClientContext } from "@/context/client-context"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  MoreHorizontal,
  Eye,
  FileText,
  Users,
  Crown,
  User,
  AlertTriangle,
  Lock,
  Plus,
  Edit,
  Trash2,
  Grid3X3,
  List,
  ChevronUp,
  ChevronDown,
  Check,
  X,
  Settings,
  Calendar,
  TrendingUp,
  DollarSign,
  UserCheck,
} from "lucide-react"
import AgentDetailsModal from "./agent-details-modal"
import AgentRecordsModal from "./agent-records-modal"
import AgentRegistrationModal from "../team-performance/agent-registration-modal"
import { useToast } from "@/hooks/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { startOfMonth, endOfMonth, isWithinInterval, subMonths } from "date-fns"
import type { Agent } from "@/types/team"
import { useRef } from "react"

// Email validation function
const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Time filter options
type TimeFilterOption =
  | "current-month"
  | "last-month"
  | "last-3-months"
  | "last-6-months"
  | "last-12-months"
  | "all-time"

const timeFilterOptions = [
  { value: "current-month", label: "Current Month" },
  { value: "last-month", label: "Last Month" },
  { value: "last-3-months", label: "Last 3 Months" },
  { value: "last-6-months", label: "Last 6 Months" },
  { value: "last-12-months", label: "Last 12 Months" },
  { value: "all-time", label: "All Time" },
] as const

export default function AgentPerformancePage() {
  const { agents, updateAgent, deleteAgent } = useTeamContext()
  const { clients, deposits, withdrawals } = useClientContext()
  const { isAdmin, isViewer, user } = useAuth()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isRecordsModalOpen, setIsRecordsModalOpen] = useState(false)
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards")
  const [timeFilter, setTimeFilter] = useState<TimeFilterOption>("current-month")

  // Edit modal states
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null)
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "",
    status: "",
  })

  // Table sorting and editing states
  const [sortField, setSortField] = useState<
    keyof Agent | "calculatedClients" | "calculatedDeposits" | "calculatedWithdrawals"
  >("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [editingCell, setEditingCell] = useState<{ agentId: string; field: string } | null>(null)
  const [editValue, setEditValue] = useState<string | number>("")
  const inputRef = useRef<HTMLInputElement>(null)

  // Get date range based on time filter
  const getDateRange = (filter: TimeFilterOption) => {
    const now = new Date()
    const currentMonthStart = startOfMonth(now)
    const currentMonthEnd = endOfMonth(now)

    switch (filter) {
      case "current-month":
        return { start: currentMonthStart, end: currentMonthEnd }
      case "last-month":
        const lastMonth = subMonths(now, 1)
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) }
      case "last-3-months":
        return { start: startOfMonth(subMonths(now, 2)), end: currentMonthEnd }
      case "last-6-months":
        return { start: startOfMonth(subMonths(now, 5)), end: currentMonthEnd }
      case "last-12-months":
        return { start: startOfMonth(subMonths(now, 11)), end: currentMonthEnd }
      case "all-time":
        return null // No date filtering
      default:
        return { start: currentMonthStart, end: currentMonthEnd }
    }
  }

  // Calculate agent metrics based on time filter from client context data
  const calculateAgentMetrics = (agentName: string) => {
    const dateRange = getDateRange(timeFilter)

    // Get clients added by this agent during the selected time period
    let agentClients: any[] = []

    if (dateRange) {
      // Filter clients added by this agent within the date range based on kycDate
      agentClients = clients.filter((client) => {
        if (client.agent !== agentName) return false
        if (!client.kycDate) return false
        const clientDate = new Date(client.kycDate)
        return isWithinInterval(clientDate, { start: dateRange.start, end: dateRange.end })
      })
    } else {
      // All time - get all clients added by this agent
      agentClients = clients.filter((client) => client.agent === agentName)
    }

    // Calculate deposits for the agent during the selected time period
    let agentDeposits: any[] = []

    if (dateRange) {
      agentDeposits = deposits.filter((deposit) => {
        if (deposit.agent !== agentName) return false
        const depositDate = new Date(deposit.date)
        return isWithinInterval(depositDate, { start: dateRange.start, end: dateRange.end })
      })
    } else {
      // All time - get all deposits by this agent
      agentDeposits = deposits.filter((deposit) => deposit.agent === agentName)
    }

    // Calculate withdrawals for the agent during the selected time period
    let agentWithdrawals: any[] = []

    if (dateRange) {
      agentWithdrawals = withdrawals.filter((withdrawal) => {
        if (withdrawal.agent !== agentName) return false
        const withdrawalDate = new Date(withdrawal.date)
        return isWithinInterval(withdrawalDate, { start: dateRange.start, end: dateRange.end })
      })
    } else {
      // All time - get all withdrawals by this agent
      agentWithdrawals = withdrawals.filter((withdrawal) => withdrawal.agent === agentName)
    }

    return {
      totalClients: agentClients.length, // Number of clients added by agent in selected period
      totalDeposits: agentDeposits.reduce((sum, deposit) => sum + deposit.amount, 0),
      totalWithdrawals: agentWithdrawals.reduce((sum, withdrawal) => sum + withdrawal.amount, 0),
    }
  }

  // Filter agents based on search term and apply sorting with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      let result = [...agents]

      // Apply search filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim()
        result = result.filter(
          (agent) =>
            (agent.name || "").toLowerCase().includes(term) ||
            (agent.email || "").toLowerCase().includes(term) ||
            (agent.role || "").toLowerCase().includes(term),
        )
      }

      // Apply sorting
      result.sort((a, b) => {
        let aValue: any = a[sortField as keyof Agent]
        let bValue: any = b[sortField as keyof Agent]

        // For calculated metrics, get the values
        if (
          sortField === "calculatedClients" ||
          sortField === "calculatedDeposits" ||
          sortField === "calculatedWithdrawals"
        ) {
          const aMetrics = calculateAgentMetrics(a.name || "")
          const bMetrics = calculateAgentMetrics(b.name || "")

          if (sortField === "calculatedClients") {
            aValue = aMetrics.totalClients
            bValue = bMetrics.totalClients
          } else if (sortField === "calculatedDeposits") {
            aValue = aMetrics.totalDeposits
            bValue = bMetrics.totalDeposits
          } else if (sortField === "calculatedWithdrawals") {
            aValue = aMetrics.totalWithdrawals
            bValue = bMetrics.totalWithdrawals
          }
        }

        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortDirection === "asc" ? aValue - bValue : bValue - aValue
        }

        // String comparison
        const aString = String(aValue || "").toLowerCase()
        const bString = String(bValue || "").toLowerCase()

        if (aString < bString) return sortDirection === "asc" ? -1 : 1
        if (aString > bString) return sortDirection === "asc" ? 1 : -1
        return 0
      })

      setFilteredAgents(result)
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [agents, searchTerm, sortField, sortDirection, timeFilter, clients, deposits, withdrawals])

  // Focus input when editing cell
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus()
    }
  }, [editingCell])

  // Handle sort
  const handleSort = (field: keyof Agent | "calculatedClients" | "calculatedDeposits" | "calculatedWithdrawals") => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Handle cell edit click
  const handleCellEditClick = (agentId: string, field: string, value: string | number) => {
    const isEditable =
      (isViewer && (field === "addedToday" || field === "monthlyAdded" || field === "openAccounts")) ||
      (isAdmin &&
        (field === "name" ||
          field === "addedToday" ||
          field === "monthlyAdded" ||
          field === "openAccounts" ||
          field === "totalDeposits" ||
          field === "totalWithdrawals")) ||
      (!isViewer &&
        !isAdmin &&
        (field === "name" || field === "addedToday" || field === "monthlyAdded" || field === "openAccounts"))

    if (isEditable) {
      setEditingCell({ agentId, field })
      setEditValue(value)
    }
  }

  // Handle cell edit save
  const handleCellEditSave = () => {
    if (!editingCell) return

    const agent = agents.find((a) => a.id === editingCell.agentId)
    if (!agent) return

    let value: string | number = editValue

    // Convert to number for numeric fields
    if (editingCell.field !== "name") {
      value = Number(editValue)
      if (isNaN(value) || value < 0) {
        toast({
          variant: "destructive",
          title: "Invalid value",
          description: "Please enter a valid number",
        })
        return
      }
    }

    // Update agent
    const updatedAgent = { ...agent, [editingCell.field]: value }
    updateAgent(updatedAgent, user?.email)

    // Reset editing state
    setEditingCell(null)
    setEditValue("")

    toast({
      title: "Updated",
      description: `Agent ${agent.name}'s ${editingCell.field} has been updated`,
    })
  }

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingCell(null)
    setEditValue("")
  }

  // Handle key press in editable cell
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCellEditSave()
    } else if (e.key === "Escape") {
      handleCancelEdit()
    }
  }

  // Check permissions and show appropriate message
  const checkPermission = (action: string) => {
    if (isViewer) {
      toast({
        title: "Access Restricted",
        description: `You don't have permission to ${action}. Contact your administrator for access.`,
        variant: "destructive",
      })
      return false
    }
    return true
  }

  // Handle edit agent
  const handleEditAgent = (agent: Agent) => {
    if (!isAdmin) {
      toast({
        title: "Access Restricted",
        description: "Only administrators can edit agent information.",
        variant: "destructive",
      })
      return
    }

    setEditingAgent(agent)
    setEditForm({
      name: agent.name || "",
      email: agent.email || "",
      role: agent.role || "Regular",
      status: agent.status || "Active",
    })
    setIsEditModalOpen(true)
  }

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!editingAgent) return

    // Validate email
    if (!validateEmail(editForm.email)) {
      toast({
        variant: "destructive",
        title: "Invalid Email",
        description: "Please enter a valid email address.",
      })
      return
    }

    // Check for duplicate email
    const existingAgent = agents.find(
      (a) => a.id !== editingAgent.id && a.email.toLowerCase() === editForm.email.toLowerCase(),
    )
    if (existingAgent) {
      toast({
        variant: "destructive",
        title: "Duplicate Email",
        description: "This email is already used by another agent.",
      })
      return
    }

    // Validate name
    if (editForm.name.trim().length < 2) {
      toast({
        variant: "destructive",
        title: "Invalid Name",
        description: "Name must be at least 2 characters long.",
      })
      return
    }

    try {
      const updatedAgent: Agent = {
        ...editingAgent,
        name: editForm.name.trim(),
        email: editForm.email.toLowerCase(),
        role: editForm.role as Agent["role"],
        status: editForm.status as Agent["status"],
      }

      await updateAgent(updatedAgent, user?.email)

      toast({
        title: "Agent Updated",
        description: `${editForm.name}'s information has been updated successfully.`,
      })

      setIsEditModalOpen(false)
      setEditingAgent(null)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Failed to update agent information.",
      })
    }
  }

  // Handle view details
  const handleViewDetails = (agent: Agent) => {
    setSelectedAgent(agent)
    setIsDetailsModalOpen(true)
  }

  // Handle view transactions
  const handleViewTransactions = (agent: Agent) => {
    setSelectedAgent(agent)
    setIsRecordsModalOpen(true)
  }

  // Handle delete agent
  const handleDeleteAgent = (agentId: string, agentName: string) => {
    if (!checkPermission("delete agents")) return
    if (confirm(`Are you sure you want to delete agent ${agentName}?`)) {
      deleteAgent(agentId)
      toast({
        title: "Agent deleted",
        description: `${agentName} has been removed from the system`,
      })
    }
  }

  // Handle bulk delete
  const handleBulkDelete = async () => {
    setIsDeleteModalOpen(false)

    const selectedNames = agents
      .filter((agent) => selectedAgents.includes(agent.id))
      .map((agent) => agent.name)
      .join(", ")

    for (const agentId of selectedAgents) {
      await deleteAgent(agentId)
    }

    setSelectedAgents([])

    toast({
      title: "Agents deleted",
      description: `${selectedAgents.length} agents have been removed`,
    })
  }

  // Handle select all
  const handleSelectAll = () => {
    if (selectedAgents.length === filteredAgents.length) {
      setSelectedAgents([])
    } else {
      setSelectedAgents(filteredAgents.map((agent) => agent.id))
    }
  }

  // Handle individual selection
  const handleSelectAgent = (agentId: string) => {
    if (selectedAgents.includes(agentId)) {
      setSelectedAgents(selectedAgents.filter((id) => id !== agentId))
    } else {
      setSelectedAgents([...selectedAgents, agentId])
    }
  }

  // Get role icon
  const getRoleIcon = (role?: string) => {
    switch (role) {
      case "Team Leader":
        return <Users className="h-4 w-4" />
      case "Elite":
        return <Crown className="h-4 w-4" />
      case "Regular":
        return <User className="h-4 w-4" />
      case "Spammer":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  // Get role badge color
  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case "Team Leader":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
      case "Elite":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
      case "Regular":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
      case "Spammer":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
    }
  }

  // Get status badge color
  const getStatusBadgeColor = (status?: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      case "Inactive":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
      case "Resigned":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
      default:
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
    }
  }

  // Render editable cell content
  const renderEditableCell = (agent: Agent, field: string, value: string | number) => {
    const isEditing = editingCell?.agentId === agent.id && editingCell.field === field

    const isEditable =
      (isViewer && (field === "addedToday" || field === "monthlyAdded" || field === "openAccounts")) ||
      (isAdmin &&
        (field === "name" ||
          field === "addedToday" ||
          field === "monthlyAdded" ||
          field === "openAccounts" ||
          field === "totalDeposits" ||
          field === "totalWithdrawals")) ||
      (!isViewer &&
        !isAdmin &&
        (field === "name" || field === "addedToday" || field === "monthlyAdded" || field === "openAccounts"))

    if (isEditing) {
      return (
        <div className="flex items-center gap-2 justify-center">
          <Input
            ref={inputRef}
            type={field === "name" ? "text" : "number"}
            min={field !== "name" ? "0" : undefined}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyPress}
            className="text-center border-primary/50 focus:border-primary shadow-sm"
          />
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCellEditSave}
              className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-100 rounded-full"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancelEdit}
              className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-100 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )
    }

    return (
      <div className="flex items-center justify-center group">
        <span className={field === "name" ? "font-medium" : ""}>
          {field === "name"
            ? value
            : field === "totalDeposits" || field === "totalWithdrawals"
              ? `$${Number(value).toLocaleString()}`
              : value}
        </span>
        {isEditable && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCellEditClick(agent.id, field, value)}
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity ml-2 rounded-full hover:bg-primary/10"
                >
                  <Edit className="h-3.5 w-3.5 text-primary" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit {field.replace(/([A-Z])/g, " $1").toLowerCase()}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    )
  }

  // Calculate total statistics based on time filter
  const calculateTotalStats = () => {
    let totalClients = 0
    let totalDeposits = 0
    let totalWithdrawals = 0

    agents.forEach((agent) => {
      const metrics = calculateAgentMetrics(agent.name || "")
      totalClients += metrics.totalClients
      totalDeposits += metrics.totalDeposits
      totalWithdrawals += metrics.totalWithdrawals
    })

    return {
      totalAgents: agents.length,
      activeAgents: agents.filter((agent) => (agent.status || "Active") === "Active").length,
      totalClients,
      totalDeposits,
      totalWithdrawals,
    }
  }

  const totalStats = calculateTotalStats()
  const selectedTimeFilterLabel =
    timeFilterOptions.find((option) => option.value === timeFilter)?.label || "Current Month"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Agent Performance</h1>
          <p className="text-muted-foreground">
            {isViewer
              ? "View agent performance metrics and transactions (Read-only access)"
              : "Monitor and manage agent performance metrics"}
          </p>
          {isViewer && (
            <div className="flex items-center gap-2 mt-2 text-sm text-amber-600 dark:text-amber-400">
              <Lock className="h-4 w-4" />
              <span>Read-only access - Contact administrator for editing permissions</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isViewer && (
            <Button onClick={() => setIsRegistrationModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Agent
            </Button>
          )}
        </div>
      </div>

      {/* Time Filter */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Time Period:</span>
        </div>
        <Select value={timeFilter} onValueChange={(value: TimeFilterOption) => setTimeFilter(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time period" />
          </SelectTrigger>
          <SelectContent>
            {timeFilterOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  {timeFilter === option.value && <Check className="h-4 w-4" />}
                  <span className={timeFilter !== option.value ? "ml-6" : ""}>{option.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalAgents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalStats.activeAgents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients ({selectedTimeFilterLabel})</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalStats.totalClients}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deposits ({selectedTimeFilterLabel})</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalStats.totalDeposits.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Withdrawals ({selectedTimeFilterLabel})</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${totalStats.totalWithdrawals.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search agents by name, email, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 pr-8"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchTerm("")}
              className="absolute right-1 top-1 h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === "cards" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("cards")}
              className="h-8"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="h-8"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {selectedAgents.length > 0 && !isViewer && (
            <Button
              onClick={() => setIsDeleteModalOpen(true)}
              variant="destructive"
              size="sm"
              className="animate-fade-in"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected ({selectedAgents.length})
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "cards" | "table")}>
        <TabsContent value="cards" className="space-y-4">
          {/* Agents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAgents.map((agent) => {
              const metrics = calculateAgentMetrics(agent.name || "")
              return (
                <Card key={agent.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage
                            src={`/placeholder.svg?height=40&width=40&text=${(agent.name || "A").charAt(0)}`}
                          />
                          <AvatarFallback>{(agent.name || "A").charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{agent.name || "Unknown Agent"}</CardTitle>
                          <CardDescription>{agent.email}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {isAdmin && (
                              <>
                                <DropdownMenuItem onClick={() => handleEditAgent(agent)}>
                                  <Settings className="mr-2 h-4 w-4" />
                                  Edit Agent
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            {!isViewer && (
                              <DropdownMenuItem
                                onClick={() => handleDeleteAgent(agent.id, agent.name || "Unknown Agent")}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Role and Status */}
                    <div className="flex items-center justify-between">
                      <Badge className={getRoleBadgeColor(agent.role)}>
                        <div className="flex items-center space-x-1">
                          {getRoleIcon(agent.role)}
                          <span>{agent.role || "Regular"}</span>
                        </div>
                      </Badge>
                      <Badge className={getStatusBadgeColor(agent.status)}>{agent.status || "Active"}</Badge>
                    </div>

                    {/* Performance Metrics */}
                    <div className="grid grid-cols-1 gap-4 text-sm">
                      <div className="flex justify-between items-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-600" />
                          <span className="text-muted-foreground">Total Clients</span>
                        </div>
                        <span className="font-semibold text-blue-600">{metrics.totalClients}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span className="text-muted-foreground">Total Deposits</span>
                        </div>
                        <span className="font-semibold text-green-600">${metrics.totalDeposits.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-red-600" />
                          <span className="text-muted-foreground">Total Withdrawals</span>
                        </div>
                        <span className="font-semibold text-red-600">${metrics.totalWithdrawals.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewDetails(agent)} className="flex-1">
                        <Eye className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewTransactions(agent)}
                        className="flex-1"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Transactions
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {filteredAgents.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No agents found matching your search.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="table">
          <Table>
            <TableHeader className="sticky top-0 bg-gradient-to-r from-slate-100 to-white dark:from-slate-800 dark:to-slate-900 z-10">
              <TableRow className="border-b-2 border-slate-200 dark:border-slate-700">
                {!isViewer && (
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={filteredAgents.length > 0 && selectedAgents.length === filteredAgents.length}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all agents"
                    />
                  </TableHead>
                )}
                <TableHead className="cursor-pointer font-medium text-center py-4" onClick={() => handleSort("name")}>
                  <div className="flex items-center justify-center">
                    Agent Name
                    {sortField === "name" &&
                      (sortDirection === "asc" ? (
                        <ChevronUp className="ml-1 h-4 w-4 inline" />
                      ) : (
                        <ChevronDown className="ml-1 h-4 w-4 inline" />
                      ))}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer font-medium text-center border-l border-slate-200 dark:border-slate-700"
                  onClick={() => handleSort("email")}
                >
                  <div className="flex items-center justify-center">
                    Email
                    {sortField === "email" &&
                      (sortDirection === "asc" ? (
                        <ChevronUp className="ml-1 h-4 w-4 inline" />
                      ) : (
                        <ChevronDown className="ml-1 h-4 w-4 inline" />
                      ))}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer font-medium text-center border-l border-slate-200 dark:border-slate-700"
                  onClick={() => handleSort("role")}
                >
                  <div className="flex items-center justify-center">
                    Role
                    {sortField === "role" &&
                      (sortDirection === "asc" ? (
                        <ChevronUp className="ml-1 h-4 w-4 inline" />
                      ) : (
                        <ChevronDown className="ml-1 h-4 w-4 inline" />
                      ))}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer font-medium text-center border-l border-slate-200 dark:border-slate-700"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center justify-center">
                    Status
                    {sortField === "status" &&
                      (sortDirection === "asc" ? (
                        <ChevronUp className="ml-1 h-4 w-4 inline" />
                      ) : (
                        <ChevronDown className="ml-1 h-4 w-4 inline" />
                      ))}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer font-medium text-center border-l border-slate-200 dark:border-slate-700"
                  onClick={() => handleSort("calculatedClients")}
                >
                  <div className="flex items-center justify-center">
                    Total Clients ({selectedTimeFilterLabel})
                    {sortField === "calculatedClients" &&
                      (sortDirection === "asc" ? (
                        <ChevronUp className="ml-1 h-4 w-4 inline" />
                      ) : (
                        <ChevronDown className="ml-1 h-4 w-4 inline" />
                      ))}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer font-medium text-center border-l border-slate-200 dark:border-slate-700"
                  onClick={() => handleSort("calculatedDeposits")}
                >
                  <div className="flex items-center justify-center">
                    Total Deposits ({selectedTimeFilterLabel})
                    {sortField === "calculatedDeposits" &&
                      (sortDirection === "asc" ? (
                        <ChevronUp className="ml-1 h-4 w-4 inline" />
                      ) : (
                        <ChevronDown className="ml-1 h-4 w-4 inline" />
                      ))}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer font-medium text-center border-l border-slate-200 dark:border-slate-700"
                  onClick={() => handleSort("calculatedWithdrawals")}
                >
                  <div className="flex items-center justify-center">
                    Total Withdrawals ({selectedTimeFilterLabel})
                    {sortField === "calculatedWithdrawals" &&
                      (sortDirection === "asc" ? (
                        <ChevronUp className="ml-1 h-4 w-4 inline" />
                      ) : (
                        <ChevronDown className="ml-1 h-4 w-4 inline" />
                      ))}
                  </div>
                </TableHead>
                <TableHead className="text-center border-l border-slate-200 dark:border-slate-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAgents.length > 0 ? (
                filteredAgents.map((agent, index) => {
                  const metrics = calculateAgentMetrics(agent.name || "")
                  return (
                    <TableRow
                      key={agent.id}
                      className={`transition-colors ${
                        editingCell?.agentId === agent.id
                          ? "bg-blue-50 dark:bg-blue-900/20"
                          : index % 2 === 0
                            ? "bg-white dark:bg-slate-950"
                            : "bg-slate-50 dark:bg-slate-900/50"
                      } ${selectedAgents.includes(agent.id) ? "bg-primary/5 dark:bg-primary/10" : ""}`}
                    >
                      {!isViewer && (
                        <TableCell className="w-[50px]">
                          <Checkbox
                            checked={selectedAgents.includes(agent.id)}
                            onCheckedChange={() => handleSelectAgent(agent.id)}
                            aria-label={`Select ${agent.name}`}
                          />
                        </TableCell>
                      )}
                      <TableCell className="text-center font-medium">
                        {renderEditableCell(agent, "name", agent.name || "Unknown Agent")}
                      </TableCell>
                      <TableCell className="text-center border-l border-slate-100 dark:border-slate-800">
                        <span className="text-sm">{agent.email}</span>
                      </TableCell>
                      <TableCell className="text-center border-l border-slate-100 dark:border-slate-800">
                        <div className="flex justify-center">
                          <Badge className={getRoleBadgeColor(agent.role)}>
                            <div className="flex items-center space-x-1">
                              {getRoleIcon(agent.role)}
                              <span>{agent.role || "Regular"}</span>
                            </div>
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-center border-l border-slate-100 dark:border-slate-800">
                        <div className="flex justify-center">
                          <Badge className={getStatusBadgeColor(agent.status)}>{agent.status || "Active"}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-center border-l border-slate-100 dark:border-slate-800">
                        <span className="font-medium text-blue-600">{metrics.totalClients}</span>
                      </TableCell>
                      <TableCell className="text-center border-l border-slate-100 dark:border-slate-800">
                        <span className="font-medium text-green-600">${metrics.totalDeposits.toLocaleString()}</span>
                      </TableCell>
                      <TableCell className="text-center border-l border-slate-100 dark:border-slate-800">
                        <span className="font-medium text-red-600">${metrics.totalWithdrawals.toLocaleString()}</span>
                      </TableCell>
                      <TableCell className="text-center border-l border-slate-100 dark:border-slate-800">
                        <div className="flex justify-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleViewDetails(agent)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleViewTransactions(agent)}>
                            <FileText className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {isAdmin && (
                                <>
                                  <DropdownMenuItem onClick={() => handleEditAgent(agent)}>
                                    <Settings className="mr-2 h-4 w-4" />
                                    Edit Agent
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              {!isViewer && (
                                <DropdownMenuItem
                                  onClick={() => handleDeleteAgent(agent.id, agent.name || "Unknown Agent")}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={!isViewer ? 9 : 8} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center justify-center">
                      <Users className="h-8 w-8 text-muted-foreground/50 mb-2" />
                      <p>No agents found</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>

      {/* Edit Agent Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Agent</DialogTitle>
            <DialogDescription>Update agent information. Changes will be saved immediately.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="col-span-3"
                placeholder="Agent name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="col-span-3"
                placeholder="agent@example.com"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Select value={editForm.role} onValueChange={(value) => setEditForm({ ...editForm, role: value })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Regular">Regular</SelectItem>
                  <SelectItem value="Elite">Elite</SelectItem>
                  <SelectItem value="Spammer">Spammer</SelectItem>
                  <SelectItem value="Team Leader">Team Leader</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select value={editForm.status} onValueChange={(value) => setEditForm({ ...editForm, status: value })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Resigned">Resigned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modals */}
      {selectedAgent && (
        <>
          <AgentDetailsModal
            isOpen={isDetailsModalOpen}
            onClose={() => setIsDetailsModalOpen(false)}
            agentName={selectedAgent.name}
            agentRole={selectedAgent.role || "Regular"}
            agentStatus={selectedAgent.status || "Active"}
          />
          <AgentRecordsModal
            isOpen={isRecordsModalOpen}
            onClose={() => setIsRecordsModalOpen(false)}
            agentName={selectedAgent.name}
            agentRole={selectedAgent.role || "Regular"}
            agentStatus={selectedAgent.status || "Active"}
          />
        </>
      )}

      {isRegistrationModalOpen && (
        <AgentRegistrationModal isOpen={isRegistrationModalOpen} onClose={() => setIsRegistrationModalOpen(false)} />
      )}

      {/* Bulk Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedAgents.length} selected agent
              {selectedAgents.length !== 1 ? "s" : ""}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete {selectedAgents.length} Agent{selectedAgents.length !== 1 ? "s" : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
