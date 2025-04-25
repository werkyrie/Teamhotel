"use client"

import { useState, useEffect } from "react"
import { useClientContext } from "@/context/client-context"
import type { Deposit, PaymentMode } from "@/types/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"

interface DepositModalProps {
  mode: "add" | "edit"
  deposit: Deposit | null
  isOpen: boolean
  onClose: () => void
}

export default function DepositModal({ mode, deposit, isOpen, onClose }: DepositModalProps) {
  const { clients, addDeposit, updateDeposit, generateDepositId } = useClientContext()
  const { toast } = useToast()

  // Form state
  const [depositId, setDepositId] = useState("")
  const [shopId, setShopId] = useState("")
  const [clientName, setClientName] = useState("")
  const [agent, setAgent] = useState("")
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [amount, setAmount] = useState(0)
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("Crypto")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize form with deposit data if in edit mode
  useEffect(() => {
    const initializeForm = async () => {
      if (mode === "edit" && deposit) {
        setDepositId(deposit.depositId)
        setShopId(deposit.shopId)
        setClientName(deposit.clientName)
        setAgent(deposit.agent)
        setDate(typeof deposit.date === "string" ? deposit.date : format(new Date(deposit.date), "yyyy-MM-dd"))
        setAmount(deposit.amount)
        setPaymentMode(deposit.paymentMode)
      } else {
        // Reset form for add mode
        const newId = await generateDepositId()
        setDepositId(newId)
        setShopId("")
        setClientName("")
        setAgent("")
        setDate(format(new Date(), "yyyy-MM-dd"))
        setAmount(0)
        setPaymentMode("Crypto")
      }
    }

    initializeForm()
  }, [mode, deposit, generateDepositId])

  // Update client name and agent when shop ID changes
  useEffect(() => {
    if (shopId) {
      const selectedClient = clients.find((client) => client.shopId === shopId)
      if (selectedClient) {
        setClientName(selectedClient.clientName)
        setAgent(selectedClient.agent)
      } else {
        setClientName("")
        setAgent("")
      }
    }
  }, [shopId, clients])

  // Handle form submission
  const handleSubmit = async () => {
    if (!shopId || amount <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid Shop ID and amount greater than 0",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const depositData: Deposit = {
        depositId,
        shopId,
        clientName,
        agent,
        date,
        amount,
        paymentMode,
      }

      if (mode === "add") {
        await addDeposit(depositData)
        toast({
          title: "Success",
          description: "Deposit added successfully",
          variant: "default",
        })
      } else if (mode === "edit" && deposit) {
        await updateDeposit(depositData)
        toast({
          title: "Success",
          description: "Deposit updated successfully",
          variant: "default",
        })
      }

      onClose()
    } catch (error) {
      console.error("Error submitting deposit:", error)
      toast({
        title: "Error",
        description: "Failed to save deposit. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Add New Deposit" : "Edit Deposit"}</DialogTitle>
          <DialogDescription>
            {mode === "add" ? "Fill in the details to add a new deposit" : "Update deposit information"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {mode === "edit" && (
            <div className="space-y-2">
              <Label htmlFor="depositId">Deposit ID</Label>
              <Input id="depositId" value={depositId} readOnly />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="shopId">Shop ID</Label>
            <Input
              id="shopId"
              value={shopId}
              onChange={(e) => setShopId(e.target.value)}
              placeholder="Enter Shop ID"
              disabled={mode === "edit"}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name</Label>
              <Input id="clientName" value={clientName} readOnly />
            </div>

            <div className="space-y-2">
              <Label htmlFor="agent">Agent</Label>
              <Input id="agent" value={agent} readOnly />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={format(new Date(), "yyyy-MM-dd")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(Number.parseFloat(e.target.value))}
              placeholder="Enter amount"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMode">Payment Mode</Label>
            <Select value={paymentMode} onValueChange={(value) => setPaymentMode(value as PaymentMode)}>
              <SelectTrigger id="paymentMode">
                <SelectValue placeholder="Select payment mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Crypto">Crypto</SelectItem>
                <SelectItem value="Online Banking">Online Banking</SelectItem>
                <SelectItem value="Ewallet">Ewallet</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : mode === "add" ? "Add Deposit" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
