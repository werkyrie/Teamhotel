"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useClientContext } from "@/context/client-context"
import type { Client, ClientStatus, Agent } from "@/types/client"
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

interface CsvImportModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CsvImportModal({ isOpen, onClose }: CsvImportModalProps) {
  const { addClient, isShopIdUnique } = useClientContext()
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
      const requiredFields = ["shop id", "client name", "agent", "kyc completed date", "status"]
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
      const clientNameIndex = header.indexOf("client name")
      const agentIndex = header.indexOf("agent")
      const kycDateIndex = header.indexOf("kyc completed date")
      const statusIndex = header.indexOf("status")
      const notesIndex = header.indexOf("notes")

      // List of valid statuses (for case-insensitive comparison)
      const validStatuses = ["active", "inactive", "in process", "inprocess", "in-process", "eliminated", "pending"]

      // Process rows with a small delay to show progress
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(",").map((v) => v.trim())

          // Validate shop ID
          const shopId = values[shopIdIndex]
          if (!shopId || !isShopIdUnique(shopId)) {
            errorCount++
            continue
          }

          // Validate client name
          const clientName = values[clientNameIndex]
          if (!clientName) {
            errorCount++
            continue
          }

          // Validate agent
          const agent = values[agentIndex] as Agent
          if (!agent) {
            errorCount++
            continue
          }

          // Parse the KYC date properly from the CSV
          const kycDate = values[kycDateIndex]
          // Only create a new Date if the kycDate is not already a valid date string
          const formattedKycDate = kycDate ? kycDate : null

          // Validate status (case insensitive)
          const statusRaw = values[statusIndex]
          if (!statusRaw || !validStatuses.includes(statusRaw.toLowerCase())) {
            errorCount++
            continue
          }

          // Format status with proper capitalization based on input
          let status: ClientStatus
          const statusLower = statusRaw.toLowerCase()

          if (statusLower === "active") {
            status = "Active"
          } else if (statusLower === "inactive") {
            status = "Inactive"
          } else if (
            statusLower === "in process" ||
            statusLower === "inprocess" ||
            statusLower === "in-process" ||
            statusLower === "pending"
          ) {
            status = "In Process"
          } else {
            status = "Eliminated"
          }

          // Get notes if available
          const notes = notesIndex >= 0 && values[notesIndex] ? values[notesIndex] : ""

          // Create and add client
          const client: Client = {
            shopId,
            clientName,
            agent,
            kycDate: formattedKycDate,
            status,
            notes,
          }

          addClient(client)
          successCount++
        }

        // Update progress
        setProgress(Math.round((i / (lines.length - 1)) * 100))

        // Small delay to show progress animation
        if (i % 10 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 50))
        }
      }

      setSuccessCount(successCount)
      setErrorCount(errorCount)
      setSuccess(true)
      setIsProcessing(false)

      if (successCount > 0) {
        toast({
          variant: "success",
          title: "Import Successful",
          description: `Successfully imported ${successCount} clients. ${errorCount > 0 ? `${errorCount} clients had errors and were skipped.` : ""}`,
        })
      } else {
        setError("No valid clients found in the CSV data")
      }

      if (successCount > 0) {
        setTimeout(() => {
          onClose()
        }, 2000)
      }
    } catch (error) {
      setError("Error processing CSV data. Please check the format.")
      setIsProcessing(false)
    }
  }

  const handleClickUpload = () => {
    fileInputRef.current?.click()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] animate-fade-in">
        <DialogHeader>
          <DialogTitle className="text-xl">Import Clients from CSV</DialogTitle>
          <DialogDescription>Upload a CSV file or paste CSV data to add multiple clients at once.</DialogDescription>
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
              placeholder="Shop ID,Client Name,Agent,KYC Completed Date,Status,Notes"
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              className="h-[200px] font-mono text-sm form-input"
            />
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                CSV format: Shop ID,Client Name,Agent,KYC Completed Date(MM-DD-YYYY),Status,Notes(optional)
              </p>
              <p className="text-xs text-muted-foreground">
                Example: SHOP001,John Smith,KY,01-15-2023,Active,Regular customer
              </p>
              <p className="text-xs text-muted-foreground">
                Status options: Active, Inactive, In Process (or Inprocess/In-process/Pending), Eliminated
              </p>
            </div>
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
                Successfully imported {successCount} clients.
                {errorCount > 0 && ` ${errorCount} clients had errors and were skipped.`}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={isProcessing || !csvData.trim()} className="btn-primary">
            <Upload className="mr-2 h-4 w-4" />
            {isProcessing ? "Importing..." : "Import Clients"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
