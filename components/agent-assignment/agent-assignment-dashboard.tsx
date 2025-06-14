"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Trash2, Calendar, Users, Trophy, Sparkles, Maximize2, Minimize2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import type { Client } from "@/types/client"
import { db } from "@/lib/firebase"
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  getDoc,
  setDoc,
} from "firebase/firestore"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Sample agent names - we'll use these for display and tracking
const agents = ["Cuu", "Jhe", "Kel", "Ken", "Kyrie", "Lovely", "Mar", "Primo", "Vivian"]

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

// Interface for agent workload stats
interface AgentWorkload {
  total: number
  daily: number
}

// Floating particles component for the Top Agent card
const FloatingParticles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 15 }).map((_, i) => (
        <div
          key={i}
          className="absolute animate-float"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${3 + Math.random() * 7}s`,
          }}
        >
          <Sparkles className="h-3 w-3 text-yellow-400 opacity-70" />
        </div>
      ))}
    </div>
  )
}

// Confetti animation component
const ConfettiAnimation = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Confetti particles
    const particles: any[] = []
    const particleCount = 100
    const gravity = 0.3
    const colors = [
      "#f44336",
      "#e91e63",
      "#9c27b0",
      "#673ab7",
      "#3f51b5",
      "#2196f3",
      "#03a9f4",
      "#00bcd4",
      "#009688",
      "#4CAF50",
      "#8BC34A",
      "#CDDC39",
      "#FFEB3B",
      "#FFC107",
      "#FF9800",
      "#FF5722",
    ]

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 5 + 1,
        speed: Math.random() * 2 + 1,
        angle: Math.random() * 6.28,
        rotation: Math.random() * 0.2 - 0.1,
        rotationSpeed: Math.random() * 0.01 - 0.005,
      })
    }

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        // Update position
        p.x += Math.sin(p.angle) * p.speed
        p.y += Math.cos(p.angle) * p.speed + gravity
        p.angle += p.rotation

        // Draw particle
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()

        // Reset if out of bounds
        if (p.y > canvas.height) {
          particles[i] = {
            x: Math.random() * canvas.width,
            y: -10,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: Math.random() * 5 + 1,
            speed: Math.random() * 2 + 1,
            angle: Math.random() * 6.28,
            rotation: Math.random() * 0.2 - 0.1,
            rotationSpeed: Math.random() * 0.01 - 0.005,
          }
        }
      }

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      // Cleanup if needed
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-10" />
}

export default function AgentAssignmentDashboard() {
  const [searchQuery, setSearchQuery] = useState("")
  const [clientText, setClientText] = useState("")
  const [clients, setClients] = useState<ClientAssignment[]>([])
  const [locationFilter, setLocationFilter] = useState("all-locations")
  const [applicationFilter, setApplicationFilter] = useState("all-applications")
  const [agentFilter, setAgentFilter] = useState("all-agents")
  const [monthFilter, setMonthFilter] = useState("all-months")
  const [rowsPerPage, setRowsPerPage] = useState("20")
  const [filteredClients, setFilteredClients] = useState<ClientAssignment[]>([])
  const [editingCell, setEditingCell] = useState<EditingCell>({ clientId: null, field: null, value: "" })
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  // Check if current user is an admin based on their email or role
  const [isAdmin, setIsAdmin] = useState(false)
  const [showApplicationColumn, setShowApplicationColumn] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [isCardHovered, setIsCardHovered] = useState(false)
  const [topAgentTitle, setTopAgentTitle] = useState<string>("TOP PERFORMING AGENT")
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false)
  const [dateFilter, setDateFilter] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const [uniqueLocations, setUniqueLocations] = useState<string[]>([])
  const [uniqueApplications, setUniqueApplications] = useState<string[]>([])

  const editInputRef = useRef<HTMLInputElement>(null)

  const { user } = useAuth()
  const { toast } = useToast()

  // Get current username from email (before @)
  const currentAgent = user?.email ? user.email.split("@")[0] : ""

  // Calculate dashboard stats
  const totalClients = clients.length

  const [agentWorkloads, setAgentWorkloads] = useState<Record<string, AgentWorkload>>({})

  // Calculate total daily clients
  const totalDailyClients = Object.values(agentWorkloads).reduce((sum, agent) => sum + agent.daily, 0)

  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

  // New state for expanded table view
  const [isTableExpanded, setIsTableExpanded] = useState<boolean>(false)
  const tableContainerRef = useRef<HTMLDivElement>(null)

  const [showExportModal, setShowExportModal] = useState(false)
  const [exportOptions, setExportOptions] = useState({
    includeApplication: true,
    dateRange: "all" as "all" | "current-month" | "custom",
    customStartDate: "",
    customEndDate: "",
    selectedAgents: [] as string[],
    selectedColumns: {
      name: true,
      age: true,
      location: true,
      work: true,
      application: true,
      assignedAgent: true,
      date: true,
    },
  })

  // Calculate agent workloads
  const calculateAgentWorkloads = (): Record<string, AgentWorkload> => {
    const today = new Date().toISOString().split("T")[0] // Format: YYYY-MM-DD

    return agents.reduce(
      (acc, agent) => {
        const agentName = agent.toLowerCase()
        const agentClients = clients.filter((client) => client.assignedAgent.toLowerCase() === agentName)

        // If date filter is applied
        if (dateFilter) {
          const selectedDate = new Date(dateFilter)
          // Create first day of the month
          const firstDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
          const firstDayString = firstDayOfMonth.toISOString().split("T")[0]

          // Daily: Only clients added on the exact selected date
          const clientsOnSelectedDate = agentClients.filter((client) => client.date === dateFilter)

          // Total: Clients from first day of month to selected date
          const clientsInRange = agentClients.filter((client) => {
            const clientDate = client.date
            return clientDate >= firstDayString && clientDate <= dateFilter
          })

          acc[agentName] = {
            total: clientsInRange.length,
            daily: clientsOnSelectedDate.length,
          }
        } else {
          // Without date filter, show all-time total and today's clients
          acc[agentName] = {
            total: agentClients.length,
            daily: agentClients.filter((client) => client.date === today).length,
          }
        }

        return acc
      },
      {} as Record<string, AgentWorkload>,
    )
  }

  // Find top agent
  const findTopAgent = (): string => {
    const workloads = Object.entries(agentWorkloads)
    if (workloads.length === 0) return "-"

    const sorted = workloads.sort((a, b) => b[1].total - a[1].total)
    if (sorted[0][1].total === 0) return "-"

    return agents.find((a) => a.toLowerCase() === sorted[0][0]) || "-"
  }

  const topAgentName = findTopAgent()

  // Get top agent's stats
  const getTopAgentStats = (): { total: number; daily: number } => {
    const topAgentLower = topAgentName.toLowerCase()
    return agentWorkloads[topAgentLower] || { total: 0, daily: 0 }
  }

  const topAgentStats = getTopAgentStats()

  // Update workloads when date filter changes
  useEffect(() => {
    setAgentWorkloads(calculateAgentWorkloads())
  }, [dateFilter, clients])

  // Trigger confetti animation when component mounts
  useEffect(() => {
    // Short delay to ensure the card is rendered
    const timer = setTimeout(() => {
      setShowConfetti(true)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

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

  // Load expanded state from localStorage on component mount
  useEffect(() => {
    const savedExpandedState = localStorage.getItem("clientTableExpanded")
    if (savedExpandedState !== null) {
      setIsTableExpanded(savedExpandedState === "true")
    }
  }, [])

  // Save expanded state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("clientTableExpanded", isTableExpanded.toString())
  }, [isTableExpanded])

  // Scroll to table when expanded
  useEffect(() => {
    if (isTableExpanded && tableContainerRef.current) {
      setTimeout(() => {
        tableContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 100)
    }
  }, [isTableExpanded])

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

    // Set processing state to true when starting
    setIsProcessing(true)

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
        setIsProcessing(false) // Reset processing state on error
        return
      }

      // Check for duplicate entries - strict comparison for exact duplicates only
      const isDuplicate = clients.some((client) => {
        // Normalize all values for comparison
        const normalizedName = name.toLowerCase().trim()
        const normalizedClientName = client.name.toLowerCase().trim()

        const normalizedAge = age.trim()
        const normalizedClientAge = client.age.trim()

        const normalizedLocation = location.toLowerCase().trim()
        const normalizedClientLocation = client.location.toLowerCase().trim()

        const normalizedWork = work.toLowerCase().trim()
        const normalizedClientWork = client.work.toLowerCase().trim()

        const normalizedApplication = application.toLowerCase().trim()
        const normalizedClientApplication = client.application.toLowerCase().trim()

        // Check if ALL fields match exactly (100% duplicate)
        return (
          normalizedName === normalizedClientName &&
          normalizedAge === normalizedClientAge &&
          normalizedLocation === normalizedClientLocation &&
          normalizedWork === normalizedClientWork &&
          normalizedApplication === normalizedClientApplication
        )
      })

      if (isDuplicate) {
        toast({
          title: "Duplicate Entry Rejected",
          description: `This exact client information already exists in the database.`,
          variant: "destructive",
        })
        setIsProcessing(false) // Reset processing state on error
        return
      }

      // Check if it's similar but not identical (has the same name but other differences)
      const isSimilar = clients.some((client) => {
        // Check if name matches but at least one other field is different
        const nameMatches = client.name.toLowerCase().trim() === name.toLowerCase().trim()

        if (!nameMatches) return false

        const ageMatches = client.age.trim() === age.trim()
        const locationMatches = client.location.toLowerCase().trim() === location.toLowerCase().trim()
        const workMatches = client.work.toLowerCase().trim() === work.toLowerCase().trim()
        const applicationMatches = client.application.toLowerCase().trim() === application.toLowerCase().trim()

        // Return true if name matches but at least one other field is different
        return nameMatches && !(ageMatches && locationMatches && workMatches && applicationMatches)
      })

      if (isSimilar) {
        console.log("Similar entry detected but will be added")
        toast({
          title: "Similar Entry Detected",
          description: `A client with the same name exists but has different details. This entry will be added.`,
          variant: "warning",
        })
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
    } finally {
      // Always reset processing state when done
      setIsProcessing(false)
    }
  }

  // Toggle expanded table view
  const toggleTableExpanded = () => {
    setIsTableExpanded(!isTableExpanded)
  }

  const resetFilters = () => {
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

  // Handle bulk deletion of selected clients
  const handleBulkDelete = async () => {
    if (selectedClients.length === 0) {
      toast({
        title: "No Clients Selected",
        description: "Please select at least one client to delete",
        variant: "destructive",
      })
      return
    }

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
        setClients((prevClients) => prevClients.filter((client) => !selectedClients.includes(client.id)))
        localStorage.setItem(
          "assignedClients",
          JSON.stringify(clients.filter((client) => !selectedClients.includes(client.id))),
        )
      } else {
        // Delete from Firestore
        for (const clientId of selectedClients) {
          const clientRef = doc(db, "clientAssignments", clientId)
          await deleteDoc(clientRef)
        }
      }

      toast({
        title: "Clients Deleted",
        description: `${selectedClients.length} clients have been deleted successfully`,
      })

      // Reset selection
      setSelectedClients([])
      setSelectAll(false)
    } catch (error) {
      console.error("Error deleting clients:", error)
      toast({
        title: "Error",
        description: "Failed to delete selected clients",
        variant: "destructive",
      })
    }
  }

  // Toggle selection of a single client
  const toggleClientSelection = (clientId: string) => {
    setSelectedClients((prev) => {
      if (prev.includes(clientId)) {
        return prev.filter((id) => id !== clientId)
      } else {
        return [...prev, clientId]
      }
    })
  }

  // Toggle selection of all clients
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedClients([])
    } else {
      setSelectedClients(filteredClients.map((client) => client.id))
    }
    setSelectAll(!selectAll)
  }

  // Effect to update selectAll state when selections change
  useEffect(() => {
    if (filteredClients.length > 0 && selectedClients.length === filteredClients.length) {
      setSelectAll(true)
    } else {
      setSelectAll(false)
    }
  }, [selectedClients, filteredClients])

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

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.getDate()}/${date.getMonth() + 1}`
  }

  // Show Application column by default when expanded
  useEffect(() => {
    if (isTableExpanded) {
      setShowApplicationColumn(true)
    }
  }, [isTableExpanded])

  // Export filtered clients to CSV
  const exportToCSV = () => {
    let dataToExport = [...filteredClients]

    // Apply additional export filters
    if (exportOptions.dateRange === "current-month") {
      const currentDate = new Date()
      const currentMonth = currentDate.getMonth()
      const currentYear = currentDate.getFullYear()

      dataToExport = dataToExport.filter((client) => {
        const clientDate = new Date(client.date)
        return clientDate.getMonth() === currentMonth && clientDate.getFullYear() === currentYear
      })
    } else if (exportOptions.dateRange === "custom" && exportOptions.customStartDate && exportOptions.customEndDate) {
      dataToExport = dataToExport.filter((client) => {
        const clientDate = client.date
        return clientDate >= exportOptions.customStartDate && clientDate <= exportOptions.customEndDate
      })
    }

    // Filter by selected agents
    if (exportOptions.selectedAgents.length > 0) {
      dataToExport = dataToExport.filter((client) =>
        exportOptions.selectedAgents.includes(client.assignedAgent.toLowerCase()),
      )
    }

    // Prepare CSV headers based on selected columns
    const headers = []
    if (exportOptions.selectedColumns.name) headers.push("Name")
    if (exportOptions.selectedColumns.age) headers.push("Age")
    if (exportOptions.selectedColumns.location) headers.push("Location")
    if (exportOptions.selectedColumns.work) headers.push("Work")
    if (exportOptions.selectedColumns.application && exportOptions.includeApplication) headers.push("Application")
    if (exportOptions.selectedColumns.assignedAgent) headers.push("Assigned Agent")
    if (exportOptions.selectedColumns.date) headers.push("Date")

    // Prepare CSV data
    const csvData = dataToExport.map((client) => {
      const row = []
      if (exportOptions.selectedColumns.name) row.push(`"${client.name}"`)
      if (exportOptions.selectedColumns.age) row.push(`"${client.age}"`)
      if (exportOptions.selectedColumns.location) row.push(`"${client.location}"`)
      if (exportOptions.selectedColumns.work) row.push(`"${client.work}"`)
      if (exportOptions.selectedColumns.application && exportOptions.includeApplication)
        row.push(`"${client.application}"`)
      if (exportOptions.selectedColumns.assignedAgent) row.push(`"${client.assignedAgent}"`)
      if (exportOptions.selectedColumns.date) row.push(`"${client.date}"`)
      return row.join(",")
    })

    // Create CSV content
    const csvContent = [headers.join(","), ...csvData].join("\n")

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)

    // Generate filename based on filters
    let filename = "client-assignments"
    if (exportOptions.dateRange === "current-month") {
      const currentDate = new Date()
      const monthName = currentDate.toLocaleDateString("en-US", { month: "short" })
      filename += `-${monthName}-${currentDate.getFullYear()}`
    } else if (exportOptions.dateRange === "custom") {
      filename += `-${exportOptions.customStartDate}-to-${exportOptions.customEndDate}`
    }
    filename += ".csv"

    link.setAttribute("download", filename)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setShowExportModal(false)
    toast({
      title: "Export Successful",
      description: `Exported ${dataToExport.length} client records to ${filename}`,
    })
  }

  // Save top agent title to Firestore
  const saveTopAgentTitle = async (title: string) => {
    if (!user) {
      // Fallback to localStorage if not authenticated
      localStorage.setItem("topAgentTitle", title)
      return
    }

    try {
      await setDoc(doc(db, "settings", "topAgentTitle"), {
        title,
        updatedAt: serverTimestamp(),
        updatedBy: user.email,
      })

      toast({
        title: "Title Updated",
        description: "Top agent title has been saved successfully",
      })
    } catch (error) {
      console.error("Error saving top agent title:", error)
      toast({
        title: "Error",
        description: "Failed to save title",
        variant: "destructive",
      })
    }
  }

  // Load top agent title from Firestore on component mount
  useEffect(() => {
    if (!user) return

    const loadTopAgentTitle = async () => {
      try {
        const titleDoc = await getDoc(doc(db, "settings", "topAgentTitle"))
        if (titleDoc.exists()) {
          setTopAgentTitle(titleDoc.data().title || "TOP PERFORMING AGENT")
        }
      } catch (error) {
        console.error("Error loading top agent title:", error)
      }
    }

    loadTopAgentTitle()
  }, [user])

  // Load title from localStorage as fallback
  useEffect(() => {
    if (!user) {
      const savedTitle = localStorage.getItem("topAgentTitle")
      if (savedTitle) {
        setTopAgentTitle(savedTitle)
      }
    }
  }, [user])

  // Export Options Modal
  const ExportOptionsModal = () =>
    showExportModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
          <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">Export Options</h3>

          {/* Date Range Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 dark:text-gray-300">Date Range</label>
            <Select
              value={exportOptions.dateRange}
              onValueChange={(value: "all" | "current-month" | "custom") =>
                setExportOptions((prev) => ({ ...prev, dateRange: value }))
              }
            >
              <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="current-month">Current Month</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Date Range */}
          {exportOptions.dateRange === "custom" && (
            <div className="mb-4 space-y-2">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Start Date</label>
                <Input
                  type="date"
                  value={exportOptions.customStartDate}
                  onChange={(e) => setExportOptions((prev) => ({ ...prev, customStartDate: e.target.value }))}
                  className="dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">End Date</label>
                <Input
                  type="date"
                  value={exportOptions.customEndDate}
                  onChange={(e) => setExportOptions((prev) => ({ ...prev, customEndDate: e.target.value }))}
                  className="dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            </div>
          )}

          {/* Agent Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 dark:text-gray-300">Agents (leave empty for all)</label>
            <Select
              value={exportOptions.selectedAgents.length > 0 ? exportOptions.selectedAgents[0] : "all-agents"}
              onValueChange={(value) => {
                if (value === "all-agents") {
                  setExportOptions((prev) => ({ ...prev, selectedAgents: [] }))
                } else {
                  setExportOptions((prev) => ({ ...prev, selectedAgents: [value] }))
                }
              }}
            >
              <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600">
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

          {/* Column Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 dark:text-gray-300">Columns to Include</label>
            <div className="space-y-2">
              {Object.entries(exportOptions.selectedColumns).map(([key, value]) => (
                <label key={key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) =>
                      setExportOptions((prev) => ({
                        ...prev,
                        selectedColumns: { ...prev.selectedColumns, [key]: e.target.checked },
                      }))
                    }
                    className="rounded border-gray-300 text-gray-900 focus:ring-gray-500 dark:border-gray-600 dark:bg-gray-700"
                  />
                  <span className="text-sm dark:text-gray-300 capitalize">{key}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setShowExportModal(false)}>
              Cancel
            </Button>
            <Button onClick={exportToCSV} className="bg-gray-800 hover:bg-gray-700 text-white">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>
    )

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
            <p className="text-3xl font-bold">{totalDailyClients}</p>
            <p className="text-sm text-muted-foreground dark:text-gray-300">Total Daily Clients</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Agent Card - Redesigned */}
      <div
        className={`relative overflow-hidden transition-all duration-300 ${isCardHovered ? "transform scale-105" : ""}`}
        onMouseEnter={() => setIsCardHovered(true)}
        onMouseLeave={() => setIsCardHovered(false)}
      >
        {/* Animated confetti */}
        {showConfetti && <ConfettiAnimation />}

        {/* Floating particles */}
        <FloatingParticles />

        <Card className="border-none shadow-lg relative bg-gradient-to-r from-gray-50 to-yellow-50 dark:from-gray-800 dark:to-gray-700 overflow-hidden">
          {/* Ribbon banner */}
          <div className="absolute -left-8 top-5 bg-red-600 text-white py-1 px-10 transform -rotate-45 shadow-md z-20">
            <span className="font-bold text-xs">CHAMPION</span>
          </div>

          {/* Number 1 badge */}
          <div className="absolute top-3 right-3 bg-yellow-500 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg z-20 animate-pulse-slow">
            <span className="font-bold text-lg">#1</span>
          </div>

          <CardContent className="py-10 text-center relative z-10">
            {/* Trophy icon */}
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Trophy className="h-12 w-12 text-yellow-500 animate-float-slow" />
                <div className="absolute inset-0 bg-yellow-400 blur-md opacity-30 rounded-full animate-pulse-slow"></div>
              </div>
            </div>

            {/* Agent name with effects */}
            <div className="relative">
              <p className="text-4xl font-extrabold uppercase mb-2 text-yellow-600">{topAgentName}</p>
            </div>

            {isEditingTitle ? (
              <div className="mt-3 flex items-center justify-center gap-2">
                <Input
                  value={topAgentTitle}
                  onChange={(e) => setTopAgentTitle(e.target.value)}
                  className="h-8 text-sm w-48 text-center"
                  autoFocus
                />
                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={async () => {
                      await saveTopAgentTitle(topAgentTitle)
                      setIsEditingTitle(false)
                    }}
                  >
                    ✓
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => {
                      setTopAgentTitle("TOP PERFORMING AGENT")
                      setIsEditingTitle(false)
                    }}
                  >
                    ✕
                  </Button>
                </div>
              </div>
            ) : (
              <div className="relative mt-3">
                <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">{topAgentTitle}</p>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -right-8 top-1/2 transform -translate-y-1/2 h-6 w-6 opacity-50 hover:opacity-100"
                    onClick={() => setIsEditingTitle(true)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                    </svg>
                  </Button>
                )}
              </div>
            )}

            {/* Stats */}
            <div className="mt-4 flex justify-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{topAgentStats.total}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">TOTAL CLIENTS</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{topAgentStats.daily}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">DAILY CLIENTS</p>
              </div>
            </div>
          </CardContent>

          {/* Shimmer border effect */}
          <div className="absolute inset-0 border-2 border-transparent bg-gradient-to-r from-transparent via-yellow-300 to-transparent bg-[length:200%_100%] animate-border-shimmer pointer-events-none"></div>
        </Card>
      </div>

      {/* Agent Workload Section - Hidden when table is expanded */}
      <div className={`transition-all duration-500 ${isTableExpanded ? "hidden" : "block"}`}>
        <h2 className="text-xl font-semibold mb-4 border-b pb-2 dark:text-gray-100 dark:border-gray-700">
          Agent Workload
        </h2>

        {/* Legend */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4 text-blue-500" />
              <span className="text-gray-600 dark:text-gray-300">
                {dateFilter ? `Clients on ${formatDate(dateFilter)}` : "Daily Added"}
              </span>
            </div>
            <div className="flex items-center gap-1 ml-4">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600 dark:text-gray-300">
                {dateFilter ? `From month start to ${formatDate(dateFilter)}` : "Total Clients"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Input
                type="date"
                className="w-40 h-8 text-sm"
                value={dateFilter || ""}
                onChange={(e) => setDateFilter(e.target.value || null)}
              />
            </div>
            {dateFilter && (
              <Button variant="outline" size="sm" onClick={() => setDateFilter(null)} className="h-8 text-xs">
                Clear Date
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {/* First row of agents */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {agents.slice(0, Math.ceil(agents.length / 2)).map((agent) => {
              const workload = agentWorkloads[agent.toLowerCase()] || { total: 0, daily: 0 }

              return (
                <Card key={agent} className="overflow-hidden border-none shadow-sm dark:bg-gray-800">
                  <CardContent className="p-4">
                    <p className="font-medium text-base mb-3 text-center dark:text-gray-300">{agent}</p>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-blue-500 mr-2" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Daily:</span>
                        </div>
                        <span className="font-semibold text-lg">{workload.daily}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 text-gray-500 mr-2" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Total:</span>
                        </div>
                        <span className="font-semibold text-lg">{workload.total}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Second row of agents */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {agents.slice(Math.ceil(agents.length / 2)).map((agent) => {
              const workload = agentWorkloads[agent.toLowerCase()] || { total: 0, daily: 0 }

              return (
                <Card key={agent} className="overflow-hidden border-none shadow-sm dark:bg-gray-800">
                  <CardContent className="p-4">
                    <p className="font-medium text-base mb-3 text-center dark:text-gray-300">{agent}</p>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-blue-500 mr-2" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Daily:</span>
                        </div>
                        <span className="font-semibold text-lg">{workload.daily}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 text-gray-500 mr-2" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Total:</span>
                        </div>
                        <span className="font-semibold text-lg">{workload.total}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>

      {/* Add New Clients Section - Hidden when table is expanded */}
      <div className={`transition-all duration-500 ${isTableExpanded ? "hidden" : "block"}`}>
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
                disabled={isProcessing}
              />
              <div className="pt-2">
                <Button
                  variant="default"
                  className="bg-gray-800 hover:bg-gray-700 text-white dark:bg-gray-700 dark:hover:bg-gray-600"
                  onClick={processClientInfo}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    "Process Information"
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client Assignment Table */}
      <div
        ref={tableContainerRef}
        className={`transition-all duration-500 ease-in-out ${
          isTableExpanded ? "fixed inset-0 z-50 bg-background p-4 flex flex-col overflow-hidden" : ""
        }`}
      >
        <div className={`flex justify-between items-center ${isTableExpanded ? "p-4 pb-2" : "mb-4"}`}>
          <h2 className="text-xl font-semibold border-b pb-2 dark:text-gray-100 dark:border-gray-700">
            Client Assignment Table
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExportModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white border-green-600"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={toggleTableExpanded} className="ml-2">
                    {isTableExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    <span className="ml-2">{isTableExpanded ? "Collapse" : "Expand"}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isTableExpanded ? "Collapse table view" : "Expand table view"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Search Bar */}
        <div className={`relative ${isTableExpanded ? "px-4 mb-2" : "mb-4"}`}>
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search for clients by any field..."
            className="pl-10 border-gray-300 focus:border-gray-500 focus:ring-gray-500 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${isTableExpanded ? "px-4 mb-2" : "mb-4"}`}>
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
                <SelectValue placeholder="20" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="200">200</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1 dark:text-gray-300">Application Column</label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowApplicationColumn(!showApplicationColumn)}
              className="w-full border-gray-300 focus:ring-gray-500 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
            >
              {isTableExpanded && showApplicationColumn
                ? "Hide Application"
                : showApplicationColumn
                  ? "Hide Application"
                  : "Show Application"}
            </Button>
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

        {/* Bulk Actions */}
        {isAdmin && selectedClients.length > 0 && (
          <div className={`flex justify-between items-center ${isTableExpanded ? "px-4 mb-2" : "mb-4"}`}>
            <div className="text-sm">
              <span className="font-medium">{selectedClients.length}</span> clients selected
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected
            </Button>
          </div>
        )}

        {/* Table */}
        <div
          className={`border rounded-md overflow-auto shadow-sm dark:border-gray-700 ${
            isTableExpanded ? "flex-1 mx-4 mt-0 mb-4" : ""
          }`}
        >
          {loading ? (
            <div className="p-8 text-center">
              <p>Loading client assignments...</p>
            </div>
          ) : (
            <table className="w-full divide-y divide-gray-200 dark:divide-gray-700" style={{ minWidth: "1200px" }}>
              <thead className={`${isTableExpanded ? "bg-gray-800" : "bg-gray-100 dark:bg-gray-800"}`}>
                <tr>
                  {isAdmin && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-gray-900 focus:ring-gray-500 dark:border-gray-600 dark:bg-gray-700"
                      />
                    </th>
                  )}
                  <th
                    className={`px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${isTableExpanded ? "text-sm" : ""}`}
                  >
                    Name
                  </th>
                  <th
                    className={`px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${isTableExpanded ? "text-sm" : ""}`}
                  >
                    Age
                  </th>
                  <th
                    className={`px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${isTableExpanded ? "text-sm" : ""}`}
                  >
                    Location
                  </th>
                  <th
                    className={`px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${isTableExpanded ? "text-sm" : ""}`}
                  >
                    Work
                  </th>
                  {showApplicationColumn && (
                    <th
                      className={`px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${isTableExpanded ? "text-sm" : ""}`}
                    >
                      Application
                    </th>
                  )}
                  <th
                    className={`px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${isTableExpanded ? "text-sm" : ""}`}
                  >
                    Assigned Agent
                  </th>
                  <th
                    className={`px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${isTableExpanded ? "text-sm" : ""}`}
                  >
                    Date
                  </th>
                  {isAdmin && (
                    <th
                      className={`px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${isTableExpanded ? "text-sm" : ""}`}
                    >
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody
                className={`${isTableExpanded ? "bg-gray-900" : "bg-white dark:bg-gray-900"} divide-y divide-gray-200 dark:divide-gray-700`}
              >
                {filteredClients
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, isTableExpanded ? Number.parseInt(rowsPerPage) * 2 : Number.parseInt(rowsPerPage))
                  .map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      {isAdmin && (
                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                          <input
                            type="checkbox"
                            checked={selectedClients.includes(client.id)}
                            onChange={() => toggleClientSelection(client.id)}
                            className="rounded border-gray-300 text-gray-900 focus:ring-gray-500 dark:border-gray-600 dark:bg-gray-700"
                          />
                        </td>
                      )}
                      <td
                        className={`px-4 py-2 whitespace-nowrap dark:text-gray-200 ${isTableExpanded ? "text-base py-3" : "text-sm"}`}
                      >
                        {editingCell.clientId === client.id && editingCell.field === "name" ? (
                          <div className="flex items-center space-x-2">
                            <Input
                              ref={editInputRef}
                              value={editingCell.value}
                              onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                              className={`py-1 text-sm ${isTableExpanded ? "h-10" : "h-8"}`}
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
                      <td
                        className={`px-4 py-2 whitespace-nowrap dark:text-gray-200 ${isTableExpanded ? "text-base py-3" : "text-sm"}`}
                      >
                        {editingCell.clientId === client.id && editingCell.field === "age" ? (
                          <div className="flex items-center space-x-2">
                            <Input
                              value={editingCell.value}
                              onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                              className={`py-1 text-sm ${isTableExpanded ? "h-10" : "h-8"}`}
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
                      <td
                        className={`px-4 py-2 whitespace-nowrap dark:text-gray-200 ${isTableExpanded ? "text-base py-3" : "text-sm"}`}
                      >
                        {editingCell.clientId === client.id && editingCell.field === "location" ? (
                          <div className="flex items-center space-x-2">
                            <Input
                              value={editingCell.value}
                              onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                              className={`py-1 text-sm ${isTableExpanded ? "h-10" : "h-8"}`}
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
                      <td
                        className={`px-4 py-2 whitespace-nowrap dark:text-gray-200 ${isTableExpanded ? "text-base py-3" : "text-sm"}`}
                      >
                        {editingCell.clientId === client.id && editingCell.field === "work" ? (
                          <div className="flex items-center space-x-2">
                            <Input
                              value={editingCell.value}
                              onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                              className={`py-1 text-sm ${isTableExpanded ? "h-10" : "h-8"}`}
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
                      {showApplicationColumn && (
                        <td
                          className={`px-4 py-2 whitespace-nowrap dark:text-gray-200 ${isTableExpanded ? "text-base py-3" : "text-sm"}`}
                        >
                          {editingCell.clientId === client.id && editingCell.field === "application" ? (
                            <div className="flex items-center space-x-2">
                              <Input
                                value={editingCell.value}
                                onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                                className={`py-1 text-sm ${isTableExpanded ? "h-10" : "h-8"}`}
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
                      )}
                      <td
                        className={`px-4 py-2 whitespace-nowrap dark:text-gray-200 ${isTableExpanded ? "text-base py-3" : "text-sm"}`}
                      >
                        {editingCell.clientId === client.id && editingCell.field === "assignedAgent" ? (
                          <div className="flex items-center space-x-2">
                            <Select
                              value={editingCell.value}
                              onValueChange={(value) => setEditingCell({ ...editingCell, value })}
                            >
                              <SelectTrigger className={`text-sm ${isTableExpanded ? "h-10" : "h-8"}`}>
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
                      <td
                        className={`px-4 py-2 whitespace-nowrap dark:text-gray-200 ${isTableExpanded ? "text-base py-3" : "text-sm"}`}
                      >
                        {editingCell.clientId === client.id && editingCell.field === "date" ? (
                          <div className="flex items-center space-x-2">
                            <Input
                              type="date"
                              value={editingCell.value}
                              onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                              className={`py-1 text-sm ${isTableExpanded ? "h-10" : "h-8"}`}
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

      {/* Export Options Modal */}
      <ExportOptionsModal />
    </div>
  )
}
