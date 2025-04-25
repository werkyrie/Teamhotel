"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useTeamContext } from "@/context/team-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, FileUp, Upload, X, Check, Download } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface AgentImportModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AgentImportModal({ isOpen, onClose }: AgentImportModalProps) {
  const { addAgent, updateAgent, agents } = useTeamContext()
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

      // Update the CSV header parsing to be more flexible with column names
      const header = lines[0].split(",").map((h) => h.trim().toLowerCase())
      const requiredFields = ["agent name", "name", "added today", "monthly added", "open accounts", "total deposits"]
      const headerMap = {
        "agent name": ["agent name", "name", "agentname"],
        "added today": ["added today", "addedtoday", "added"],
        "monthly added": ["monthly added", "monthlyadded", "monthly"],
        "open accounts": ["open accounts", "openaccounts", "accounts"],
        "total deposits": ["total deposits", "totaldeposits", "deposits"],
      }

      // Check if all required field categories are present
      const missingCategories = []
      for (const category in headerMap) {
        const found = headerMap[category].some((field) => header.includes(field))
        if (!found) {
          missingCategories.push(category)
        }
      }

      if (missingCategories.length > 0) {
        setError(`CSV is missing required fields: ${missingCategories.join(", ")}`)
        setIsProcessing(false)
        return
      }

      // Find the index for each required field
      const getFieldIndex = (category) => {
        for (const field of headerMap[category]) {
          const index = header.indexOf(field)
          if (index !== -1) return index
        }
        return -1
      }

      const nameIndex = getFieldIndex("agent name")
      const addedTodayIndex = getFieldIndex("added today")
      const monthlyAddedIndex = getFieldIndex("monthly added")
      const openAccountsIndex = getFieldIndex("open accounts")
      const totalDepositsIndex = getFieldIndex("total deposits")

      // Process data rows
      let successCount = 0
      let errorCount = 0
      const processedNames = new Set() // Track processed names to avoid duplicates in the same import

      // Process rows with a small delay to show progress
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(",").map((v) => v.trim())

          // Validate agent name
          const name = values[nameIndex]
          if (!name) {
            errorCount++
            continue
          }

          // Skip if we've already processed this name in the current import
          if (processedNames.has(name.toLowerCase())) {
            errorCount++
            continue
          }
          processedNames.add(name.toLowerCase())

          // Validate and parse numeric fields
          const addedToday = Number.parseInt(values[addedTodayIndex], 10)
          const monthlyAdded = Number.parseInt(values[monthlyAddedIndex], 10)
          const openAccounts = openAccountsIndex !== -1 ? Number.parseInt(values[openAccountsIndex], 10) : 0
          const totalDeposits = Number.parseFloat(values[totalDepositsIndex])

          if (
            isNaN(addedToday) ||
            addedToday < 0 ||
            isNaN(monthlyAdded) ||
            monthlyAdded < 0 ||
            (openAccountsIndex !== -1 && (isNaN(openAccounts) || openAccounts < 0)) ||
            isNaN(totalDeposits) ||
            totalDeposits < 0
          ) {
            errorCount++
            continue
          }

          // Check if agent with same name already exists
          const existingAgentIndex = agents.findIndex((agent) => agent.name.toLowerCase() === name.toLowerCase())

          if (existingAgentIndex !== -1) {
            // Update existing agent instead of creating a duplicate
            const existingAgent = agents[existingAgentIndex]
            updateAgent({
              ...existingAgent,
              addedToday,
              monthlyAdded,
              openAccounts: openAccountsIndex !== -1 ? openAccounts : existingAgent.openAccounts,
              totalDeposits,
            })
          } else {
            // Create and add new agent
            addAgent({
              name,
              addedToday,
              monthlyAdded,
              openAccounts: openAccountsIndex !== -1 ? openAccounts : 0,
              totalDeposits,
            })
          }

          successCount++
        }

        // Update progress
        setProgress(Math.round((i / (lines.length - 1)) * 100))

        // Small delay to show progress animation
        if (i % 5 === 0) {
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
          description: `Successfully imported ${successCount} agents. ${errorCount > 0 ? `${errorCount} agents had errors and were skipped.` : ""}`,
        })
      } else {
        setError("No valid agents found in the CSV data")
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

  // Update the processCSV function to handle totalWithdrawals
  const processCSV = (text: string) => {
    try {
      const lines = text.split("\n")
      const headers = lines[0].split(",").map((header) => header.trim())

      // Check for required headers
      const requiredHeaders = ["Agent Name"]
      const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header))

      if (missingHeaders.length > 0) {
        setError(`Missing required headers: ${missingHeaders.join(", ")}`)
        return []
      }

      // Map CSV columns to agent properties
      const nameIndex = headers.indexOf("Agent Name")
      const addedTodayIndex = headers.indexOf("Added Today")
      const monthlyAddedIndex = headers.indexOf("Monthly Added")
      const openAccountsIndex = headers.indexOf("Open Accounts")
      const totalDepositsIndex = headers.indexOf("Total Deposits")
      const totalWithdrawalsIndex = headers.indexOf("Total Withdrawals")

      // Parse data rows
      const agents = []
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue

        const values = lines[i].split(",").map((value) => value.trim())

        // Skip rows without a name
        if (!values[nameIndex]) continue

        const agent = {
          name: values[nameIndex],
          addedToday: addedTodayIndex >= 0 ? Number.parseInt(values[addedTodayIndex]) || 0 : 0,
          monthlyAdded: monthlyAddedIndex >= 0 ? Number.parseInt(values[monthlyAddedIndex]) || 0 : 0,
          openAccounts: openAccountsIndex >= 0 ? Number.parseInt(values[openAccountsIndex]) || 0 : 0,
          totalDeposits: totalDepositsIndex >= 0 ? Number.parseInt(values[totalDepositsIndex]) || 0 : 0,
          totalWithdrawals: totalWithdrawalsIndex >= 0 ? Number.parseInt(values[totalWithdrawalsIndex]) || 0 : 0,
          status: "Active" as "Active" | "Inactive",
        }

        agents.push(agent)
      }

      return agents
    } catch (error) {
      console.error("Error processing CSV:", error)
      setError("Failed to process CSV file. Please check the format.")
      return []
    }
  }

  const handleProcessCSVData = async () => {
    if (!csvData.trim()) {
      setError("Please enter or upload CSV data")
      return
    }

    try {
      setIsProcessing(true)
      setProgress(0)
      setError("")

      const agents = processCSV(csvData)

      if (agents.length === 0 && !error) {
        setError("No valid agents found in the CSV data")
        setIsProcessing(false)
        return
      }

      let successCount = 0
      let errorCount = 0
      const processedNames = new Set()

      for (let i = 0; i < agents.length; i++) {
        const agent = agents[i]

        if (processedNames.has(agent.name.toLowerCase())) {
          errorCount++
          continue
        }
        processedNames.add(agent.name.toLowerCase())

        const existingAgentIndex = agents.findIndex((a) => a.name.toLowerCase() === agent.name.toLowerCase())

        if (existingAgentIndex !== -1) {
          const existingAgent = agents[existingAgentIndex]
          updateAgent({
            ...existingAgent,
            addedToday: agent.addedToday,
            monthlyAdded: agent.monthlyAdded,
            openAccounts: agent.openAccounts,
            totalDeposits: agent.totalDeposits,
            totalWithdrawals: agent.totalWithdrawals,
          })
        } else {
          addAgent({
            name: agent.name,
            addedToday: agent.addedToday,
            monthlyAdded: agent.monthlyAdded,
            openAccounts: agent.openAccounts,
            totalDeposits: agent.totalDeposits,
            totalWithdrawals: agent.totalWithdrawals,
          })
        }

        successCount++
        setProgress(Math.round(((i + 1) / agents.length) * 100))
        await new Promise((resolve) => setTimeout(resolve, 50))
      }

      setSuccessCount(successCount)
      setErrorCount(errorCount)
      setSuccess(true)
      setIsProcessing(false)

      if (successCount > 0) {
        toast({
          variant: "success",
          title: "Import Successful",
          description: `Successfully imported ${successCount} agents. ${errorCount > 0 ? `${errorCount} agents had errors and were skipped.` : ""}`,
        })
      } else {
        setError("No valid agents found in the CSV data")
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

  const handleExportTemplate = () => {
    // Create CSV template with just headers
    const headers = [
      "Agent Name",
      "Added Today",
      "Monthly Added",
      "Open Accounts",
      "Total Deposits",
      "Total Withdrawals",
    ]
    const csvContent = headers.join(",")

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "agent_import_template.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Template Downloaded",
      description: "CSV import template has been downloaded",
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] animate-fade-in">
        <DialogHeader>
          <DialogTitle className="text-xl">Import Agents from CSV</DialogTitle>
          <DialogDescription>Upload a CSV file or paste CSV data to add multiple agents at once.</DialogDescription>
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
            <div
              className="file-upload-area flex items-center justify-center border-2 border-dashed rounded-md p-6 cursor-pointer transition-colors duration-200 hover:bg-muted/50"
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
            <Label htmlFor="csvData">Or paste CSV data</Label>
            <Textarea
              id="csvData"
              placeholder="Agent Name,Added Today,Monthly Added,Total Deposits"
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              className="h-[200px] font-mono text-sm"
            />
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                CSV format: Agent Name,Added Today,Monthly Added,Total Deposits
              </p>
              <p className="text-xs text-muted-foreground">Example: John Doe,5,20,5000</p>
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
              <Check className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>
                Successfully imported {successCount} agents.
                {errorCount > 0 && ` ${errorCount} agents had errors and were skipped.`}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleExportTemplate} variant="secondary" disabled={isProcessing}>
            <Download className="mr-2 h-4 w-4" />
            Template
          </Button>
          <Button onClick={handleProcessCSVData} disabled={isProcessing || !csvData.trim()} className="btn-primary">
            <Upload className="mr-2 h-4 w-4" />
            {isProcessing ? "Importing..." : "Import Agents"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
