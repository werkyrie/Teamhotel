"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Eye } from "lucide-react"
import { useClientContext } from "@/context/client-context"

interface ExportOptionsModalProps {
  isOpen: boolean
  onClose: () => void
  data: any[]
  type: "clients" | "orders" | "deposits" | "withdrawals"
}

export default function ExportOptionsModal({ isOpen, onClose, data, type }: ExportOptionsModalProps) {
  const { toast } = useToast()
  const { clients, orders, deposits, withdrawals } = useClientContext()
  const [selectedFields, setSelectedFields] = useState<string[]>([])
  const [previewData, setPreviewData] = useState<string>("")
  const [activeTab, setActiveTab] = useState<string>("options")
  const downloadLinkRef = useRef<HTMLAnchorElement>(null)
  const [fileName, setFileName] = useState(`${type}_export.csv`)

  // Define available fields based on type
  const getAvailableFields = () => {
    switch (type) {
      case "clients":
        return [
          { id: "shopId", label: "Shop ID" },
          { id: "clientName", label: "Client Name" },
          { id: "agent", label: "Agent" },
          { id: "kycDate", label: "KYC Date" },
          { id: "status", label: "Status" },
          { id: "notes", label: "Notes" },
          { id: "totalOrders", label: "Total Orders" },
          { id: "totalOrderAmount", label: "Total Order Amount" },
          { id: "totalDeposits", label: "Total Deposits" },
          { id: "totalDepositAmount", label: "Total Deposit Amount" },
          { id: "totalWithdrawals", label: "Total Withdrawals" },
          { id: "totalWithdrawalAmount", label: "Total Withdrawal Amount" },
        ]
      case "orders":
        return [
          { id: "orderId", label: "Order ID" },
          { id: "shopId", label: "Shop ID" },
          { id: "clientName", label: "Client Name" },
          { id: "agent", label: "Agent" },
          { id: "date", label: "Date" },
          { id: "location", label: "Location" },
          { id: "price", label: "Price" },
          { id: "status", label: "Status" },
        ]
      case "deposits":
        return [
          { id: "depositId", label: "Deposit ID" },
          { id: "shopId", label: "Shop ID" },
          { id: "clientName", label: "Client Name" },
          { id: "agent", label: "Agent" },
          { id: "date", label: "Date" },
          { id: "amount", label: "Amount" },
          { id: "paymentMode", label: "Payment Mode" },
        ]
      case "withdrawals":
        return [
          { id: "withdrawalId", label: "Withdrawal ID" },
          { id: "shopId", label: "Shop ID" },
          { id: "clientName", label: "Client Name" },
          { id: "agent", label: "Agent" },
          { id: "date", label: "Date" },
          { id: "amount", label: "Amount" },
          { id: "paymentMode", label: "Payment Mode" },
        ]
      default:
        return []
    }
  }

  const availableFields = getAvailableFields()

  // Initialize selected fields when modal opens
  useState(() => {
    setSelectedFields(availableFields.map((field) => field.id))
  })

  // Toggle field selection
  const toggleField = (fieldId: string) => {
    setSelectedFields((prev) => (prev.includes(fieldId) ? prev.filter((id) => id !== fieldId) : [...prev, fieldId]))
  }

  // Select all fields
  const selectAllFields = () => {
    setSelectedFields(availableFields.map((field) => field.id))
  }

  // Deselect all fields
  const deselectAllFields = () => {
    setSelectedFields([])
  }

  // Generate CSV data
  const generateCSV = () => {
    if (selectedFields.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select at least one field to export",
      })
      return ""
    }

    // Get field headers
    const headers = selectedFields.map((fieldId) => {
      const field = availableFields.find((f) => f.id === fieldId)
      return field ? field.label : fieldId
    })

    // Process data rows
    let rows: string[][] = []

    if (type === "clients") {
      rows = data.map((client: any) => {
        const clientOrders = orders.filter((order) => order.shopId === client.shopId)
        const clientDeposits = deposits.filter((deposit) => deposit.shopId === client.shopId)
        const clientWithdrawals = withdrawals.filter((withdrawal) => withdrawal.shopId === client.shopId)

        const totalOrders = clientOrders.length
        const totalOrderAmount = clientOrders.reduce((sum, order) => sum + order.price, 0)
        const totalDeposits = clientDeposits.length
        const totalDepositAmount = clientDeposits.reduce((sum, deposit) => sum + deposit.amount, 0)
        const totalWithdrawals = clientWithdrawals.length
        const totalWithdrawalAmount = clientWithdrawals.reduce((sum, withdrawal) => sum + withdrawal.amount, 0)

        return selectedFields.map((fieldId) => {
          switch (fieldId) {
            case "shopId":
              return client.shopId
            case "clientName":
              return client.clientName
            case "agent":
              return client.agent
            case "kycDate":
              return client.kycDate
            case "status":
              return client.status
            case "notes":
              return client.notes
            case "totalOrders":
              return totalOrders.toString()
            case "totalOrderAmount":
              return totalOrderAmount.toFixed(2)
            case "totalDeposits":
              return totalDeposits.toString()
            case "totalDepositAmount":
              return totalDepositAmount.toFixed(2)
            case "totalWithdrawals":
              return totalWithdrawals.toString()
            case "totalWithdrawalAmount":
              return totalWithdrawalAmount.toFixed(2)
            default:
              return ""
          }
        })
      })
    } else {
      rows = data.map((item: any) => {
        return selectedFields.map((fieldId) => {
          const value = item[fieldId]
          if (typeof value === "number") {
            return value.toFixed(2)
          }
          return value ? value.toString() : ""
        })
      })
    }

    // Combine headers and rows
    const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n")

    return csvContent
  }

  // Generate preview
  const generatePreview = () => {
    const csvContent = generateCSV()
    setPreviewData(csvContent)
    setActiveTab("preview")
  }

  // Download CSV
  const downloadCSV = () => {
    const csvContent = generateCSV()
    if (!csvContent) return

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)

    if (downloadLinkRef.current) {
      downloadLinkRef.current.href = url
      downloadLinkRef.current.download = fileName
      downloadLinkRef.current.click()
      URL.revokeObjectURL(url)
    }

    toast({
      variant: "success",
      title: "Export Successful",
      description: `${type} data has been exported to CSV`,
    })

    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] animate-fade-in">
        <DialogHeader>
          <DialogTitle className="text-xl">Export {type.charAt(0).toUpperCase() + type.slice(1)}</DialogTitle>
          <DialogDescription>Select the fields you want to include in the CSV export.</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="options">Export Options</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="options" className="space-y-4 py-4 animate-slide-in">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-2">
                <Label htmlFor="fileName">File Name:</Label>
                <input
                  id="fileName"
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="flex justify-between mb-4">
                <Button variant="outline" size="sm" onClick={selectAllFields}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAllFields}>
                  Deselect All
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2">
              {availableFields.map((field) => (
                <div
                  key={field.id}
                  className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    id={field.id}
                    checked={selectedFields.includes(field.id)}
                    onCheckedChange={() => toggleField(field.id)}
                  />
                  <Label htmlFor={field.id} className="cursor-pointer">
                    {field.label}
                  </Label>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={generatePreview}>
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
              <Button onClick={downloadCSV} className="btn-primary">
                <Download className="mr-2 h-4 w-4" />
                Download CSV
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4 py-4 animate-slide-in">
            {previewData ? (
              <div className="border rounded-md p-4 bg-muted/50 overflow-auto max-h-[300px]">
                <pre className="text-xs font-mono whitespace-pre-wrap">{previewData}</pre>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">Generate a preview to see the CSV data</div>
            )}

            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={() => setActiveTab("options")}>
                Back to Options
              </Button>
              <Button onClick={downloadCSV} className="btn-primary">
                <Download className="mr-2 h-4 w-4" />
                Download CSV
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Hidden download link */}
        <a ref={downloadLinkRef} style={{ display: "none" }} />
      </DialogContent>
    </Dialog>
  )
}
