"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useClientContext } from "@/context/client-context"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, FileUp, Upload, X } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface BulkOrderModalProps {
  isOpen: boolean
  onClose: () => void
}

// Define OrderStatus type
type OrderStatus = "pending" | "processing" | "completed"

// Define Order type
interface Order {
  orderId: string
  shopId: string
  clientName: string
  agent: string
  date: Date
  location: string
  price: number
  status: OrderStatus
}

// Helper function to parse dates in various formats
const parseDate = (dateString: string): Date => {
  const date = new Date(dateString)

  if (!isNaN(date.getTime())) {
    return date
  }

  // Try MM/DD/YYYY
  const mmddyyyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
  let match = dateString.match(mmddyyyy)
  if (match) {
    const [_, month, day, year] = match
    return new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`)
  }

  // Try DD/MM/YYYY
  const ddmmyyyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
  match = dateString.match(ddmmyyyy)
  if (match) {
    const [_, day, month, year] = match
    return new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`)
  }

  throw new Error(`Could not parse date: ${dateString}`)
}

export default function BulkOrderModal({ isOpen, onClose }: BulkOrderModalProps) {
  const { clients, addOrder, generateOrderId } = useClientContext()
  const { toast } = useToast()
  const [csvData, setCsvData] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [successCount, setSuccessCount] = useState(0)
  const [errorCount, setErrorCount] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showErrors, setShowErrors] = useState(false)
  const [errorMessages, setErrorMessages] = useState<string[]>([])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setCsvData(text || "")
    }
    reader.readAsText(file)
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setCsvData("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleImport = async () => {
    setIsProcessing(true)
    setError("")
    setSuccess(false)
    setErrorMessages([])
    setShowErrors(false)

    try {
      if (!csvData.trim()) {
        setError("No data provided. Please upload a CSV file or paste CSV data.")
        setIsProcessing(false)
        return
      }

      // Parse the CSV data
      const lines = csvData.trim().split("\n")
      if (lines.length < 2) {
        setError("CSV must contain at least a header row and one data row.")
        setIsProcessing(false)
        return
      }

      // Parse headers (case-insensitive)
      const headers = lines[0].split(",").map((header) => header.trim().toLowerCase())

      // Check if required headers are present
      const requiredHeaders = ["shop id", "date", "location", "price", "status"]
      const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header.toLowerCase()))

      if (missingHeaders.length > 0) {
        setError(`Missing required headers: ${missingHeaders.join(", ")}`)
        setIsProcessing(false)
        return
      }

      // Process each row
      let successCount = 0
      let errorCount = 0
      const errors: string[] = []

      // Find index of each required field
      const shopIdIndex = headers.indexOf("shop id")
      const dateIndex = headers.indexOf("date")
      const locationIndex = headers.indexOf("location")
      const priceIndex = headers.indexOf("price")
      const statusIndex = headers.indexOf("status")

      // Process each data row
      for (let i = 1; i < lines.length; i++) {
        try {
          // Skip empty lines
          if (!lines[i].trim()) continue

          const values = lines[i].split(",").map((value) => value.trim())

          // Check if we have enough values
          if (values.length < headers.length) {
            throw new Error(`Row has fewer values than headers`)
          }

          // Extract and validate shop ID
          const shopId = values[shopIdIndex]

          // Find the client by shopId (not id)
          const shop = clients.find((c) => c.shopId === shopId)

          // Extract and validate date
          let orderDate: Date
          try {
            orderDate = parseDate(values[dateIndex])
          } catch (error) {
            throw new Error(`Invalid date format: ${values[dateIndex]}`)
          }

          // Extract and validate location
          const location = values[locationIndex]
          if (!location) {
            throw new Error("Location is required")
          }

          // Extract and validate price
          const price = Number.parseFloat(values[priceIndex])
          if (isNaN(price) || price <= 0) {
            throw new Error(`Invalid price: ${values[priceIndex]}`)
          }

          // Extract and validate status
          const rawStatus = values[statusIndex].toLowerCase()
          let status: OrderStatus

          if (rawStatus === "pending") {
            status = "pending"
          } else if (rawStatus === "processing") {
            status = "processing"
          } else if (rawStatus === "completed") {
            status = "completed"
          } else {
            throw new Error(`Invalid status: ${values[statusIndex]}. Must be pending, processing, or completed.`)
          }

          // Create the order object
          const newOrder: Order = {
            orderId: generateOrderId(),
            shopId,
            clientName: shop ? shop.clientName : "Unknown Client",
            agent: shop ? shop.agent : "Unknown Agent",
            date: orderDate,
            location,
            price,
            status,
          }

          // Add the order
          addOrder(newOrder)
          successCount++

          // Update progress
          setProgress(Math.round((i / (lines.length - 1)) * 100))
        } catch (error: any) {
          errorCount++
          errors.push(`Row ${i}: ${error.message}`)
        }
      }

      // Show results
      if (successCount > 0) {
        setSuccess(true)
        setSuccessCount(successCount)

        toast({
          title: "Success",
          description: `Successfully imported ${successCount} orders`,
        })
      }

      if (errorCount > 0) {
        setErrorCount(errorCount)
        setErrorMessages(errors)
        setShowErrors(true)

        if (successCount === 0) {
          toast({
            title: "Error",
            description: `Failed to import any orders. ${errorCount} errors found.`,
            variant: "destructive",
          })
        } else {
          toast({
            title: "Partial Success",
            description: `Imported ${successCount} orders with ${errorCount} errors.`,
            variant: "default",
          })
        }
      }
    } catch (error: any) {
      setError(`Failed to process CSV: ${error.message}`)
      toast({
        title: "Error",
        description: `Failed to process CSV: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClickUpload = () => {
    fileInputRef.current?.click()
  }

  const [open, setOpen] = useState(false)

  const handleImportClick = () => {
    handleImport()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] animate-fade-in max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Bulk Add Orders</DialogTitle>
          <DialogDescription>Upload a CSV file or paste CSV data to add multiple orders at once.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {selectedFile ? (
            <div className="flex items-center justify-between p-4 border rounded-md bg-muted/30">
              <div className="flex items-center">
                <div className="p-2 bg-primary/10 rounded-md mr-3">
                  <FileUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleRemoveFile} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="file-upload-area flex items-center justify-center" onClick={handleClickUpload}>
              <div className="text-center">
                <FileUp className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium mb-1">Click to upload a CSV file</p>
                <p className="text-xs text-muted-foreground">or drag and drop</p>
                <Input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="csvData">Or paste CSV data</Label>
            <Textarea
              id="csvData"
              placeholder="shop id,date,location,price,status"
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              className="h-[200px] font-mono text-sm form-input"
            />
          </div>

          <div className="mb-4 p-4 bg-muted rounded-md">
            <h3 className="font-medium mb-2">CSV Import Instructions:</h3>
            <p className="text-sm mb-2">Your CSV file must have the following headers in the first row:</p>
            <code className="block bg-background p-2 rounded text-xs mb-2">shop id,date,location,price,status</code>

            <p className="text-sm mb-2">Field requirements:</p>
            <ul className="text-xs space-y-1 list-disc pl-4">
              <li>
                <strong>Shop ID:</strong> Any shop ID will be accepted. If the ID doesn't match an existing shop, it
                will be imported with "Unknown Client" and "Unknown Agent".
              </li>
              <li>
                <strong>Date:</strong> Any common date format (MM/DD/YYYY, YYYY-MM-DD, etc.)
              </li>
              <li>
                <strong>Location:</strong> Any text description
              </li>
              <li>
                <strong>Price:</strong> Numeric value greater than 0
              </li>
              <li>
                <strong>Status:</strong> Must be one of: pending, processing, completed (case insensitive)
              </li>
            </ul>

            <p className="text-sm mt-2 mb-1">Example row:</p>
            <code className="block bg-background p-2 rounded text-xs">
              SHOP001,2023-04-15,Main Street Store,150.00,pending
            </code>
          </div>

          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Processing...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 border-green-500 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>
                Successfully imported {successCount} orders.
                {errorCount > 0 && ` ${errorCount} orders had errors and were skipped.`}
              </AlertDescription>
            </Alert>
          )}
          {showErrors && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Import Errors</AlertTitle>
              <AlertDescription>
                <ul>
                  {errorMessages.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleImportClick} disabled={isProcessing || !csvData.trim()} className="btn-primary">
            {isProcessing ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Importing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Import Orders
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
