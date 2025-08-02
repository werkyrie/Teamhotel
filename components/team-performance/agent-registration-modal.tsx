"use client"

import { useState } from "react"
import { useTeamContext } from "@/context/team-context"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertCircle, Loader2 } from "lucide-react"
import type { Agent } from "@/types/team"

interface AgentRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AgentRegistrationModal({ isOpen, onClose }: AgentRegistrationModalProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const { addAgent } = useTeamContext()

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "Regular" as Agent["role"],
    status: "Active" as Agent["status"],
    addedToday: 0,
    monthlyAdded: 0,
    openAccounts: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
  })

  const [errors, setErrors] = useState({
    name: "",
    email: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Validation functions
  const validateName = (name: string) => {
    if (!name.trim()) {
      setErrors((prev) => ({ ...prev, name: "Agent name is required" }))
      return false
    }
    setErrors((prev) => ({ ...prev, name: "" }))
    return true
  }

  const validateEmail = (email: string) => {
    if (!email.trim()) {
      setErrors((prev) => ({ ...prev, email: "Email is required" }))
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setErrors((prev) => ({ ...prev, email: "Please enter a valid email address" }))
      return false
    }

    setErrors((prev) => ({ ...prev, email: "" }))
    return true
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Clear errors when user starts typing
    if (field === "name") validateName(value as string)
    if (field === "email") validateEmail(value as string)
  }

  const handleSubmit = async () => {
    // Validate all fields
    const isNameValid = validateName(formData.name)
    const isEmailValid = validateEmail(formData.email)

    if (!isNameValid || !isEmailValid) {
      return
    }

    setIsSubmitting(true)

    try {
      const newAgent: Omit<Agent, "id" | "commission" | "commissionRate"> = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
        status: formData.status,
        addedToday: formData.addedToday,
        monthlyAdded: formData.monthlyAdded,
        openAccounts: formData.openAccounts,
        totalDeposits: formData.totalDeposits,
        totalWithdrawals: formData.totalWithdrawals,
        createdBy: user?.email || "system",
        createdAt: new Date().toISOString(),
      }

      await addAgent(newAgent)

      toast({
        title: "Agent registered successfully",
        description: `${formData.name} has been added to the team.`,
        variant: "success",
      })

      // Reset form
      setFormData({
        name: "",
        email: "",
        role: "Regular",
        status: "Active",
        addedToday: 0,
        monthlyAdded: 0,
        openAccounts: 0,
        totalDeposits: 0,
        totalWithdrawals: 0,
      })

      onClose()
    } catch (error) {
      console.error("Error registering agent:", error)

      let errorMessage = "There was an error registering the agent. Please try again."

      if (error instanceof Error) {
        if (error.message.includes("already exists")) {
          errorMessage = error.message
        }
      }

      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      // Reset form when closing
      setFormData({
        name: "",
        email: "",
        role: "Regular",
        status: "Active",
        addedToday: 0,
        monthlyAdded: 0,
        openAccounts: 0,
        totalDeposits: 0,
        totalWithdrawals: 0,
      })
      setErrors({ name: "", email: "" })
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Register New Agent</DialogTitle>
          <DialogDescription>Add a new agent to your team with their basic information.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Agent Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter agent's full name"
              className={errors.name ? "border-red-500" : ""}
              disabled={isSubmitting}
            />
            {errors.name && (
              <div className="text-sm text-red-500 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {errors.name}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="Enter agent's email"
              className={errors.email ? "border-red-500" : ""}
              disabled={isSubmitting}
            />
            {errors.email && (
              <div className="text-sm text-red-500 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {errors.email}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value: Agent["role"]) => handleInputChange("role", value)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Regular">Regular</SelectItem>
                  <SelectItem value="Elite">Elite</SelectItem>
                  <SelectItem value="Team Leader">Team Leader</SelectItem>
                  <SelectItem value="Spammer">Spammer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: Agent["status"]) => handleInputChange("status", value)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="addedToday">Added Today</Label>
              <Input
                id="addedToday"
                type="number"
                min="0"
                value={formData.addedToday}
                onChange={(e) => handleInputChange("addedToday", Number.parseInt(e.target.value) || 0)}
                placeholder="0"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthlyAdded">Monthly Added</Label>
              <Input
                id="monthlyAdded"
                type="number"
                min="0"
                value={formData.monthlyAdded}
                onChange={(e) => handleInputChange("monthlyAdded", Number.parseInt(e.target.value) || 0)}
                placeholder="0"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="openAccounts">Open Accounts</Label>
              <Input
                id="openAccounts"
                type="number"
                min="0"
                value={formData.openAccounts}
                onChange={(e) => handleInputChange("openAccounts", Number.parseInt(e.target.value) || 0)}
                placeholder="0"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalDeposits">Total Deposits ($)</Label>
              <Input
                id="totalDeposits"
                type="number"
                min="0"
                step="0.01"
                value={formData.totalDeposits}
                onChange={(e) => handleInputChange("totalDeposits", Number.parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalWithdrawals">Total Withdrawals ($)</Label>
            <Input
              id="totalWithdrawals"
              type="number"
              min="0"
              step="0.01"
              value={formData.totalWithdrawals}
              onChange={(e) => handleInputChange("totalWithdrawals", Number.parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registering...
              </>
            ) : (
              "Register Agent"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
