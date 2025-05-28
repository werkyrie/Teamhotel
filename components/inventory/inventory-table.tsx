"use client"

import { useState } from "react"
import type { DeviceInventory } from "@/types/inventory"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Edit, Trash2, Eye, EyeOff } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DeviceEditModal } from "./device-edit-modal"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/context/auth-context"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Download } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface InventoryTableProps {
  devices: DeviceInventory[]
  onDelete: (id: string) => Promise<boolean>
  onUpdate: (id: string, device: Partial<DeviceInventory>) => Promise<boolean>
  searchTerm: string
  setSearchTerm: (term: string) => void
}

export default function InventoryTable({
  devices,
  onDelete,
  onUpdate,
  searchTerm,
  setSearchTerm,
}: InventoryTableProps) {
  const [deviceToDelete, setDeviceToDelete] = useState<string | null>(null)
  const [deviceToEdit, setDeviceToEdit] = useState<DeviceInventory | null>(null)
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportDateRange, setExportDateRange] = useState<"all" | "month" | "custom">("all")
  const [exportStartDate, setExportStartDate] = useState<Date>()
  const [exportEndDate, setExportEndDate] = useState<Date>()
  const [exportAgent, setExportAgent] = useState<string>("all")
  const [exportColumns, setExportColumns] = useState<string[]>([
    "agent",
    "imei",
    "model",
    "color",
    "appleIdUsername",
    "password",
    "dateChecked",
    "remarks",
  ])
  const { toast } = useToast()
  const { isAdmin } = useAuth()

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  // Toggle password visibility for a specific device
  const togglePasswordVisibility = (deviceId: string) => {
    setShowPasswords((prev) => ({
      ...prev,
      [deviceId]: !prev[deviceId],
    }))
  }

  // Mask password for display
  const maskPassword = (password: string | undefined, deviceId: string) => {
    if (!password) return "-"
    return showPasswords[deviceId] ? password : "•".repeat(Math.min(password.length, 8))
  }

  // Get unique agents for filter
  const uniqueAgents = Array.from(new Set(devices.map((device) => device.agent))).sort()

  // Available columns for export
  const availableColumns = [
    { id: "agent", label: "Agent" },
    { id: "imei", label: "IMEI" },
    { id: "model", label: "Model" },
    { id: "color", label: "Color" },
    { id: "appleIdUsername", label: "Apple ID Username" },
    { id: "password", label: "Password" },
    { id: "dateChecked", label: "Date Checked" },
    { id: "remarks", label: "Remarks" },
  ]

  // Filter devices for export
  const getFilteredDevicesForExport = () => {
    const filtered = devices.filter((device) => {
      // Apply search filter
      if (searchTerm.trim() !== "") {
        const term = searchTerm.toLowerCase()
        const matchesSearch =
          device.agent.toLowerCase().includes(term) ||
          device.imei.toLowerCase().includes(term) ||
          device.model.toLowerCase().includes(term) ||
          device.color.toLowerCase().includes(term) ||
          (device.appleIdUsername && device.appleIdUsername.toLowerCase().includes(term)) ||
          (device.remarks && device.remarks.toLowerCase().includes(term))
        if (!matchesSearch) return false
      }

      // Apply agent filter
      if (exportAgent !== "all" && device.agent !== exportAgent) {
        return false
      }

      // Apply date filter
      if (exportDateRange !== "all" && device.dateChecked) {
        const deviceDate = new Date(device.dateChecked)

        if (exportDateRange === "month") {
          const currentDate = new Date()
          const currentMonth = currentDate.getMonth()
          const currentYear = currentDate.getFullYear()
          const deviceMonth = deviceDate.getMonth()
          const deviceYear = deviceDate.getFullYear()

          if (deviceMonth !== currentMonth || deviceYear !== currentYear) {
            return false
          }
        } else if (exportDateRange === "custom") {
          if (exportStartDate && deviceDate < exportStartDate) return false
          if (exportEndDate && deviceDate > exportEndDate) return false
        }
      }

      return true
    })

    return filtered
  }

  // Generate CSV content
  const generateCSV = () => {
    const filteredDevices = getFilteredDevicesForExport()

    if (filteredDevices.length === 0) {
      toast({
        variant: "destructive",
        title: "No Data",
        description: "No devices match the selected filters",
      })
      return ""
    }

    // Create headers based on selected columns
    const headers = exportColumns.map((columnId) => {
      const column = availableColumns.find((col) => col.id === columnId)
      return column ? column.label : columnId
    })

    // Create rows
    const rows = filteredDevices.map((device) => {
      return exportColumns.map((columnId) => {
        let value = ""
        switch (columnId) {
          case "agent":
            value = device.agent
            break
          case "imei":
            value = device.imei
            break
          case "model":
            value = device.model
            break
          case "color":
            value = device.color
            break
          case "appleIdUsername":
            value = device.appleIdUsername || ""
            break
          case "password":
            value = device.password || ""
            break
          case "dateChecked":
            value = device.dateChecked ? formatDate(device.dateChecked) : ""
            break
          case "remarks":
            value = device.remarks || ""
            break
          default:
            value = ""
        }
        return `"${value.toString().replace(/"/g, '""')}"`
      })
    })

    return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
  }

  // Export to CSV
  const exportToCSV = () => {
    const csvContent = generateCSV()
    if (!csvContent) return

    // Generate filename
    let filename = "device-inventory"
    if (exportAgent !== "all") {
      filename += `-${exportAgent.replace(/\s+/g, "-")}`
    }
    if (exportDateRange === "month") {
      const currentDate = new Date()
      filename += `-${format(currentDate, "MMM-yyyy")}`
    } else if (exportDateRange === "custom" && exportStartDate && exportEndDate) {
      filename += `-${format(exportStartDate, "yyyy-MM-dd")}-to-${format(exportEndDate, "yyyy-MM-dd")}`
    }
    filename += ".csv"

    // Download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)

    const filteredCount = getFilteredDevicesForExport().length
    toast({
      title: "Export Successful",
      description: `Exported ${filteredCount} devices to ${filename}`,
    })

    setShowExportModal(false)
  }

  // Toggle column selection
  const toggleColumn = (columnId: string) => {
    setExportColumns((prev) => (prev.includes(columnId) ? prev.filter((id) => id !== columnId) : [...prev, columnId]))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search for anything (IMEI, model, agent, etc.)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setShowExportModal(true)} className="bg-green-600 hover:bg-green-700 text-white">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-350px)] rounded-md border">
        <Table>
          <TableHeader className="sticky top-0 bg-background">
            <TableRow>
              <TableHead>Agent</TableHead>
              <TableHead>IMEI</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Apple ID</TableHead>
              <TableHead>Password</TableHead>
              <TableHead>Last Checked</TableHead>
              <TableHead>Remarks</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {devices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  No devices found. Add a new device to get started.
                </TableCell>
              </TableRow>
            ) : (
              devices.map((device) => (
                <TableRow key={device.id}>
                  <TableCell className="font-medium">{device.agent}</TableCell>
                  <TableCell>{device.imei}</TableCell>
                  <TableCell>{device.model}</TableCell>
                  <TableCell>{device.color}</TableCell>
                  <TableCell>{device.appleIdUsername || "-"}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span>{maskPassword(device.password, device.id || "")}</span>
                      {device.password && isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => togglePasswordVisibility(device.id || "")}
                        >
                          {showPasswords[device.id || ""] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(device.dateChecked)}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{device.remarks || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => setDeviceToEdit(device)} className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeviceToDelete(device.id || "")}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ScrollArea>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deviceToDelete} onOpenChange={(open) => !open && setDeviceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the device from the inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deviceToDelete) {
                  await onDelete(deviceToDelete)
                  setDeviceToDelete(null)
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Device Modal */}
      {deviceToEdit && (
        <DeviceEditModal
          device={deviceToEdit}
          onClose={() => setDeviceToEdit(null)}
          onUpdate={async (updatedDevice) => {
            if (deviceToEdit.id) {
              const success = await onUpdate(deviceToEdit.id, updatedDevice)
              if (success) setDeviceToEdit(null)
              return success
            }
            return false
          }}
        />
      )}

      {/* Export Options Modal */}
      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Export Device Inventory</DialogTitle>
            <DialogDescription>Choose your export options and filters</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Date Range Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Date Range</Label>
              <Select
                value={exportDateRange}
                onValueChange={(value: "all" | "month" | "custom") => setExportDateRange(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="month">Current Month</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>

              {exportDateRange === "custom" && (
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !exportStartDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {exportStartDate ? format(exportStartDate, "PPP") : "Pick start date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={exportStartDate} onSelect={setExportStartDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !exportEndDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {exportEndDate ? format(exportEndDate, "PPP") : "Pick end date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={exportEndDate} onSelect={setExportEndDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}
            </div>

            {/* Agent Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Agent Filter</Label>
              <Select value={exportAgent} onValueChange={setExportAgent}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agents</SelectItem>
                  {uniqueAgents.map((agent) => (
                    <SelectItem key={agent} value={agent}>
                      {agent}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Column Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Columns to Export</Label>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExportColumns(availableColumns.map((col) => col.id))}
                  >
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setExportColumns([])}>
                    Clear All
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {availableColumns.map((column) => (
                  <div key={column.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={column.id}
                      checked={exportColumns.includes(column.id)}
                      onCheckedChange={() => toggleColumn(column.id)}
                    />
                    <Label htmlFor={column.id} className="text-sm cursor-pointer">
                      {column.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Export Summary */}
            <div className="bg-muted/50 p-3 rounded-md">
              <p className="text-sm text-muted-foreground">
                Export will include <strong>{getFilteredDevicesForExport().length}</strong> devices
                {exportColumns.length > 0 && (
                  <span>
                    {" "}
                    with <strong>{exportColumns.length}</strong> columns
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowExportModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={exportToCSV}
              disabled={exportColumns.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
