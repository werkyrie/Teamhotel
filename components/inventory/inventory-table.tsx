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

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search for anything (IMEI, model, agent, etc.)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
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
                      {device.password && (
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
    </div>
  )
}
