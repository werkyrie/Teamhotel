// Replace the entire file with a simplified version that's easier to use

"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import {
  Loader2,
  Plus,
  Trash2,
  Copy,
  RefreshCw,
  Languages,
  FileText,
  Download,
  Upload,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Save,
} from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { useTeamContext } from "@/context/team-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

// Client interface
interface Client {
  id: string
  shopId: string
  clientDetails: string
  assets: string
  conversationSummary: string
  planForTomorrow: string
}

// Report data interface
interface ReportData {
  agentName: string
  addedToday: string
  monthlyAdded: string
  openShops: string
  deposits: string
  clients: Client[]
  lastModified: string
}

interface DateRange {
  from?: Date
  to?: Date
}

// Initial empty client template
const emptyClient = (): Client => ({
  id: crypto.randomUUID(),
  shopId: "",
  clientDetails: "",
  assets: "",
  conversationSummary: "",
  planForTomorrow: "",
})

export default function ReportsPage() {
  const { toast } = useToast()
  const { isAdmin } = useAuth()
  const { agents } = useTeamContext()
  const [reportType, setReportType] = useState<string>("agent-performance")
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(),
    to: new Date(),
  })
  const [agentName, setAgentName] = useState<string>("")
  const [addedToday, setAddedToday] = useState<number>(0)
  const [monthlyAdded, setMonthlyAdded] = useState<number>(0)
  const [openShops, setOpenShops] = useState<number>(0)
  const [agentDeposits, setAgentDeposits] = useState<number>(0)
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [generatedReport, setGeneratedReport] = useState<string>("")
  const reportContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [reportData, setReportData] = useState<any>(null)
  const [reportClients, setReportClients] = useState<Client[]>([emptyClient()])
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    agentInfo: true,
    clients: true,
    report: false,
  })
  const [expandedClients, setExpandedClients] = useState<{ [key: string]: boolean }>({})
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string[] }>({})
  const [completionPercentage, setCompletionPercentage] = useState<number>(0)
  const [lastSaved, setLastSaved] = useState<string>("")

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    })
  }

  // Toggle client expansion
  const toggleClient = (clientId: string) => {
    setExpandedClients({
      ...expandedClients,
      [clientId]: !expandedClients[clientId],
    })
  }

  // Calculate completion percentage
  useEffect(() => {
    let totalFields = 5 // Agent fields
    let completedFields = 0

    // Count agent fields
    if (agentName) completedFields++
    if (addedToday) completedFields++
    if (monthlyAdded) completedFields++
    if (openShops) completedFields++
    if (agentDeposits) completedFields++

    // Count client fields (each client has 5 fields, but only 2 are required)
    reportClients.forEach((client) => {
      totalFields += 2 // Only count required fields
      if (client.conversationSummary) completedFields++
      if (client.planForTomorrow) completedFields++
    })

    const percentage = Math.round((completedFields / totalFields) * 100)
    setCompletionPercentage(percentage)
  }, [agentName, addedToday, monthlyAdded, openShops, agentDeposits, reportClients])

  // Initialize expanded clients state when clients change
  useEffect(() => {
    const newExpandedClients: { [key: string]: boolean } = {}
    reportClients.forEach((client) => {
      // If this is a new client, expand it by default
      if (expandedClients[client.id] === undefined) {
        newExpandedClients[client.id] = true
      } else {
        newExpandedClients[client.id] = expandedClients[client.id]
      }
    })
    setExpandedClients(newExpandedClients)
  }, [reportClients])

  // Add a new client
  const addClient = () => {
    const newClient = emptyClient()
    setReportClients([...reportClients, newClient])

    // Auto-expand the new client
    setExpandedClients({
      ...expandedClients,
      [newClient.id]: true,
    })

    // Scroll to the new client after a short delay
    setTimeout(() => {
      const element = document.getElementById(`client-${newClient.id}`)
      if (element) {
        element.scrollIntoView({ behavior: "smooth" })
      }
    }, 100)
  }

  // Remove a client
  const removeClient = (id: string) => {
    if (reportClients.length <= 1) {
      toast({
        title: "Cannot remove",
        description: "You must have at least one client in the report",
        variant: "destructive",
      })
      return
    }

    setReportClients(reportClients.filter((client) => client.id !== id))

    // Remove from expanded clients and validation errors
    const newExpandedClients = { ...expandedClients }
    delete newExpandedClients[id]
    setExpandedClients(newExpandedClients)

    const newValidationErrors = { ...validationErrors }
    delete newValidationErrors[id]
    setValidationErrors(newValidationErrors)
  }

  // Update client field
  const updateClient = (id: string, field: keyof Client, value: string) => {
    setReportClients(reportClients.map((client) => (client.id === id ? { ...client, [field]: value } : client)))

    // Clear validation error when field is filled
    if (value && validationErrors[id] && validationErrors[id].includes(field)) {
      const newErrors = { ...validationErrors }
      newErrors[id] = newErrors[id].filter((f) => f !== field)
      if (newErrors[id].length === 0) {
        delete newErrors[id]
      }
      setValidationErrors(newErrors)
    }

    // Auto-save after a short delay
    saveReportData()
  }

  // Check if client has required information
  const clientHasRequiredInfo = (client: Client) => {
    return Boolean(client.conversationSummary.trim() && client.planForTomorrow.trim())
  }

  // Get client completion status
  const getClientCompletionStatus = (client: Client) => {
    let completed = 0
    const total = 2 // Only count required fields

    if (client.conversationSummary) completed++
    if (client.planForTomorrow) completed++

    return {
      completed,
      total,
      percentage: Math.round((completed / total) * 100),
    }
  }

  // Validate all clients have required information
  const validateClientInfo = () => {
    const errors: { [key: string]: string[] } = {}
    let hasErrors = false

    reportClients.forEach((client) => {
      const clientErrors: string[] = []

      if (!client.conversationSummary.trim()) {
        clientErrors.push("conversationSummary")
      }

      if (!client.planForTomorrow.trim()) {
        clientErrors.push("planForTomorrow")
      }

      if (clientErrors.length > 0) {
        errors[client.id] = clientErrors
        hasErrors = true
      }
    })

    setValidationErrors(errors)

    if (hasErrors) {
      toast({
        title: "Missing required information",
        description: "Please fill out all required fields marked with *",
        variant: "destructive",
      })

      // Expand the first client with errors
      const firstErrorId = Object.keys(errors)[0]
      if (firstErrorId) {
        setExpandedClients({
          ...expandedClients,
          [firstErrorId]: true,
        })

        // Scroll to the client with error
        const clientElement = document.getElementById(`client-${firstErrorId}`)
        if (clientElement) {
          clientElement.scrollIntoView({ behavior: "smooth" })
        }
      }
    }

    return !hasErrors
  }

  // Save report data to localStorage
  const saveReportData = () => {
    const dataToSave = {
      agentName,
      addedToday,
      monthlyAdded,
      openShops,
      deposits: agentDeposits,
      clients: reportClients,
      lastModified: new Date().toISOString(),
    }

    localStorage.setItem("agentReportData", JSON.stringify(dataToSave))
    setLastSaved(new Date().toLocaleTimeString())
  }

  // Generate the report
  const generateReport = () => {
    // Validate required information first
    if (!validateClientInfo()) {
      return
    }

    setIsGenerating(true)
    saveReportData()

    // Simulate processing delay
    setTimeout(() => {
      let report = `Agent Report - ${new Date().toLocaleDateString()}\n\n`

      // Agent section
      report += `AGENT INFORMATION:\n`
      report += `Name: ${agentName || "Not specified"}\n`
      report += `Added Client Today: ${addedToday || "0"}\n`
      report += `Monthly Client Added: ${monthlyAdded || "0"}\n`
      report += `Open Shops: ${openShops || "0"}\n`
      report += `Deposits: ${agentDeposits || "$0"}\n\n`

      // Clients section
      report += `CLIENT INFORMATION:\n\n`

      reportClients.forEach((client, index) => {
        report += `CLIENT ${index + 1}:\n`
        report += `Shop ID: ${client.shopId || "Not specified"}\n`
        report += `Client Details: ${client.clientDetails || "None"}\n`
        report += `Assets: ${client.assets || "None"}\n`
        report += `Conversation Summary: ${client.conversationSummary || "None"}\n`
        report += `Plan for Tomorrow: ${client.planForTomorrow || "None"}\n\n`
      })

      setGeneratedReport(report)
      setIsGenerating(false)

      // Expand the report section and scroll to it
      setExpandedSections({
        ...expandedSections,
        report: true,
      })

      if (reportContainerRef.current) {
        reportContainerRef.current.scrollIntoView({ behavior: "smooth" })
      }

      toast({
        title: "Report Generated",
        description: "Your report has been successfully generated",
      })
    }, 800)
  }

  // Clear the report
  const clearReport = () => {
    setGeneratedReport("")
    toast({
      title: "Report Cleared",
      description: "The generated report has been cleared",
    })
  }

  // Copy report to clipboard
  const copyToClipboard = () => {
    if (!generatedReport) {
      toast({
        title: "Nothing to copy",
        description: "Please generate a report first",
        variant: "destructive",
      })
      return
    }

    navigator.clipboard
      .writeText(generatedReport)
      .then(() => {
        toast({
          title: "Copied to clipboard",
          description: "Report has been copied to your clipboard",
        })
      })
      .catch(() => {
        toast({
          title: "Copy failed",
          description: "Could not copy to clipboard. Please try again.",
          variant: "destructive",
        })
      })
  }

  // Translate report using Google Translate
  const translateReport = () => {
    if (!generatedReport) {
      toast({
        title: "Nothing to translate",
        description: "Please generate a report first",
        variant: "destructive",
      })
      return
    }

    // Encode the report text for URL
    const encodedText = encodeURIComponent(generatedReport)

    // Open Google Translate in a new tab (English to Chinese)
    window.open(`https://translate.google.com/?sl=en&tl=zh-CN&text=${encodedText}&op=translate`, "_blank")

    toast({
      title: "Opening translator",
      description: "Google Translate is opening in a new tab",
    })
  }

  // Export report data as JSON
  const exportAsJson = () => {
    // Create report data object
    const reportData: ReportData = {
      agentName,
      addedToday: addedToday.toString(),
      monthlyAdded: monthlyAdded.toString(),
      openShops: openShops.toString(),
      deposits: agentDeposits.toString(),
      clients: reportClients,
      lastModified: new Date().toISOString(),
    }

    // Convert to JSON string
    const jsonString = JSON.stringify(reportData, null, 2)

    // Create blob and download link
    const blob = new Blob([jsonString], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    // Create temporary link and trigger download
    const link = document.createElement("a")
    link.href = url
    link.download = `agent-report-${new Date().toLocaleDateString().replace(/\//g, "-")}.json`
    document.body.appendChild(link)
    link.click()

    // Clean up
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: "Report Exported",
      description: "Your report has been exported as a JSON file",
    })
  }

  // Trigger file input click for JSON import
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Import report data from JSON file
  const importFromJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const reportData = JSON.parse(content) as ReportData

        // Validate the imported data
        if (!reportData || typeof reportData !== "object") {
          throw new Error("Invalid report data format")
        }

        // Update state with imported data
        setAgentName(reportData.agentName || "")
        setAddedToday(Number(reportData.addedToday) || 0)
        setMonthlyAdded(Number(reportData.monthlyAdded) || 0)
        setOpenShops(Number(reportData.openShops) || 0)
        setAgentDeposits(Number(reportData.deposits) || 0)

        // Ensure each client has an ID
        const importedClients = reportData.clients?.map((client) => ({
          ...client,
          id: client.id || crypto.randomUUID(),
        })) || [emptyClient()]

        setReportClients(importedClients)

        toast({
          title: "Report Imported",
          description: `Successfully imported report from ${file.name}`,
        })
      } catch (error) {
        console.error("Error importing report:", error)
        toast({
          title: "Import Failed",
          description: "The selected file contains invalid data",
          variant: "destructive",
        })
      }
    }

    reader.onerror = () => {
      toast({
        title: "Import Failed",
        description: "An error occurred while reading the file",
        variant: "destructive",
      })
    }

    reader.readAsText(file)

    // Reset file input
    if (event.target) {
      event.target.value = ""
    }
  }

  // Load saved data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem("agentReportData")
    if (savedData) {
      try {
        const data = JSON.parse(savedData)
        setAgentName(data.agentName || "")
        setAddedToday(data.addedToday || 0)
        setMonthlyAdded(data.monthlyAdded || 0)
        setOpenShops(data.openShops || 0)
        setAgentDeposits(data.deposits || 0)

        const loadedClients = data.clients || [emptyClient()]
        setReportClients(loadedClients)

        if (data.lastModified) {
          const date = new Date(data.lastModified)
          setLastSaved(date.toLocaleTimeString())
        }
      } catch (e) {
        console.error("Error loading saved data:", e)
      }
    } else {
      // Initialize with default client
      const defaultClient = emptyClient()
      setReportClients([defaultClient])
    }
  }, [])

  // Auto-populate fields when agent is selected
  useEffect(() => {
    if (agentName && agents) {
      const selectedAgent = agents.find((agent) => agent.name === agentName)
      if (selectedAgent) {
        setAddedToday(selectedAgent.addedToday || 0)
        setMonthlyAdded(selectedAgent.monthlyAdded || 0)
        setOpenShops(selectedAgent.openAccounts || 0)
        setAgentDeposits(selectedAgent.totalDeposits || 0)
        saveReportData()
      }
    }
  }, [agentName, agents])

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Agent Reports</h1>
        <p className="text-muted-foreground mt-2">Create detailed agent and client reports</p>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="text-sm font-medium">Report completion: {completionPercentage}%</div>
          {lastSaved && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Save className="h-3 w-3" /> Last saved: {lastSaved}
            </div>
          )}
        </div>
        <Progress value={completionPercentage} className="h-2" />
      </div>

      {/* Agent Information Section */}
      <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardHeader
          className="bg-muted/30 cursor-pointer flex flex-row items-center justify-between"
          onClick={() => toggleSection("agentInfo")}
        >
          <div>
            <CardTitle>Agent Information</CardTitle>
            <CardDescription>Enter your agent details for the report</CardDescription>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            {expandedSections.agentInfo ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CardHeader>

        {expandedSections.agentInfo && (
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="agentName" className="text-sm font-medium">
                  Agent Name <span className="text-red-500">*</span>
                </label>
                <Select value={agentName} onValueChange={setAgentName}>
                  <SelectTrigger id="agentName" className="w-full">
                    <SelectValue placeholder="Select an agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents && agents.length > 0 ? (
                      agents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.name}>
                          {agent.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="" disabled>
                        No agents available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Selecting an agent will auto-populate the statistics below
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="addedToday" className="text-sm font-medium">
                  Added Client Today <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2 h-10 px-3 py-2 rounded-md border border-input bg-muted text-muted-foreground">
                  {addedToday}
                  <span className="text-xs text-muted-foreground ml-auto">Auto-generated</span>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="monthlyAdded" className="text-sm font-medium">
                  Monthly Client Added <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2 h-10 px-3 py-2 rounded-md border border-input bg-muted text-muted-foreground">
                  {monthlyAdded}
                  <span className="text-xs text-muted-foreground ml-auto">Auto-generated</span>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="openShops" className="text-sm font-medium">
                  Open Shops <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2 h-10 px-3 py-2 rounded-md border border-input bg-muted text-muted-foreground">
                  {openShops}
                  <span className="text-xs text-muted-foreground ml-auto">Auto-generated</span>
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label htmlFor="deposits" className="text-sm font-medium">
                  Deposits <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2 h-10 px-3 py-2 rounded-md border border-input bg-muted text-muted-foreground">
                  {agentDeposits}
                  <span className="text-xs text-muted-foreground ml-auto">Auto-generated</span>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Client Management Section */}
      <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardHeader
          className="bg-muted/30 cursor-pointer flex flex-row items-center justify-between"
          onClick={() => toggleSection("clients")}
        >
          <div>
            <CardTitle>Client Information</CardTitle>
            <CardDescription>Enter details for each client</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={(e) => {
                e.stopPropagation()
                addClient()
              }}
              size="sm"
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Add Client
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              {expandedSections.clients ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>

        {expandedSections.clients && (
          <CardContent className="pt-4">
            <div className="space-y-4">
              {reportClients.map((client, index) => {
                const status = getClientCompletionStatus(client)

                return (
                  <Card
                    key={client.id}
                    id={`client-${client.id}`}
                    className={`shadow-sm transition-shadow duration-300 ${validationErrors[client.id] ? "border-red-300" : ""}`}
                  >
                    <CardHeader
                      className={`py-3 cursor-pointer flex flex-row items-center justify-between ${validationErrors[client.id] ? "bg-red-50" : "bg-muted/30"}`}
                      onClick={() => toggleClient(client.id)}
                    >
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-base">Client {index + 1}</CardTitle>
                        <Progress
                          value={status.percentage}
                          className="h-2 w-20"
                          indicatorClassName={status.percentage === 100 ? "bg-green-500" : ""}
                        />
                        <span className="text-xs text-muted-foreground">
                          {status.completed}/{status.total} completed
                        </span>

                        {validationErrors[client.id] && (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            Missing required fields
                          </Badge>
                        )}

                        {clientHasRequiredInfo(client) && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Complete
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeClient(client.id)
                          }}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Remove client</span>
                        </Button>

                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          {expandedClients[client.id] ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CardHeader>

                    {expandedClients[client.id] && (
                      <CardContent className="pt-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Basic Information Fields */}
                          <div className="space-y-2">
                            <label htmlFor={`shopId-${client.id}`} className="text-sm font-medium">
                              Shop ID
                            </label>
                            <Input
                              id={`shopId-${client.id}`}
                              placeholder="Enter shop ID"
                              value={client.shopId}
                              onChange={(e) => updateClient(client.id, "shopId", e.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                            <label htmlFor={`assets-${client.id}`} className="text-sm font-medium">
                              Assets
                            </label>
                            <Input
                              id={`assets-${client.id}`}
                              placeholder="Enter client assets"
                              value={client.assets}
                              onChange={(e) => updateClient(client.id, "assets", e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label htmlFor={`clientDetails-${client.id}`} className="text-sm font-medium">
                            Client Details
                          </label>
                          <Textarea
                            id={`clientDetails-${client.id}`}
                            placeholder="Client Name/ Age/ Job/Location"
                            value={client.clientDetails}
                            onChange={(e) => updateClient(client.id, "clientDetails", e.target.value)}
                            rows={2}
                          />
                        </div>

                        {/* Required Fields with Templates */}
                        <div className="space-y-2">
                          <label
                            htmlFor={`conversationSummary-${client.id}`}
                            className="text-sm font-medium flex items-center"
                          >
                            Conversation Summary <span className="text-red-500 ml-1">*</span>
                          </label>

                          <Textarea
                            id={`conversationSummary-${client.id}`}
                            placeholder="Summarize your conversation"
                            value={client.conversationSummary}
                            onChange={(e) => updateClient(client.id, "conversationSummary", e.target.value)}
                            rows={3}
                            className={
                              validationErrors[client.id] && validationErrors[client.id].includes("conversationSummary")
                                ? "border-red-300"
                                : ""
                            }
                          />

                          {validationErrors[client.id] &&
                            validationErrors[client.id].includes("conversationSummary") && (
                              <p className="text-xs text-red-500 mt-1">This field is required</p>
                            )}
                        </div>

                        <div className="space-y-2">
                          <label
                            htmlFor={`planForTomorrow-${client.id}`}
                            className="text-sm font-medium flex items-center"
                          >
                            Plan for Tomorrow <span className="text-red-500 ml-1">*</span>
                          </label>

                          <Textarea
                            id={`planForTomorrow-${client.id}`}
                            placeholder="What's the plan for tomorrow?"
                            value={client.planForTomorrow}
                            onChange={(e) => updateClient(client.id, "planForTomorrow", e.target.value)}
                            rows={3}
                            className={
                              validationErrors[client.id] && validationErrors[client.id].includes("planForTomorrow")
                                ? "border-red-300"
                                : ""
                            }
                          />

                          {validationErrors[client.id] && validationErrors[client.id].includes("planForTomorrow") && (
                            <p className="text-xs text-red-500 mt-1">This field is required</p>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )
              })}

              <Button
                onClick={addClient}
                variant="outline"
                className="w-full flex items-center justify-center gap-2 py-6 border-dashed"
              >
                <Plus className="h-4 w-4" />
                Add Another Client
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Report Generation Section */}
      <Card
        className="shadow-sm border border-muted hover:shadow-md transition-shadow duration-300"
        ref={reportContainerRef}
      >
        <CardHeader
          className="bg-muted/20 dark:bg-muted/10 cursor-pointer flex flex-row items-center justify-between p-5"
          onClick={() => toggleSection("report")}
        >
          <div className="flex items-center gap-3">
            <div className="bg-background border border-muted p-2 rounded-full dark:bg-muted/20">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Generate Your Report</CardTitle>
              <CardDescription>Click here to create, export, and manage your completed report</CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm">
            {expandedSections.report ? (
              <span className="flex items-center gap-1">
                <ChevronUp className="h-4 w-4" /> Hide
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <ChevronDown className="h-4 w-4" /> Show
              </span>
            )}
          </Button>
        </CardHeader>

        {expandedSections.report && (
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-3 mb-6">
              <Button onClick={generateReport} disabled={isGenerating} className="flex items-center gap-2">
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    Generate Report
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={clearReport}
                disabled={!generatedReport || isGenerating}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Clear
              </Button>

              <Button
                variant="outline"
                onClick={translateReport}
                disabled={!generatedReport || isGenerating}
                className="flex items-center gap-2"
              >
                <Languages className="h-4 w-4" />
                Translate
              </Button>

              <Button
                variant="outline"
                onClick={copyToClipboard}
                disabled={!generatedReport || isGenerating}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy
              </Button>

              <Button variant="outline" onClick={exportAsJson} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export JSON
              </Button>

              <Button variant="outline" onClick={triggerFileInput} className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Import JSON
              </Button>

              {/* Hidden file input for JSON import */}
              <input type="file" ref={fileInputRef} onChange={importFromJson} accept=".json" className="hidden" />
            </div>

            <div className="border rounded-md p-4 min-h-[200px] bg-muted/20 font-mono text-sm whitespace-pre-wrap">
              {generatedReport || "Your generated report will appear here..."}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
