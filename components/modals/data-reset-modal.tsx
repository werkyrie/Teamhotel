"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import { AlertTriangle } from "lucide-react"

type DataResetModalProps = {
  isOpen: boolean
  onClose: () => void
  onReset: (date: Date, options: { today: boolean; monthly: boolean; open: boolean }) => void
}

export default function DataResetModal({ isOpen, onClose, onReset }: DataResetModalProps) {
  const [date, setDate] = useState<Date>(new Date())
  const [resetToday, setResetToday] = useState(false)
  const [resetMonthly, setResetMonthly] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const handleReset = () => {
    if (!resetToday && !resetMonthly && !resetOpen) {
      return // No options selected
    }

    onReset(date, {
      today: resetToday,
      monthly: resetMonthly,
      open: resetOpen,
    })

    // Reset form
    setResetToday(false)
    setResetMonthly(false)
    setResetOpen(false)
    setConfirmed(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reset Data</DialogTitle>
          <DialogDescription>Select which data you want to reset. This action cannot be undone.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Select Date</Label>
            <div className="border rounded-md p-1">
              <Calendar mode="single" selected={date} onSelect={(date) => date && setDate(date)} className="mx-auto" />
            </div>
            <p className="text-sm text-muted-foreground">Data will be reset for: {format(date, "MMMM d, yyyy")}</p>
          </div>

          <div className="space-y-4">
            <Label>Reset Options</Label>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="reset-today"
                checked={resetToday}
                onCheckedChange={(checked) => setResetToday(checked === true)}
              />
              <Label htmlFor="reset-today" className="cursor-pointer">
                Added Today
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="reset-monthly"
                checked={resetMonthly}
                onCheckedChange={(checked) => setResetMonthly(checked === true)}
              />
              <Label htmlFor="reset-monthly" className="cursor-pointer">
                Monthly Added
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="reset-open"
                checked={resetOpen}
                onCheckedChange={(checked) => setResetOpen(checked === true)}
              />
              <Label htmlFor="reset-open" className="cursor-pointer">
                Open Accounts
              </Label>
            </div>
          </div>

          <div className="rounded-md bg-amber-50 dark:bg-amber-950 p-3 border border-amber-200 dark:border-amber-800">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-2 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-300">
                <p className="font-medium">Warning</p>
                <p>This action will permanently delete the selected data and cannot be reversed.</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="confirm-reset"
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked === true)}
            />
            <Label htmlFor="confirm-reset" className="cursor-pointer text-sm font-medium">
              I understand this action cannot be undone
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleReset}
            disabled={(!resetToday && !resetMonthly && !resetOpen) || !confirmed}
          >
            Reset Data
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
