"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useTeamContext } from "@/context/team-context"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Trash2,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Search,
  UserPlus,
  FileDown,
  Upload,
  Edit,
  Check,
  X,
  RefreshCw,
  Users,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import AgentRegistrationModal from "./agent-registration-modal"
import AgentImportModal from "./agent-import-modal"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import DataResetModal from "@/components/modals/data-reset-modal"
import { format } from "date-fns"

import "./agent-table.css"

export default function AgentTable() {
  const { agents, updateAgent, deleteAgent } = useTeamContext()
  const { isViewer, isAdmin, user } = useAuth()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredAgents, setFilteredAgents] = useState(agents)
  const [sortField, setSortField] = useState<keyof (typeof agents)[0]>("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [editingCell, setEditingCell] = useState<{ agentId: string; field: string } | null>(null)
  const [editValue, setEditValue] = useState<string | number>("")
  const inputRef = useRef<HTMLInputElement>(null)
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  // Add state for data reset modal
  const [isResetModalOpen, setIsResetModalOpen] = useState(false)

  // Filter and sort agents
  useEffect(() => {
    let result = [...agents]

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (agent) => agent.name.toLowerCase().includes(term) || agent.totalDeposits.toString().includes(term),
      )
    }

    // Apply sorting
    result.sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue
      }

      // String comparison
      const aString = String(aValue).toLowerCase()
      const bString = String(bValue).toLowerCase()

      if (aString < bString) return sortDirection === "asc" ? -1 : 1
      if (aString > bString) return sortDirection === "asc" ? 1 : -1
      return 0
    })

    setFilteredAgents(result)
  }, [agents, searchTerm, sortField, sortDirection])

  // Focus input when editing cell
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus()
    }
  }, [editingCell])

  // Handle sort
  const handleSort = (field: keyof (typeof agents)[0]) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Handle cell edit click
  const handleCellEditClick = (agentId: string, field: string, value: string | number) => {
    // Define which fields are editable based on user role
    const isEditable =
      // For viewers: only these specific fields are editable
      (isViewer && (field === "addedToday" || field === "monthlyAdded" || field === "openAccounts")) ||
      // For admins: all these fields are editable including totalDeposits and totalWithdrawals
      (isAdmin &&
        (field === "name" ||
          field === "addedToday" ||
          field === "monthlyAdded" ||
          field === "openAccounts" ||
          field === "totalDeposits" ||
          field === "totalWithdrawals")) ||
      // For non-viewers (editors): these fields are editable
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
    // Pass the user's email to record who made the edit
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

  // Handle delete agent
  const handleDeleteAgent = (agentId: string, agentName: string) => {
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

    // Get names for toast message
    const selectedNames = agents
      .filter((agent) => selectedAgents.includes(agent.id))
      .map((agent) => agent.name)
      .join(", ")

    // Delete all selected agents
    for (const agentId of selectedAgents) {
      await deleteAgent(agentId)
    }

    // Clear selection
    setSelectedAgents([])

    // Show success toast
    toast({
      title: "Agents deleted",
      description: `${selectedAgents.length} agents have been removed`,
    })
  }

  // Handle data reset
  const handleDataReset = async (resetDate: Date, options: { today: boolean; monthly: boolean; open: boolean }) => {
    try {
      // Track how many agents were updated
      let updatedCount = 0

      // Create a copy of agents to modify
      const updatedAgents = [...agents]

      // Update each agent based on selected options
      for (const agent of updatedAgents) {
        let needsUpdate = false
        const updatedAgent = { ...agent }

        if (options.today) {
          updatedAgent.addedToday = 0
          needsUpdate = true
        }

        if (options.monthly) {
          updatedAgent.monthlyAdded = 0
          needsUpdate = true
        }

        if (options.open) {
          updatedAgent.openAccounts = 0
          needsUpdate = true
        }

        // Only update if something changed
        if (needsUpdate) {
          await updateAgent(updatedAgent)
          updatedCount++
        }
      }

      // Build reset options string for toast message
      const resetOptions = []
      if (options.today) resetOptions.push("Added Today")
      if (options.monthly) resetOptions.push("Monthly Added")
      if (options.open) resetOptions.push("Open Accounts")

      // Show success message with details of what was reset
      toast({
        title: "Data Reset Complete",
        description: `Reset ${resetOptions.join(", ")} for ${updatedCount} agents on ${format(resetDate, "MMMM d, yyyy")}`,
      })

      // Close the modal
      setIsResetModalOpen(false)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: (error as Error).message || "An error occurred while resetting data",
      })
    }
  }

  // Handle select all
  const handleSelectAll = () => {
    if (selectedAgents.length === filteredAgents.length) {
      // If all are selected, deselect all
      setSelectedAgents([])
    } else {
      // Otherwise, select all
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

  // Get commission tier class
  const getCommissionTierClass = (rate: number) => {
    if (rate === 0) return "commission-tier-0"
    if (rate === 4) return "commission-tier-4"
    if (rate === 5) return "commission-tier-5"
    if (rate === 7) return "commission-tier-7"
    if (rate === 9) return "commission-tier-9"
    if (rate === 10) return "commission-tier-10"
    return "" // Return empty string for default case
  }

  const handleExportCsv = () => {
    // Create CSV content
    const headers = [
      "Agent Name",
      "Added Today",
      "Monthly Added",
      "Open Accounts",
      "Total Deposits",
      "Commission Rate",
      "Commission Amount",
    ]
    const rows = filteredAgents.map((agent) => [
      agent.name,
      agent.addedToday,
      agent.monthlyAdded,
      agent.openAccounts,
      agent.totalDeposits,
      `${agent.commissionRate}%`,
      agent.commission,
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => (typeof cell === "string" && cell.includes(",") ? `"${cell}"` : cell)).join(","),
      ),
    ].join("\n")

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "agent_overview.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Export Successful",
      description: "Agent overview data has been exported to CSV",
    })
  }

  const handleExportTemplate = () => {
    // Create CSV template with just headers
    const headers = ["Agent Name", "Added Today", "Monthly Added", "Total Deposits"]
    const csvContent = headers.join(",")

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "agent_import_template.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Template Downloaded",
      description: "CSV import template has been downloaded",
    })
  }

  // Render editable cell content
  const renderEditableCell = (agent: any, field: string, value: string | number) => {
    const isEditing = editingCell?.agentId === agent.id && editingCell.field === field

    // Define which fields are editable based on user role
    const isEditable =
      // For viewers: only these specific fields are editable
      (isViewer && (field === "addedToday" || field === "monthlyAdded" || field === "openAccounts")) ||
      // For admins: all these fields are editable including totalDeposits and totalWithdrawals
      (isAdmin &&
        (field === "name" ||
          field === "addedToday" ||
          field === "monthlyAdded" ||
          field === "openAccounts" ||
          field === "totalDeposits" ||
          field === "totalWithdrawals")) ||
      // For non-viewers (editors): these fields are editable
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
            className="editable-cell-input text-center border-primary/50 focus:border-primary shadow-sm"
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
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity ml-2 rounded-full hover:bg-primary/10 dark:hover:bg-primary/20 dark:hover:shadow-[0_0_10px_rgba(59,130,246,0.5)] dark:hover:text-primary-foreground"
                >
                  <Edit className="h-3.5 w-3.5 text-primary dark:text-white" />
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search agents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="flex flex-wrap gap-2">
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

          {/* Add Reset Data button for admin users */}
          {isAdmin && (
            <Button
              onClick={() => setIsResetModalOpen(true)}
              variant="outline"
              size="sm"
              className="animate-fade-in bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:text-amber-800 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-900"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset Data
            </Button>
          )}

          <Button onClick={handleExportCsv} variant="outline" size="sm" className="animate-fade-in">
            <FileDown className="h-4 w-4 mr-2" />
            Export CSV
          </Button>

          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="animate-fade-in">
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsImportModalOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Import CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportTemplate}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Download Template
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button onClick={() => setIsRegistrationModalOpen(true)} className="animate-fade-in">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Agent
          </Button>
        </div>
      </div>

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
              onClick={() => handleSort("addedToday")}
            >
              <div className="flex items-center justify-center">
                Added Today
                {sortField === "addedToday" &&
                  (sortDirection === "asc" ? (
                    <ChevronUp className="ml-1 h-4 w-4 inline" />
                  ) : (
                    <ChevronDown className="ml-1 h-4 w-4 inline" />
                  ))}
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer font-medium text-center border-l border-slate-200 dark:border-slate-700"
              onClick={() => handleSort("monthlyAdded")}
            >
              <div className="flex items-center justify-center">
                Monthly Added
                {sortField === "monthlyAdded" &&
                  (sortDirection === "asc" ? (
                    <ChevronUp className="ml-1 h-4 w-4 inline" />
                  ) : (
                    <ChevronDown className="ml-1 h-4 w-4 inline" />
                  ))}
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer font-medium text-center border-l border-slate-200 dark:border-slate-700"
              onClick={() => handleSort("openAccounts")}
            >
              <div className="flex items-center justify-center">
                Open Accounts
                {sortField === "openAccounts" &&
                  (sortDirection === "asc" ? (
                    <ChevronUp className="ml-1 h-4 w-4 inline" />
                  ) : (
                    <ChevronDown className="ml-1 h-4 w-4 inline" />
                  ))}
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer font-medium text-center border-l border-slate-200 dark:border-slate-700"
              onClick={() => handleSort("totalDeposits")}
            >
              <div className="flex items-center justify-center">
                Total Deposits
                {sortField === "totalDeposits" &&
                  (sortDirection === "asc" ? (
                    <ChevronUp className="ml-1 h-4 w-4 inline" />
                  ) : (
                    <ChevronDown className="ml-1 h-4 w-4 inline" />
                  ))}
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer font-medium text-center border-l border-slate-200 dark:border-slate-700"
              onClick={() => handleSort("totalWithdrawals")}
            >
              <div className="flex items-center justify-center">
                Total Withdrawals
                {sortField === "totalWithdrawals" &&
                  (sortDirection === "asc" ? (
                    <ChevronUp className="ml-1 h-4 w-4 inline" />
                  ) : (
                    <ChevronDown className="ml-1 h-4 w-4 inline" />
                  ))}
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer font-medium text-center border-l border-slate-200 dark:border-slate-700"
              onClick={() => handleSort("commissionRate")}
            >
              <div className="flex items-center justify-center">
                Commission
                {sortField === "commissionRate" &&
                  (sortDirection === "asc" ? (
                    <ChevronUp className="ml-1 h-4 w-4 inline" />
                  ) : (
                    <ChevronDown className="ml-1 h-4 w-4 inline" />
                  ))}
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer font-medium text-center border-l border-slate-200 dark:border-slate-700"
              onClick={() => handleSort("lastEditedBy")}
            >
              <div className="flex items-center justify-center">
                Last Edited By
                {sortField === "lastEditedBy" &&
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
            filteredAgents.map((agent, index) => (
              <TableRow
                key={agent.id}
                className={`agent-row transition-colors ${
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
                <TableCell className="editable-cell text-center font-medium">
                  {renderEditableCell(agent, "name", agent.name)}
                </TableCell>
                <TableCell className="editable-cell text-center border-l border-slate-100 dark:border-slate-800">
                  {renderEditableCell(agent, "addedToday", agent.addedToday)}
                </TableCell>
                <TableCell className="editable-cell text-center border-l border-slate-100 dark:border-slate-800">
                  {renderEditableCell(agent, "monthlyAdded", agent.monthlyAdded)}
                </TableCell>
                <TableCell className="editable-cell text-center border-l border-slate-100 dark:border-slate-800">
                  {renderEditableCell(agent, "openAccounts", agent.openAccounts)}
                </TableCell>
                <TableCell
                  className={`${isAdmin ? "editable-cell" : ""} text-center border-l border-slate-100 dark:border-slate-800`}
                >
                  {isAdmin ? (
                    renderEditableCell(agent, "totalDeposits", agent.totalDeposits)
                  ) : (
                    <span className="font-medium">${agent.totalDeposits.toLocaleString()}</span>
                  )}
                </TableCell>
                <TableCell
                  className={`${isAdmin ? "editable-cell" : ""} text-center border-l border-slate-100 dark:border-slate-800`}
                >
                  {isAdmin ? (
                    renderEditableCell(agent, "totalWithdrawals", agent.totalWithdrawals || 0)
                  ) : (
                    <span className="font-medium">${(agent.totalWithdrawals || 0).toLocaleString()}</span>
                  )}
                </TableCell>
                <TableCell className="text-center border-l border-slate-100 dark:border-slate-800">
                  <div className="flex justify-center">
                    <Badge className={`${getCommissionTierClass(agent.commissionRate || 0)} transition-all shadow-sm`}>
                      {agent.commissionRate}% (${agent.commission?.toLocaleString()})
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-center border-l border-slate-100 dark:border-slate-800">
                  {agent.lastEditedBy ? (
                    <div className="flex flex-col items-center justify-center">
                      <span className="font-medium">{agent.lastEditedBy}</span>
                      {agent.lastEditedAt && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(agent.lastEditedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">Not edited</span>
                  )}
                </TableCell>
                <TableCell className="text-center border-l border-slate-100 dark:border-slate-800">
                  {!isViewer && (
                    <div className="flex justify-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors rounded-full"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDeleteAgent(agent.id, agent.name)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={!isViewer ? 10 : 9} className="text-center py-12 text-muted-foreground">
                <div className="flex flex-col items-center justify-center">
                  <Users className="h-8 w-8 text-muted-foreground/50 mb-2" />
                  <p>No agents found</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {isRegistrationModalOpen && (
        <AgentRegistrationModal isOpen={isRegistrationModalOpen} onClose={() => setIsRegistrationModalOpen(false)} />
      )}

      {isImportModalOpen && <AgentImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />}

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

      {/* Data Reset Modal */}
      <DataResetModal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} onReset={handleDataReset} />
    </div>
  )
}
