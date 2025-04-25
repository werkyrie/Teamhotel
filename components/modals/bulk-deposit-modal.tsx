"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useClientContext } from "@/context/client-context"
import type { Deposit, PaymentMode } from "@/types/client"
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
import { AlertCircle, FileUp, Upload, X, FileText, Download, Info, CheckCircle2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { formatCurrency } from "@/utils/format-helpers"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface BulkDepositModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function BulkDepositModal({ isOpen, onClose }: BulkDepositModalProps) {
  const { clients, generateDepositId, bulkAddDeposits, setDeposits } = useClientContext()
  const { toast } = useToast()
  const [csvData, setCsvData] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [successCount, setSuccessCount] = useState(0)
  const [errorCount, setErrorCount] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<Deposit[]>([])
  const [activeTab, setActiveTab] = useState("upload")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCsvData("")
      setError("")
      setSuccess(false)
      setSuccessCount(0)
      setErrorCount(0)
      setProgress(0)
      setSelectedFile(null)
      setPreviewData([])
      setActiveTab("upload")
    }
  }, [isOpen])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    setError("")

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setCsvData(text || "")
      validateAndPreview(text || "")
    }
    reader.readAsText(file)
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setCsvData("")
    setPreviewData([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const validateAndPreview = (data: string) => {
    if (!data.trim()) {
      setPreviewData([])
      return
    }

    try {
      // Parse CSV data
      const lines = data.trim().split("\n")
      if (lines.length < 2) {
        setError("CSV must contain at least a header row and one data row")
        setPreviewData([])
        return
      }

      // Check header
      const header = lines[0].split(",").map((h) => h.trim().toLowerCase())
      const requiredFields = ["shop id", "date", "amount", "payment mode"]
      const missingFields = requiredFields.filter((field) => !header.includes(field))

      if (missingFields.length > 0) {
        setError(`CSV is missing required fields: ${missingFields.join(", ")}`)
        setPreviewData([])
        return
      }

      // Process data rows for preview
      const shopIdIndex = header.indexOf("shop id")
      const dateIndex = header.indexOf("date")
      const amountIndex = header.indexOf("amount")
      const paymentModeIndex = header.indexOf("payment mode")

      const previewDeposits: Deposit[] = []
      let previewErrors = 0

      // Only process up to 5 rows for preview
      const previewLines = lines.slice(1, Math.min(6, lines.length))

      for (const line of previewLines) {
        if (!line.trim()) continue

        const values = line.split(",").map((v) => v.trim())

        if (values.length < 4) {
          previewErrors++
          continue
        }

        // Validate shop ID
        const shopId = values[shopIdIndex]
        const client = clients.find((c) => c.shopId === shopId)
        const clientName = client?.clientName || "Unknown Client"
        const agent = client?.agent || "Unknown Agent"

        // Validate and parse date
        const depositDate = values[dateIndex]
        let parsedDate: Date
        try {
          parsedDate = new Date(depositDate)
          if (isNaN(parsedDate.getTime())) {
            parsedDate = new Date()
          }
        } catch (e) {
          parsedDate = new Date()
        }

        // Validate amount
        const amount = Number.parseFloat(values[amountIndex])
        if (isNaN(amount) || amount <= 0) {
          previewErrors++
          continue
        }

        // Validate payment mode
        let paymentMode = values[paymentModeIndex] as PaymentMode
        if (!["Crypto", "Online Banking", "Ewallet"].includes(paymentMode)) {
          // Try to normalize the payment mode
          const normalizedMode = values[paymentModeIndex].trim().toLowerCase()
          if (["crypto", "cryptocurrency", "bitcoin", "eth", "btc"].includes(normalizedMode)) {
            paymentMode = "Crypto"
          } else if (["online", "online banking", "internet banking"].includes(normalizedMode)) {
            paymentMode = "Online Banking"
          } else if (["ewallet", "e-wallet", "digital wallet", "wallet"].includes(normalizedMode)) {
            paymentMode = "Ewallet"
          } else {
            previewErrors++
            continue
          }
        }

        // Create deposit object for preview
        const deposit: Deposit = {
          depositId: `${generateDepositId()}_preview_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          shopId,
          clientName,
          agent,
          date: parsedDate,
          amount,
          paymentMode,
        }

        previewDeposits.push(deposit)
      }

      setPreviewData(previewDeposits)

      if (previewErrors > 0 && previewDeposits.length === 0) {
        setError("All preview rows contain errors. Please check your CSV format.")
      } else if (previewErrors > 0) {
        setError(`${previewErrors} row(s) in the preview contain errors and will be skipped.`)
      } else {
        setError("")
      }
    } catch (error) {
      console.error("Error processing CSV preview:", error)
      setError(`Error processing CSV preview: ${error.message}`)
      setPreviewData([])
    }
  }

  const handleCsvDataChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newData = e.target.value
    setCsvData(newData)
    validateAndPreview(newData)
  }

  const handleImport = async () => {
    if (!csvData.trim()) {
      setError("Please enter or upload CSV data")
      return
    }

    try {
      setIsProcessing(true)
      setProgress(0)
      setError("")

      // Parse CSV data
      const lines = csvData.trim().split("\n")
      if (lines.length < 2) {
        setError("CSV must contain at least a header row and one data row")
        setIsProcessing(false)
        return
      }

      // Check header
      const header = lines[0].split(",").map((h) => h.trim().toLowerCase())
      const requiredFields = ["shop id", "date", "amount", "payment mode"]
      const missingFields = requiredFields.filter((field) => !header.includes(field))

      if (missingFields.length > 0) {
        setError(`CSV is missing required fields: ${missingFields.join(", ")}`)
        setIsProcessing(false)
        return
      }

      // Process data rows
      let successCount = 0
      let errorCount = 0
      const shopIdIndex = header.indexOf("shop id")
      const dateIndex = header.indexOf("date")
      const amountIndex = header.indexOf("amount")
      const paymentModeIndex = header.indexOf("payment mode")

      // Collect all valid deposits
      const allDeposits: Deposit[] = []

      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(",").map((v) => v.trim())

          if (values.length < 4) {
            errorCount++
            continue
          }

          // Validate shop ID
          const shopId = values[shopIdIndex]
          const client = clients.find((c) => c.shopId === shopId)
          const clientName = client?.clientName || "Unknown Client"
          const agent = client?.agent || "Unknown Agent"

          // Validate and parse date
          const depositDate = values[dateIndex]
          let parsedDate: Date
          try {
            // Try to parse and format the date
            parsedDate = new Date(depositDate)
            if (isNaN(parsedDate.getTime())) {
              parsedDate = new Date()
            }
          } catch (e) {
            parsedDate = new Date()
          }

          // Validate amount
          const amount = Number.parseFloat(values[amountIndex])
          if (isNaN(amount) || amount <= 0) {
            errorCount++
            continue
          }

          // Validate payment mode
          let paymentMode = values[paymentModeIndex] as PaymentMode
          if (!["Crypto", "Online Banking", "Ewallet"].includes(paymentMode)) {
            // Try to normalize the payment mode
            const normalizedMode = values[paymentModeIndex].trim().toLowerCase()
            if (["crypto", "cryptocurrency", "bitcoin", "eth", "btc"].includes(normalizedMode)) {
              paymentMode = "Crypto"
            } else if (["online", "online banking", "internet banking"].includes(normalizedMode)) {
              paymentMode = "Online Banking"
            } else if (["ewallet", "e-wallet", "digital wallet", "wallet"].includes(normalizedMode)) {
              paymentMode = "Ewallet"
            } else {
              errorCount++
              continue
            }
          }

          // Create deposit object
          const deposit: Deposit = {
            depositId: `${generateDepositId()}_${i}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            shopId,
            clientName,
            agent,
            date: parsedDate,
            amount,
            paymentMode,
          }

          allDeposits.push(deposit)
          successCount++
        }

        // Update progress
        setProgress(Math.round((i / (lines.length - 1)) * 100))
      }

      // Log for debugging
      console.log(`Prepared ${allDeposits.length} deposits for import`)

      // Add all deposits to Firebase using batched writes
      if (allDeposits.length > 0) {
        try {
          // First update local state for immediate UI feedback
          setDeposits((prev) => [...prev, ...allDeposits])

          // Then try to save to Firebase
          await bulkAddDeposits(allDeposits)

          setSuccessCount(successCount)
          setErrorCount(errorCount)
          setSuccess(true)

          toast({
            title: "Import Successful",
            description: `Successfully imported ${successCount} deposits. ${errorCount > 0 ? `${errorCount} deposits had errors and were skipped.` : ""}`,
          })

          // Close modal after successful import
          if (successCount > 0) {
            setTimeout(() => {
              onClose()
            }, 1500)
          }
        } catch (error) {
          console.error("Error saving deposits:", error)
          setError(`Error saving deposits: ${error.message}`)

          toast({
            variant: "destructive",
            title: "Import Failed",
            description: `There was an error saving the deposits. Some data may not have been saved.`,
          })
        }
      } else {
        setError("No valid deposits found in the CSV data")
      }

      setIsProcessing(false)
    } catch (error) {
      console.error("Error processing CSV data:", error)
      setError(`Error processing CSV data: ${error.message}`)
      setIsProcessing(false)

      toast({
        variant: "destructive",
        title: "Import Failed",
        description: `Error processing CSV data: ${error.message}`,
      })
    }
  }

  const handleClickUpload = () => {
    fileInputRef.current?.click()
  }

  const downloadSampleCsv = () => {
    const sampleData =
      "shop id,date,amount,payment mode\n" +
      "4013785,2023-01-01,200.00,Ewallet\n" +
      "4013786,2023-01-02,350.50,Crypto\n" +
      "4013787,2023-01-03,175.25,Online Banking"

    const blob = new Blob([sampleData], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "deposit_sample.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Format date for display
  const formatDate = (dateString: string | Date) => {
    if (!dateString) return ""
    const date = typeof dateString === "string" ? new Date(dateString) : dateString
    return date.toLocaleDateString()
  }

  // Get payment mode badge color
  const getPaymentModeColor = (paymentMode: string) => {
    switch (paymentMode) {
      case "Crypto":
        return "bg-purple-500"
      case "Online Banking":
        return "bg-blue-500"
      case "Ewallet":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto animate-fade-in">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <FileUp className="h-5 w-5" />
            Bulk Add Deposits
          </DialogTitle>
          <DialogDescription>Upload a CSV file or paste CSV data to add multiple deposits at once.</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="upload">Upload CSV</TabsTrigger>
            <TabsTrigger value="preview">Preview Data</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={downloadSampleCsv} className="text-xs">
                <Download className="h-3 w-3 mr-1" />
                Download Sample CSV
              </Button>
            </div>

            {selectedFile ? (
              <div className="flex items-center justify-between p-4 border rounded-md bg-muted/30">
                <div className="flex items-center">
                  <div className="p-2 bg-primary/10 rounded-md mr-3">
                    <FileText className="h-5 w-5 text-primary" />
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
              <div
                className="file-upload-area flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={handleClickUpload}
              >
                <div className="text-center">
                  <FileUp className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium mb-1">Click to upload a CSV file</p>
                  <p className="text-xs text-muted-foreground">or drag and drop</p>
                  <Input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="csvData">Or paste CSV data</Label>
                {csvData && (
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab("preview")} className="text-xs">
                    View Preview
                  </Button>
                )}
              </div>
              <Textarea
                id="csvData"
                placeholder="shop id,date,amount,payment mode"
                value={csvData}
                onChange={handleCsvDataChange}
                className="h-[200px] font-mono text-sm form-input"
              />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">CSV Format Instructions:</p>
                <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-1">
                  <li>
                    First row must be the header: <span className="font-mono">shop id,date,amount,payment mode</span>
                  </li>
                  <li>Shop ID: Any valid shop ID (unknown IDs will be accepted)</li>
                  <li>Date: Any date format (MM/DD/YYYY, YYYY-MM-DD, etc.)</li>
                  <li>Amount: Numeric value greater than 0</li>
                  <li>Payment Mode: Crypto, Online Banking, or Ewallet</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">
                  Example: <span className="font-mono">4013785,2023-01-01,200.00,Ewallet</span>
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            {previewData.length > 0 ? (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Shop ID</TableHead>
                      <TableHead>Client Name</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment Mode</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((deposit, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{deposit.shopId}</TableCell>
                        <TableCell>{deposit.clientName}</TableCell>
                        <TableCell>{deposit.agent}</TableCell>
                        <TableCell>{formatDate(deposit.date)}</TableCell>
                        <TableCell>{formatCurrency(deposit.amount)}</TableCell>
                        <TableCell>
                          <Badge className={getPaymentModeColor(deposit.paymentMode)}>{deposit.paymentMode}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 border rounded-md">
                <Info className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No preview data available. Please upload or paste CSV data.</p>
              </div>
            )}

            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setActiveTab("upload")}>
                Back to Upload
              </Button>
            </div>
          </TabsContent>
        </Tabs>

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
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
              Successfully imported {successCount} deposits.
              {errorCount > 0 && ` ${errorCount} deposits had errors and were skipped.`}
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={isProcessing || !csvData.trim()} className="btn-primary">
            {isProcessing ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Importing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Import Deposits
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
