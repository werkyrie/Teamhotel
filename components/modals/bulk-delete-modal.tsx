"use client"

import { useState } from "react"
import { useClientContext } from "@/context/client-context"
import { useAuth } from "@/context/auth-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { AlertTriangle } from "lucide-react"

interface BulkDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  selectedClients: string[]
}

export default function BulkDeleteModal({ isOpen, onClose, selectedClients }: BulkDeleteModalProps) {
  const { bulkDeleteClients } = useClientContext()
  const { isAdmin } = useAuth()
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!isAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only administrators can delete clients in bulk.",
        variant: "destructive",
      })
      onClose()
      return
    }

    if (selectedClients.length === 0) return

    setIsDeleting(true)
    try {
      await bulkDeleteClients(selectedClients)
      toast({
        title: "Clients Deleted",
        description: `Successfully deleted ${selectedClients.length} clients.`,
        variant: "default",
      })
      onClose()
    } catch (error) {
      console.error("Error deleting clients:", error)
      toast({
        title: "Error",
        description: "There was an error deleting the clients. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center text-red-600">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Delete {selectedClients.length} Clients
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the selected clients and all associated data.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p>
            Are you sure you want to delete {selectedClients.length} client{selectedClients.length !== 1 ? "s" : ""}?
          </p>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting || !isAdmin}>
              {isDeleting ? "Deleting..." : "Delete Clients"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
