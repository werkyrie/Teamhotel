"use client"

import { useState, useEffect } from "react"
import { useClientContext } from "@/context/client-context"
import type { Withdrawal, PaymentMode } from "@/types/client"
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

interface WithdrawalModalProps {
  mode: "add" | "edit"
  withdrawal: Withdrawal | null
  isOpen: boolean
  onClose: () => void
}

export default function WithdrawalModal({ mode, withdrawal, isOpen, onClose }: WithdrawalModalProps) {
  const { clients, addWithdrawal, updateWithdrawal, generateWithdrawalId } = useClientContext()
  const { toast } = useToast()

  // Form state
  const [withdrawalId, setWithdrawalId] = useState("")
  const [shopId, setShopId] = useState("")
  const [clientName, setClientName] = useState("")
  const [agent, setAgent] = useState("")
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [amount, setAmount] = useState(0)
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("Crypto")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize form with withdrawal data if in edit mode
  useEffect(() => {
    const initializeForm = async () => {
      if (mode === "edit" && withdrawal) {
        setWithdrawalId(withdrawal.withdrawalId)
        setShopId(withdrawal.shopId)
        setClientName(withdrawal.clientName)
        setAgent(withdrawal.agent)
        setDate(typeof withdrawal.date === "string" ? withdrawal.date : format(new Date(withdrawal.date), "yyyy-MM-dd"))
        setAmount(withdrawal.amount)
        setPaymentMode(withdrawal.paymentMode)
      } else {
        // Reset form for add mode
        try {
          const newWithdrawalId = await generateWithdrawalId()
          setWithdrawalId(newWithdrawalId)
        } catch (error) {
          console.error("Error generating withdrawal ID:", error)
          setWithdrawalId(`WD${Date.now().toString()}`)
        }
        setShopId("")
        setClientName("")
        setAgent("")
        setDate(format(new Date(), "yyyy-MM-dd"))
        setAmount(0)
        setPaymentMode("Crypto")
      }
    }

    initializeForm()
  }, [mode, withdrawal, generateWithdrawalId])

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
      const withdrawalData: Withdrawal = {
        withdrawalId,
        shopId,
        clientName,
        agent,
        date,
        amount,
        paymentMode,
      }

      if (mode === "add") {
        await addWithdrawal(withdrawalData)
        toast({
          title: "Withdrawal Added",
          description: `Withdrawal ${withdrawalId} has been added successfully.`,
          variant: "success",
        })
      } else if (mode === "edit" && withdrawal) {
        await updateWithdrawal(withdrawalData)
        toast({
          title: "Withdrawal Updated",
          description: `Withdrawal ${withdrawalId} has been updated successfully.`,
          variant: "success",
        })
      }

      onClose()
    } catch (error) {
      console.error("Error submitting withdrawal:", error)
      toast({
        title: "Error",
        description: "There was an error processing your request. Please try again.",
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
          <DialogTitle>{mode === "add" ? "Add New Withdrawal" : "Edit Withdrawal"}</DialogTitle>
          <DialogDescription>
            {mode === "add" ? "Fill in the details to add a new withdrawal" : "Update withdrawal information"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {mode === "edit" && (
            <div className="space-y-2">
              <Label htmlFor="withdrawalId">Withdrawal ID</Label>
              <Input id="withdrawalId" value={withdrawalId} readOnly />
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
            {isSubmitting ? "Processing..." : mode === "add" ? "Add Withdrawal" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
