"use client"

import type React from "react"

import { useState } from "react"
import type { DeviceInventory } from "@/types/inventory"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, EyeOff, Save } from "lucide-react"

interface DeviceEditModalProps {
  device: DeviceInventory
  onClose: () => void
  onUpdate: (device: Partial<DeviceInventory>) => Promise<boolean>
}

export function DeviceEditModal({ device, onClose, onUpdate }: DeviceEditModalProps) {
  const [formData, setFormData] = useState<DeviceInventory>({ ...device })
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id.replace("edit", "")]: value }))
  }

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await onUpdate(formData)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Device</DialogTitle>
          <DialogDescription>Make changes to the device information below.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="editAgent">Agent Name</Label>
              <Input
                id="editAgent"
                value={formData.agent}
                onChange={handleChange}
                required
                placeholder="Enter agent name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editImei">IMEI Number</Label>
              <Input
                id="editImei"
                value={formData.imei}
                onChange={handleChange}
                required
                placeholder="Enter device IMEI"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editModel">Device Model</Label>
              <Select value={formData.model} onValueChange={(value) => handleSelectChange("model", value)} required>
                <SelectTrigger id="editModel">
                  <SelectValue placeholder="Select device model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="iPhone 8">iPhone 8</SelectItem>
                  <SelectItem value="iPhone 9">iPhone 9</SelectItem>
                  <SelectItem value="iPhone 10">iPhone 10</SelectItem>
                  <SelectItem value="iPhone 11">iPhone 11</SelectItem>
                  <SelectItem value="iPhone 12">iPhone 12</SelectItem>
                  <SelectItem value="iPhone 13">iPhone 13</SelectItem>
                  <SelectItem value="iPhone 14">iPhone 14</SelectItem>
                  <SelectItem value="iPhone 15">iPhone 15</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editColor">Color</Label>
              <Input
                id="editColor"
                value={formData.color}
                onChange={handleChange}
                required
                placeholder="Enter device color"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editAppleIdUsername">Apple ID Username</Label>
              <Input
                id="editAppleIdUsername"
                value={formData.appleIdUsername || ""}
                onChange={handleChange}
                placeholder="Enter Apple ID username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editPassword">Password</Label>
              <div className="relative">
                <Input
                  id="editPassword"
                  type={showPassword ? "text" : "password"}
                  value={formData.password || ""}
                  onChange={handleChange}
                  placeholder="Enter password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editDateChecked">Last Date Checked</Label>
              <Input id="editDateChecked" type="date" value={formData.dateChecked} onChange={handleChange} required />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="editRemarks">Remarks</Label>
              <Textarea
                id="editRemarks"
                value={formData.remarks || ""}
                onChange={handleChange}
                placeholder="Additional notes or remarks"
                className="min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                "Saving..."
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
