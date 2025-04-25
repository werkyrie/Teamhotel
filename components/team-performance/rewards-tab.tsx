"use client"

import { useState } from "react"
import { useTeamContext } from "@/context/team-context"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Trash2, CalendarIcon, FileDown, PlusCircle, RefreshCw, Pencil, X, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import DataResetModal from "@/components/modals/data-reset-modal"
import type { Reward } from "@/types/team"
import { PaginationControls } from "@/components/pagination-controls"

export default function RewardsTab() {
  // Add pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  const { agents, rewards: existingRewards, addReward, deleteReward, updateReward } = useTeamContext()
  const { isViewer, isAdmin } = useAuth() // Get viewer and admin status
  const { toast } = useToast()

  const [selectedAgentId, setSelectedAgentId] = useState("")
  const [description, setDescription] = useState("")
  const [rewardAmount, setRewards] = useState("")
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [status, setStatus] = useState<"Received" | "Pending" | "Cancelled">("Pending")
  const [showForm, setShowForm] = useState(false)

  // Add state for data reset modal
  const [showResetModal, setShowResetModal] = useState(false)

  // Add state for editing
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<{
    description: string
    amount: string
    date: Date | undefined
    status: "Received" | "Pending" | "Cancelled"
  }>({
    description: "",
    amount: "",
    date: undefined,
    status: "Pending",
  })

  // Add state for sorting
  const [sortField, setSortField] = useState<string | null>("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentRewards = existingRewards.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(existingRewards.length / itemsPerPage)

  // Handle page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Handle items per page changes
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset to first page when changing items per page
  }

  const handleAddReward = async () => {
    if (!selectedAgentId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select an agent",
      })
      return
    }

    if (!description.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a description",
      })
      return
    }

    if (!rewardAmount.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a reward value",
      })
      return
    }

    const selectedAgent = agents.find((a) => a.id === selectedAgentId)
    if (!selectedAgent) return

    const formattedDate = date ? format(date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")

    try {
      await addReward({
        agentId: selectedAgentId,
        agentName: selectedAgent.name,
        description,
        amount: rewardAmount,
        date: formattedDate,
        status,
      })

      // Reset form
      setSelectedAgentId("")
      setDescription("")
      setRewards("")
      setDate(new Date())
      setStatus("Pending")
      setShowForm(false)

      toast({
        title: "Reward Added",
        description: `Reward has been recorded for ${selectedAgent.name}`,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: (error as Error).message || "Failed to add reward",
      })
    }
  }

  const handleDeleteReward = (id: string, agentName: string) => {
    if (confirm(`Are you sure you want to delete this reward for ${agentName}?`)) {
      deleteReward(id)
      toast({
        title: "Reward Deleted",
        description: `Reward for ${agentName} has been removed`,
      })
    }
  }

  // Handle data reset
  const handleDataReset = (resetDate: Date, options: { today: boolean; monthly: boolean; open: boolean }) => {
    try {
      // This would be implemented to call your actual data reset API
      console.log("Resetting data for:", format(resetDate, "yyyy-MM-dd"), options)

      // Show success message
      toast({
        title: "Data Reset Complete",
        description: `Selected data has been reset for ${format(resetDate, "MMMM d, yyyy")}`,
      })

      // Close the modal
      setShowResetModal(false)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: (error as Error).message || "An error occurred while resetting data",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Received":
        return "bg-green-500"
      case "Pending":
        return "bg-yellow-500"
      case "Cancelled":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const handleExportCsv = () => {
    const headers = ["Date", "Agent", "Description", "Rewards", "Status"]
    const rows = existingRewards.map((reward) => [
      reward.date,
      reward.agentName,
      reward.description,
      reward.amount,
      reward.status,
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => (typeof cell === "string" && cell.includes(",") ? `"${cell}"` : cell)).join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "rewards.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Export Successful",
      description: "Rewards data has been exported to CSV",
    })
  }

  // Start editing a reward
  const handleStartEdit = (reward: Reward) => {
    setEditingId(reward.id)
    setEditData({
      description: reward.description,
      amount: reward.amount.toString(),
      date: reward.date ? new Date(reward.date) : undefined,
      status: reward.status,
    })
  }

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null)
    setEditData({
      description: "",
      amount: "",
      date: undefined,
      status: "Pending",
    })
  }

  // Save edited reward
  const handleSaveEdit = async (reward: Reward) => {
    if (!editData.description.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Description cannot be empty",
      })
      return
    }

    if (!editData.amount.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Reward amount cannot be empty",
      })
      return
    }

    try {
      const formattedDate = editData.date ? format(editData.date, "yyyy-MM-dd") : reward.date

      const updatedReward: Reward = {
        ...reward,
        description: editData.description,
        amount: editData.amount,
        date: formattedDate,
        status: editData.status,
      }

      await updateReward(updatedReward)
      setEditingId(null)

      toast({
        title: "Reward Updated",
        description: `Reward for ${reward.agentName} has been updated`,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: (error as Error).message || "Failed to update reward",
      })
    }
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Sort rewards
  const sortedRewards = [...existingRewards].sort((a, b) => {
    if (sortField) {
      const aValue = sortField === "date" ? new Date(a.date).getTime() : a[sortField as keyof Reward]
      const bValue = sortField === "date" ? new Date(b.date).getTime() : b[sortField as keyof Reward]

      if (aValue < bValue) {
        return sortDirection === "asc" ? -1 : 1
      }
      if (aValue > bValue) {
        return sortDirection === "asc" ? 1 : -1
      }
    }
    return 0
  })

  // Calculate pagination based on sorted rewards
  const sortedIndexOfLastItem = currentPage * itemsPerPage
  const sortedIndexOfFirstItem = sortedIndexOfLastItem - itemsPerPage
  const currentSortedRewards = sortedRewards.slice(sortedIndexOfFirstItem, sortedIndexOfLastItem)
  const sortedTotalPages = Math.ceil(sortedRewards.length / itemsPerPage)

  return (
    <div className="space-y-6">
      {!isViewer && (
        <div className="flex justify-end mb-4">
          <Button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2">
            {showForm ? "Cancel" : "Add New Reward"}
            {!showForm && <PlusCircle className="h-4 w-4" />}
          </Button>
        </div>
      )}

      {!isViewer && showForm && (
        <Card className="animate-fade-in shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader>
            <CardTitle>Add New Reward</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="agent">Agent</Label>
                <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                  <SelectTrigger id="agent">
                    <SelectValue placeholder="Select agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rewards">Rewards</Label>
                <Input
                  id="rewards"
                  type="text"
                  value={rewardAmount}
                  onChange={(e) => setRewards(e.target.value)}
                  placeholder="Enter reward value"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value as "Received" | "Pending" | "Cancelled")}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Received">Received</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter reward description"
                  rows={3}
                />
              </div>

              <div className="md:col-span-2">
                <Button onClick={handleAddReward} className="w-full">
                  Add Reward
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="animate-fade-in shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Reward Records</CardTitle>
            <div className="flex gap-2">
              {/* Only show Reset Data button for admin users */}
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowResetModal(true)}
                  className="flex items-center gap-1 bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:text-amber-800 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-900"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Reset Data
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleExportCsv}>
                <FileDown className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border shadow-sm overflow-x-auto bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-medium cursor-pointer" onClick={() => handleSort("date")}>
                    Date
                    {sortField === "date" && (sortDirection === "asc" ? " ↑" : " ↓")}
                  </TableHead>
                  <TableHead className="font-medium">Agent</TableHead>
                  <TableHead className="font-medium">Description</TableHead>
                  <TableHead className="font-medium">Rewards</TableHead>
                  <TableHead className="font-medium">Status</TableHead>
                  {!isViewer && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentSortedRewards.length > 0 ? (
                  currentSortedRewards.map((reward) => (
                    <TableRow key={reward.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        {editingId === reward.id ? (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !editData.date && "text-muted-foreground",
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {editData.date ? format(editData.date, "PPP") : <span>Pick a date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={editData.date}
                                onSelect={(date) => setEditData({ ...editData, date })}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        ) : (
                          reward.date
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{reward.agentName}</TableCell>
                      <TableCell>
                        {editingId === reward.id ? (
                          <Textarea
                            value={editData.description}
                            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                            className="min-h-[60px]"
                          />
                        ) : (
                          reward.description
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {editingId === reward.id ? (
                          <Input
                            type="text"
                            value={editData.amount}
                            onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
                          />
                        ) : (
                          reward.amount.toLocaleString()
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === reward.id ? (
                          <Select
                            value={editData.status}
                            onValueChange={(value) =>
                              setEditData({
                                ...editData,
                                status: value as "Received" | "Pending" | "Cancelled",
                              })
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Received">Received</SelectItem>
                              <SelectItem value="Pending">Pending</SelectItem>
                              <SelectItem value="Cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge className={`${getStatusColor(reward.status)} transition-all`}>{reward.status}</Badge>
                        )}
                      </TableCell>
                      {!isViewer && (
                        <TableCell className="text-right">
                          {editingId === reward.id ? (
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleSaveEdit(reward)}
                                className="hover:bg-green-100 hover:text-green-600 dark:hover:bg-green-900/20"
                              >
                                <Check className="h-4 w-4 text-green-500" />
                                <span className="sr-only">Save</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleCancelEdit}
                                className="hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20"
                              >
                                <X className="h-4 w-4 text-red-500" />
                                <span className="sr-only">Cancel</span>
                              </Button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-2">
                              {isAdmin && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleStartEdit(reward)}
                                  className="hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/20"
                                >
                                  <Pencil className="h-4 w-4 text-blue-500" />
                                  <span className="sr-only">Edit</span>
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteReward(reward.id, reward.agentName)}
                                className="hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={isViewer ? 5 : 6} className="text-center py-8 text-muted-foreground">
                      No rewards recorded
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {existingRewards.length > 0 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={sortedTotalPages}
          onPageChange={handlePageChange}
          totalItems={existingRewards.length}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      )}

      {/* Data Reset Modal */}
      <DataResetModal isOpen={showResetModal} onClose={() => setShowResetModal(false)} onReset={handleDataReset} />
    </div>
  )
}
