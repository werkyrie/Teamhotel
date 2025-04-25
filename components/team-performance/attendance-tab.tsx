"use client"

import { useState, useMemo } from "react"
import { useTeamContext } from "@/context/team-context"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
// Add import for PlusCircle icon
import { Trash2, CalendarIcon, FileDown, PlusCircle, Pencil, X, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import type { Attendance } from "@/types/team"
import { PaginationControls } from "@/components/pagination-controls"

export default function AttendanceTab() {
  const { agents, attendance, addAttendance, deleteAttendance, updateAttendance } = useTeamContext()
  const { isViewer, isAdmin } = useAuth()
  const { toast } = useToast()

  // Add pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  const [selectedAgentId, setSelectedAgentId] = useState("")
  const [remarks, setRemarks] = useState("")
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [status, setStatus] = useState<"Whole Day" | "Half Day" | "Leave" | "Undertime">("Whole Day")
  // Add a state variable to control form visibility
  const [showForm, setShowForm] = useState(false)
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  // Add state for editing
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<{
    remarks: string
    date: Date | undefined
    status: "Whole Day" | "Half Day" | "Leave" | "Undertime"
  }>({
    remarks: "",
    date: undefined,
    status: "Whole Day",
  })

  // Sort the attendance records
  const sortedAttendance = useMemo(() => {
    const sorted = [...attendance].sort((a, b) => {
      if (!sortField) return 0

      if (sortField === "date") {
        const dateA = new Date(a.date).getTime()
        const dateB = new Date(b.date).getTime()
        return sortDirection === "asc" ? dateA - dateB : dateB - dateA
      }

      return 0
    })
    return sorted
  }, [attendance, sortField, sortDirection])

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentAttendance = sortedAttendance.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(sortedAttendance.length / itemsPerPage)

  // Handle page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Handle items per page changes
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset to first page when changing items per page
  }

  // Modify the handleAddAttendance function to prevent duplicates
  const handleAddAttendance = async () => {
    if (!selectedAgentId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select an agent",
      })
      return
    }

    const selectedAgent = agents.find((a) => a.id === selectedAgentId)
    if (!selectedAgent) return

    const formattedDate = date ? format(date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")

    try {
      await addAttendance({
        agentId: selectedAgentId,
        agentName: selectedAgent.name,
        remarks,
        date: formattedDate,
        status,
      })

      // Reset form
      setSelectedAgentId("")
      setRemarks("")
      setDate(new Date())
      setStatus("Whole Day")
      // Hide form after submission
      setShowForm(false)

      toast({
        title: "Absence Added",
        description: `Absence has been recorded for ${selectedAgent.name}`,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: (error as Error).message || "Failed to add absence record",
      })
    }
  }

  const handleDeleteAttendance = (id: string, agentName: string) => {
    if (confirm(`Are you sure you want to delete this absence record for ${agentName}?`)) {
      deleteAttendance(id)
      toast({
        title: "Absence Deleted",
        description: `Absence for ${agentName} has been removed`,
      })
    }
  }

  // Get status badge color
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

  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      // Set new field and default to ascending
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const handleExportCsv = () => {
    // Create CSV content
    const headers = ["Date", "Agent", "Status", "Remarks"]
    const rows = attendance.map((record) => [record.date, record.agentName, record.status, record.remarks])

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
    link.setAttribute("download", "absences.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Export Successful",
      description: "Absences data has been exported to CSV",
    })
  }

  // Start editing an attendance record
  const handleStartEdit = (record: Attendance) => {
    setEditingId(record.id)
    setEditData({
      remarks: record.remarks,
      date: record.date ? new Date(record.date) : undefined,
      status: record.status,
    })
  }

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null)
    setEditData({
      remarks: "",
      date: undefined,
      status: "Whole Day",
    })
  }

  // Save edited attendance record
  const handleSaveEdit = async (record: Attendance) => {
    try {
      const formattedDate = editData.date ? format(editData.date, "yyyy-MM-dd") : record.date

      const updatedAttendance: Attendance = {
        ...record,
        remarks: editData.remarks,
        date: formattedDate,
        status: editData.status,
      }

      await updateAttendance(updatedAttendance)
      setEditingId(null)

      toast({
        title: "Absence Record Updated",
        description: `Absence record for ${record.agentName} has been updated`,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: (error as Error).message || "Failed to update absence record",
      })
    }
  }

  // Replace the form card with this updated version that includes a toggle button
  return (
    <div className="space-y-6">
      {/* Only show the add attendance button for non-viewers */}
      {!isViewer && (
        <div className="flex justify-end mb-4">
          <Button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2">
            {showForm ? "Cancel" : "Add Absence"}
            {!showForm && <PlusCircle className="h-4 w-4" />}
          </Button>
        </div>
      )}

      {/* Only show the add attendance form for non-viewers and when showForm is true */}
      {!isViewer && showForm && (
        <Card className="animate-fade-in shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader>
            <CardTitle>Add Absent Record</CardTitle>
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
                <Label htmlFor="status">Status</Label>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value as "Whole Day" | "Half Day" | "Leave" | "Undertime")}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Whole Day">Whole Day</SelectItem>
                    <SelectItem value="Half Day">Half Day</SelectItem>
                    <SelectItem value="Leave">Leave</SelectItem>
                    <SelectItem value="Undertime">Undertime</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea
                  id="remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter any additional remarks"
                  rows={3}
                />
              </div>

              <div className="md:col-span-2">
                <Button onClick={handleAddAttendance} className="w-full">
                  Add Absent Record
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="animate-fade-in shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Absence Records</CardTitle>
            <Button variant="outline" size="sm" onClick={handleExportCsv}>
              <FileDown className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border shadow-sm overflow-x-auto bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead
                    className="font-medium cursor-pointer"
                    onDoubleClick={() => handleSort("date")}
                    title="Double-click to sort"
                  >
                    Date {sortField === "date" && (sortDirection === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead className="font-medium">Agent</TableHead>
                  <TableHead className="font-medium">Status</TableHead>
                  <TableHead className="font-medium">Remarks</TableHead>
                  {!isViewer && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentAttendance.length > 0 ? (
                  currentAttendance.map((record) => (
                    <TableRow key={record.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        {editingId === record.id ? (
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
                          record.date
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{record.agentName}</TableCell>
                      <TableCell>
                        {editingId === record.id ? (
                          <Select
                            value={editData.status}
                            onValueChange={(value) =>
                              setEditData({
                                ...editData,
                                status: value as "Whole Day" | "Half Day" | "Leave" | "Undertime",
                              })
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Whole Day">Whole Day</SelectItem>
                              <SelectItem value="Half Day">Half Day</SelectItem>
                              <SelectItem value="Leave">Leave</SelectItem>
                              <SelectItem value="Undertime">Undertime</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge className={getStatusColor(record.status)}>{record.status}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === record.id ? (
                          <Textarea
                            value={editData.remarks}
                            onChange={(e) => setEditData({ ...editData, remarks: e.target.value })}
                            className="min-h-[60px]"
                          />
                        ) : (
                          record.remarks
                        )}
                      </TableCell>
                      {!isViewer && (
                        <TableCell className="text-right">
                          {editingId === record.id ? (
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleSaveEdit(record)}
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
                                  onClick={() => handleStartEdit(record)}
                                  className="hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/20"
                                >
                                  <Pencil className="h-4 w-4 text-blue-500" />
                                  <span className="sr-only">Edit</span>
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteAttendance(record.id, record.agentName)}
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
                    <TableCell colSpan={isViewer ? 4 : 5} className="text-center py-8 text-muted-foreground">
                      No absence records found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      {attendance.length > 0 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalItems={attendance.length}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      )}
    </div>
  )
}
