"use client"

import type React from "react"

import { useState } from "react"
import { useTeamContext } from "@/context/team-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertCircle } from "lucide-react"

interface AgentRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AgentRegistrationModal({ isOpen, onClose }: AgentRegistrationModalProps) {
  const { addAgent } = useTeamContext()
  const { toast } = useToast()

  // Add totalWithdrawals to the form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    position: "",
    addedToday: 0,
    monthlyAdded: 0,
    openAccounts: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    status: "Active" as "Active" | "Inactive",
  })

  const [nameError, setNameError] = useState("")
  const [emailError, setEmailError] = useState("")

  const validateName = (value: string) => {
    if (!value.trim()) {
      setNameError("Agent name is required")
      return false
    }
    setNameError("")
    return true
  }

  const validateEmail = (value: string) => {
    if (!value.trim()) {
      setEmailError("Email is required")
      return false
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      setEmailError("Please enter a valid email address")
      return false
    }
    setEmailError("")
    return true
  }

  const handleSubmit = () => {
    const isNameValid = validateName(formData.name)
    const isEmailValid = validateEmail(formData.email)

    if (!isNameValid || !isEmailValid) {
      return
    }

    addAgent({
      name: formData.name,
      email: formData.email,
      addedToday: formData.addedToday,
      monthlyAdded: formData.monthlyAdded,
      openAccounts: formData.openAccounts,
      totalDeposits: formData.totalDeposits,
      totalWithdrawals: formData.totalWithdrawals,
    })

    toast({
      title: "Agent Added",
      description: `${formData.name} has been added successfully`,
    })

    onClose()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prevState) => ({
      ...prevState,
      [name]: name === "totalDeposits" || name === "totalWithdrawals" ? Number(value) : value,
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Agent</DialogTitle>
          <DialogDescription>Enter the agent details to add them to the system</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Agent Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value })
                validateName(e.target.value)
              }}
              placeholder="Enter agent name"
              className={nameError ? "border-red-500" : ""}
            />
            {nameError && (
              <div className="text-sm text-red-500 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {nameError}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value })
                validateEmail(e.target.value)
              }}
              placeholder="Enter agent email"
              className={emailError ? "border-red-500" : ""}
            />
            {emailError && (
              <div className="text-sm text-red-500 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {emailError}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="addedToday">Added Today</Label>
              <Input
                id="addedToday"
                name="addedToday"
                type="number"
                min="0"
                value={formData.addedToday}
                onChange={handleInputChange}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthlyAdded">Monthly Added</Label>
              <Input
                id="monthlyAdded"
                name="monthlyAdded"
                type="number"
                min="0"
                value={formData.monthlyAdded}
                onChange={handleInputChange}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="openAccounts">Open Accounts</Label>
              <Input
                id="openAccounts"
                name="openAccounts"
                type="number"
                min="0"
                value={formData.openAccounts}
                onChange={handleInputChange}
                placeholder="0"
              />
            </div>

            {/* Other form fields... */}

            <div className="space-y-2">
              <Label htmlFor="totalDeposits">Total Deposits ($)</Label>
              <Input
                id="totalDeposits"
                name="totalDeposits"
                type="number"
                min="0"
                value={formData.totalDeposits}
                onChange={handleInputChange}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalWithdrawals">Total Withdrawals ($)</Label>
              <Input
                id="totalWithdrawals"
                name="totalWithdrawals"
                type="number"
                min="0"
                value={formData.totalWithdrawals}
                onChange={handleInputChange}
                placeholder="0"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Add Agent</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
