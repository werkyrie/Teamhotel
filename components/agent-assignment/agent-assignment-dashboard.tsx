"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import type { Client } from "@/types/client"
import { db } from "@/lib/firebase"
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, serverTimestamp } from "firebase/firestore"

// Sample agent names - we'll use these for display and tracking
const agents = ["Annie", "Cuu", "Jhe", "Kel", "Ken", "Kyrie", "Lovely", "Mar", "Primo", "Thac", "Vivian"]

// Interface for the currently edited cell
interface EditingCell {
  clientId: string | null
  field: keyof Client | null
  value: string
}

// Interface for client assignment data
interface ClientAssignment {
  id: string
  name: string
  age: string
  location: string
  work: string
  application: string
  assignedAgent: string
  date: string
  createdAt?: any
  updatedAt?: any
}

export default function AgentAssignmentDashboard() {
  const [searchQuery, setSearchQuery] = useState("")
  const [clientText, setClientText] = useState("")
  const [clients, setClients] = useState<ClientAssignment[]>([])
  const [locationFilter, setLocationFilter] = useState("all-locations")
  const [applicationFilter, setApplicationFilter] = useState("all-applications")
  const [agentFilter, setAgentFilter] = useState("all-agents")
  const [monthFilter, setMonthFilter] = useState("all-months")
  const [rowsPerPage, setRowsPerPage] = useState("10")
  const [filteredClients, setFilteredClients] = useState<ClientAssignment[]>([])
  const [editingCell, setEditingCell] = useState<EditingCell>({ clientId: null, field: null, value: "" })
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  // Check if current user is an admin based on their email or role
  const [isAdmin, setIsAdmin] = useState(false)

  const [uniqueLocations, setUniqueLocations] = useState<string[]>([])
  const [uniqueApplications, setUniqueApplications] = useState<string[]>([])

  const editInputRef = useRef<HTMLInputElement>(null)

  const { user } = useAuth()
  const { toast } = useToast()

  // Get current username from email (before @)
  const currentAgent = user?.email ? user.email.split("@")[0] : ""

  // Calculate dashboard stats
  const totalClients = clients.length

  // Calculate agent workloads
  const agentWorkloads = agents.reduce(
    (acc, agent) => {
      const agentName = agent.toLowerCase()
      acc[agentName] = clients.filter((client) => client.assignedAgent.toLowerCase() === agentName).length
      return acc
    },
    {} as Record<string, number>,
  )

  // Find top agent
  const topAgent = Object.entries(agentWorkloads).sort((a, b) => b[1] - a[1])[0]
  const topAgentName = topAgent && topAgent[1] > 0 ? agents.find((a) => a.toLowerCase() === topAgent[0]) || "-" : "-"

  // Apply filters and search
  useEffect(() => {
    let result = [...clients]

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (client) =>
          client.name.toLowerCase().includes(query) ||
          client.location.toLowerCase().includes(query) ||
          client.work.toLowerCase().includes(query) ||
          client.application.toLowerCase().includes(query) ||
          client.assignedAgent.toLowerCase().includes(query),
      )
    }

    // Apply filters
    if (locationFilter !== "all-locations") {
      result = result.filter((client) => client.location.toLowerCase() === locationFilter)
    }

    if (applicationFilter !== "all-applications") {
      result = result.filter((client) => client.application.toLowerCase() === applicationFilter)
    }

    if (agentFilter !== "all-agents") {
      result = result.filter((client) => client.assignedAgent.toLowerCase() === agentFilter)
    }

    // Apply month filter
    if (monthFilter !== "all-months") {
      result = result.filter((client) => {
        const clientDate = new Date(client.date)
        const currentDate = new Date()

        if (monthFilter === "current") {
          // Current month
          return (
            clientDate.getMonth() === currentDate.getMonth() && clientDate.getFullYear() === currentDate.getFullYear()
          )
        } else if (monthFilter === "previous") {
          // Previous month
          const prevMonth = currentDate.getMonth() === 0 ? 11 : currentDate.getMonth() - 1
          const prevMonthYear = currentDate.getMonth() === 0 ? currentDate.getFullYear() - 1 : currentDate.getFullYear()
          return clientDate.getMonth() === prevMonth && clientDate.getFullYear() === prevMonthYear
        } else {
          // Specific month
          const monthMap: Record<string, number> = {
            jan: 0,
            feb: 1,
            mar: 2,
            apr: 3,
            may: 4,
            jun: 5,
            jul: 6,
            aug: 7,
            sep: 8,
            oct: 9,
            nov: 10,
            dec: 11,
          }
          return clientDate.getMonth() === monthMap[monthFilter]
        }
      })
    }

    setFilteredClients(result)
  }, [clients, searchQuery, locationFilter, applicationFilter, agentFilter, monthFilter])

  useEffect(() => {
    // Extract unique locations and applications
    const locations = [...new Set(clients.map((client) => client.location.toLowerCase()))]
    const applications = [...new Set(clients.map((client) => client.application.toLowerCase()))]

    setUniqueLocations(locations)
    setUniqueApplications(applications)
  }, [clients])

  // Load clients from Firestore on component mount
  useEffect(() => {
    setLoading(true)

    // Check if user is authenticated
    if (!user) {
      // If not authenticated, try to load from localStorage as fallback
      const savedClients = localStorage.getItem("assignedClients")
      if (savedClients) {
        try {
          setClients(JSON.parse(savedClients))
        } catch (e) {
          console.error("Failed to parse saved clients", e)
        }
      }
      setLoading(false)
      return
    }

    // Set up real-time listener for client assignments
    const clientsRef = collection(db, "clientAssignments")
    const unsubscribe = onSnapshot(
      clientsRef,
      (snapshot) => {
        const clientsData: ClientAssignment[] = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          clientsData.push({
            id: doc.id,
            name: data.name || "",
            age: data.age || "",
            location: data.location || "Unknown",
            work: data.work || "Unknown",
            application: data.application || "Unknown",
            assignedAgent: data.assignedAgent || "",
            date: data.date || new Date().toISOString().split("T")[0],
          })
        })
        setClients(clientsData)
        setLoading(false)
      },
      (error) => {
        console.error("Error fetching client assignments:", error)
        // Fallback to localStorage if Firestore fails
        const savedClients = localStorage.getItem("assignedClients")
        if (savedClients) {
          try {
            setClients(JSON.parse(savedClients))
          } catch (e) {
            console.error("Failed to parse saved clients", e)
          }
        }
        setLoading(false)
      },
    )

    // Clean up the listener on unmount
    return () => unsubscribe()
  }, [user])

  // Extract age from various formats (e.g., "41yrs old" -> "41")
  const extractAge = (ageText: string): string => {
    const numericMatch = ageText.match(/\d+/)
    return numericMatch ? numericMatch[0] : ageText
  }

  // Clean name field (extract real name if in format "username / real name")
  const cleanName = (nameText: string): string => {
    if (nameText.includes(" / ")) {
      // Format: "Username / Real Name"
      return nameText.split(" / ")[1].trim()
    }
    return nameText.trim()
  }

  // Parse client information from pasted text with flexible format support
  const processClientInfo = async () => {
    if (!clientText.trim()) {
      toast({
        title: "Error",
        description: "Please enter client information",
        variant: "destructive",
      })
      return
    }

    try {
      let name = ""
      let age = ""
      let location = ""
      let work = ""
      let application = ""

      const lines = clientText.split("\n").filter((line) => line.trim() !== "")

      // Check if the text contains field labels (Name:, Age:, etc.)
      const hasLabels = lines.some((line) => line.includes(":"))

      if (hasLabels) {
        // Format with labels: "Name: John Smith", "Age: 35", etc.
        for (const line of lines) {
          // Skip lines without a colon
          if (!line.includes(":")) continue

          const [key, ...valueParts] = line.split(":")
          const value = valueParts.join(":").trim() // Rejoin in case value contains colons

          const keyLower = key.trim().toLowerCase()

          // Match field labels with flexible spelling
          if (keyLower.includes("name")) name = cleanName(value)
          else if (keyLower.includes("age")) age = extractAge(value)
          else if (keyLower.includes("loc")) location = value
          else if (keyLower.includes("work") || keyLower.includes("occupation")) work = value
          else if (keyLower.includes("app")) application = value
        }
      } else {
        // Simple format: "John Smith\n35\nNew York\nDeveloper\nTanTan"
        if (lines.length >= 2) {
          name = cleanName(lines[0].trim())
          age = extractAge(lines[1].trim())

          // Try to determine which remaining lines are which fields
          if (lines.length >= 3) location = lines[2].trim()
          if (lines.length >= 4) work = lines[3].trim()
          if (lines.length >= 5) application = lines[4].trim()
        }
      }

      // Validate required fields
      if (!name || !age) {
        toast({
          title: "Error",
          description: "Name and age are required",
          variant: "destructive",
        })
        return
      }

      // Create new client with default values for optional fields
      const today = new Date().toISOString().split("T")[0]
      const newClient: Omit<ClientAssignment, "id"> = {
        name,
        age,
        location: location || "Unknown",
        work: work || "Unknown",
        application: application || "Unknown",
        assignedAgent: currentAgent ? currentAgent.charAt(0).toUpperCase() + currentAgent.slice(1) : "",
        date: today,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      if (!user) {
        // If not authenticated, save to localStorage
        const clientWithId = {
          ...newClient,
          id: Date.now().toString(),
        }
        setClients((prev) => [...prev, clientWithId])
        localStorage.setItem("assignedClients", JSON.stringify([...clients, clientWithId]))
      } else {
        // Add to Firestore
        await addDoc(collection(db, "clientAssignments"), newClient)
      }

      // Clear the input
      setClientText("")

      toast({
        title: "Success",
        description: `Client ${name} has been added and assigned to ${newClient.assignedAgent}`,
      })
    } catch (error) {
      console.error("Error processing client info:", error)
      toast({
        title: "Error",
        description: "Failed to process client information",
        variant: "destructive",
      })
    }
  }

  const resetFilters = () => {
    setLocationFilter("all-locations")
    setApplicationFilter("all-applications")
    setAgentFilter("all-agents")
    setMonthFilter("all-months")
    setSearchQuery("")
  }

  // Start editing a cell
  const startEdit = (client: ClientAssignment, field: keyof ClientAssignment) => {
    // Don't allow editing the ID
    if (field === "id") return

    setEditingCell({
      clientId: client.id,
      field,
      value: client[field],
    })

    // If editing date, set the selected date
    if (field === "date") {
      setSelectedDate(new Date(client.date))
    }
  }

  // Save the edited value
  const saveEdit = async () => {
    if (!editingCell.clientId || !editingCell.field) return

    try {
      if (!user) {
        // If not authenticated, save to localStorage
        setClients((prevClients) => {
          const updatedClients = prevClients.map((client) => {
            if (client.id === editingCell.clientId) {
              return { ...client, [editingCell.field as keyof ClientAssignment]: editingCell.value }
            }
            return client
          })
          localStorage.setItem("assignedClients", JSON.stringify(updatedClients))
          return updatedClients
        })
      } else {
        // Update in Firestore
        const clientRef = doc(db, "clientAssignments", editingCell.clientId)
        await updateDoc(clientRef, {
          [editingCell.field]: editingCell.value,
          updatedAt: serverTimestamp(),
        })
      }

      toast({
        title: "Updated",
        description: `Client ${editingCell.field} updated successfully`,
      })
    } catch (error) {
      console.error("Error updating client:", error)
      toast({
        title: "Error",
        description: "Failed to update client information",
        variant: "destructive",
      })
    }

    // Reset editing state
    setEditingCell({ clientId: null, field: null, value: "" })
    setSelectedDate(undefined)
  }

  // Cancel editing
  const cancelEdit = () => {
    setEditingCell({ clientId: null, field: null, value: "" })
    setSelectedDate(undefined)
  }

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return

    setSelectedDate(date)
    setEditingCell((prev) => ({
      ...prev,
      value: date.toISOString().split("T")[0],
    }))
  }

  // Delete a client
  const handleDeleteClient = async (clientId: string) => {
    // Extra safety check to ensure only admins can delete
    if (!isAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only administrators can delete client records",
        variant: "destructive",
      })
      return
    }

    try {
      if (!user) {
        // Fallback to localStorage
        setClients((prevClients) => prevClients.filter((client) => client.id !== clientId))
        localStorage.setItem("assignedClients", JSON.stringify(clients.filter((client) => client.id !== clientId)))
      } else {
        // Delete from Firestore
        const clientRef = doc(db, "clientAssignments", clientId)
        await deleteDoc(clientRef)
      }

      toast({
        title: "Client Deleted",
        description: "Client has been deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting client:", error)
      toast({
        title: "Error",
        description: "Failed to delete client",
        variant: "destructive",
      })
    }
  }

  // Update isAdmin state when user changes
  useEffect(() => {
    if (user) {
      // You can customize this logic based on your authentication system
      // For example, check if user email is in a list of admin emails
      const adminEmails = ["admin@example.com", "manager@example.com"]
      setIsAdmin(adminEmails.includes(user.email || "") || user.email?.includes("admin") || false)

      // Alternative: If you have a user roles field in your auth system
      // setIsAdmin(user.roles?.includes('admin') || false)
    } else {
      setIsAdmin(false)
    }
  }, [user])

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-gray-800 text-white border-none shadow-md dark:bg-gray-900">
        <CardHeader className="pb-2 pt-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <CardTitle className="text-2xl font-bold">Agent Assignment Dashboard</CardTitle>
              <p className="text-sm text-gray-300">Track and manage client assignments</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-300">Month:</span>
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger className="w-[160px] bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="All Months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-months">All Months</SelectItem>
                  <SelectItem value="current">Current Month</SelectItem>
                  <SelectItem value="previous">Previous Month</SelectItem>
                  <SelectItem value="jan">January</SelectItem>
                  <SelectItem value="feb">February</SelectItem>
                  <SelectItem value="mar">March</SelectItem>
                  <SelectItem value="apr">April</SelectItem>
                  <SelectItem value="may">May</SelectItem>
                  <SelectItem value="jun">June</SelectItem>
                  <SelectItem value="jul">July</SelectItem>
                  <SelectItem value="aug">August</SelectItem>
                  <SelectItem value="sep">September</SelectItem>
                  <SelectItem value="oct">October</SelectItem>
                  <SelectItem value="nov">November</SelectItem>
                  <SelectItem value="dec">December</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-none shadow-sm dark:bg-gray-800 dark:text-gray-100">
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">{totalClients}</p>
            <p className="text-sm text-muted-foreground dark:text-gray-300">Total Clients</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm dark:bg-gray-800 dark:text-gray-100">
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">{topAgentName}</p>
            <p className="text-sm text-muted-foreground dark:text-gray-300">Top Agent</p>
          </CardContent>
        </Card>
      </div>

      {/* Agent Workload Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4 border-b pb-2 dark:text-gray-100 dark:border-gray-700">
          Agent Workload
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-11 gap-2">
          {agents.map((agent) => (
            <Card key={agent} className="overflow-hidden border-none shadow-sm dark:bg-gray-800">
              <CardContent className="p-4 text-center">
                <p className="font-medium text-sm mb-1 dark:text-gray-300">{agent}</p>
                <p className="text-2xl font-bold dark:text-gray-100">{agentWorkloads[agent.toLowerCase()] || 0}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Add New Clients Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4 border-b pb-2 dark:text-gray-100 dark:border-gray-700">
          Add New Clients
        </h2>
        <Card className="border-none shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="space-y-3">
              <Textarea
                placeholder="Paste client information here..."
                className="min-h-[150px] resize-none focus:ring-2 focus:ring-gray-800 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
                value={clientText}
                onChange={(e) => setClientText(e.target.value)}
              />
              <div className="pt-2">
                <Button
                  variant="default"
                  className="bg-gray-800 hover:bg-gray-700 text-white dark:bg-gray-700 dark:hover:bg-gray-600"
                  onClick={processClientInfo}
                >
                  Process Information
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client Assignment Table */}
      <div>
        <h2 className="text-xl font-semibold mb-4 border-b pb-2 dark:text-gray-100 dark:border-gray-700">
          Client Assignment Table
        </h2>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search for clients by any field..."
            className="pl-10 border-gray-300 focus:border-gray-500 focus:ring-gray-500 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium block mb-1 dark:text-gray-300">Location</label>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="border-gray-300 focus:ring-gray-500 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700">
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-locations">All Locations</SelectItem>
                {uniqueLocations.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1 dark:text-gray-300">Application</label>
            <Select value={applicationFilter} onValueChange={setApplicationFilter}>
              <SelectTrigger className="border-gray-300 focus:ring-gray-500 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700">
                <SelectValue placeholder="All Applications" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-applications">All Applications</SelectItem>
                {uniqueApplications.map((app) => (
                  <SelectItem key={app} value={app}>
                    {app}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1 dark:text-gray-300">Agent</label>
            <Select value={agentFilter} onValueChange={setAgentFilter}>
              <SelectTrigger className="border-gray-300 focus:ring-gray-500 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700">
                <SelectValue placeholder="All Agents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-agents">All Agents</SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent} value={agent.toLowerCase()}>
                    {agent}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1 dark:text-gray-300">Rows Per Page</label>
            <Select value={rowsPerPage} onValueChange={setRowsPerPage}>
              <SelectTrigger className="border-gray-300 focus:ring-gray-500 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end gap-2">
            <Button
              variant="outline"
              className="flex-1 border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800 dark:text-gray-100"
              onClick={resetFilters}
            >
              Reset Filters
            </Button>
            <Button
              variant="default"
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              Apply Filters
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-md overflow-hidden shadow-sm dark:border-gray-700">
          {loading ? (
            <div className="p-8 text-center">
              <p>Loading client assignments...</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Age
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Work
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Application
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Assigned Agent
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  {isAdmin && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredClients.slice(0, Number.parseInt(rowsPerPage)).map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-2 whitespace-nowrap text-sm dark:text-gray-200">
                      {editingCell.clientId === client.id && editingCell.field === "name" ? (
                        <div className="flex items-center space-x-2">
                          <Input
                            ref={editInputRef}
                            value={editingCell.value}
                            onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                            className="py-1 h-8 text-sm"
                            autoFocus
                          />
                          <div className="flex space-x-1">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={saveEdit}>
                              ✓
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={cancelEdit}>
                              ✕
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 rounded"
                          onClick={() => startEdit(client, "name")}
                        >
                          {client.name}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm dark:text-gray-200">
                      {editingCell.clientId === client.id && editingCell.field === "age" ? (
                        <div className="flex items-center space-x-2">
                          <Input
                            value={editingCell.value}
                            onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                            className="py-1 h-8 text-sm"
                            autoFocus
                          />
                          <div className="flex space-x-1">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={saveEdit}>
                              ✓
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={cancelEdit}>
                              ✕
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 rounded"
                          onClick={() => startEdit(client, "age")}
                        >
                          {client.age}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm dark:text-gray-200">
                      {editingCell.clientId === client.id && editingCell.field === "location" ? (
                        <div className="flex items-center space-x-2">
                          <Input
                            value={editingCell.value}
                            onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                            className="py-1 h-8 text-sm"
                            autoFocus
                          />
                          <div className="flex space-x-1">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={saveEdit}>
                              ✓
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={cancelEdit}>
                              ✕
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 rounded"
                          onClick={() => startEdit(client, "location")}
                        >
                          {client.location}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm dark:text-gray-200">
                      {editingCell.clientId === client.id && editingCell.field === "work" ? (
                        <div className="flex items-center space-x-2">
                          <Input
                            value={editingCell.value}
                            onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                            className="py-1 h-8 text-sm"
                            autoFocus
                          />
                          <div className="flex space-x-1">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={saveEdit}>
                              ✓
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={cancelEdit}>
                              ✕
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 rounded"
                          onClick={() => startEdit(client, "work")}
                        >
                          {client.work}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm dark:text-gray-200">
                      {editingCell.clientId === client.id && editingCell.field === "application" ? (
                        <div className="flex items-center space-x-2">
                          <Input
                            value={editingCell.value}
                            onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                            className="py-1 h-8 text-sm"
                            autoFocus
                          />
                          <div className="flex space-x-1">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={saveEdit}>
                              ✓
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={cancelEdit}>
                              ✕
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 rounded"
                          onClick={() => startEdit(client, "application")}
                        >
                          {client.application}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm dark:text-gray-200">
                      {editingCell.clientId === client.id && editingCell.field === "assignedAgent" ? (
                        <div className="flex items-center space-x-2">
                          <Select
                            value={editingCell.value}
                            onValueChange={(value) => setEditingCell({ ...editingCell, value })}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue placeholder="Select agent" />
                            </SelectTrigger>
                            <SelectContent>
                              {agents.map((agent) => (
                                <SelectItem key={agent} value={agent}>
                                  {agent}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="flex space-x-1">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={saveEdit}>
                              ✓
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={cancelEdit}>
                              ✕
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 rounded"
                          onClick={() => startEdit(client, "assignedAgent")}
                        >
                          {client.assignedAgent}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm dark:text-gray-200">
                      {editingCell.clientId === client.id && editingCell.field === "date" ? (
                        <div className="flex items-center space-x-2">
                          <Input
                            type="date"
                            value={editingCell.value}
                            onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                            className="py-1 h-8 text-sm"
                            autoFocus
                          />
                          <div className="flex space-x-1">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={saveEdit}>
                              ✓
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={cancelEdit}>
                              ✕
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 rounded"
                          onClick={() => startEdit(client, "date")}
                        >
                          {client.date}
                        </div>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20"
                          onClick={() => handleDeleteClient(client.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
