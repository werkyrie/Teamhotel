"use client"

import { useState, useEffect, useCallback } from "react"
import { useClientContext } from "@/context/client-context"
import { useAuth } from "@/context/auth-context"
import type { Client, Agent, ClientStatus, Order, Deposit, Withdrawal } from "@/types/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import {
  CalendarIcon,
  AlertCircle,
  UserPlus,
  ArrowUpRight,
  ArrowDownLeft,
  ShoppingCart,
  Clock,
  Search,
  ChevronDown,
  ChevronUp,
  Copy,
  Wallet,
  BarChart3,
  CircleDollarSign,
  CalendarPlus2Icon as CalendarIcon2,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

// Default agents
const DEFAULT_AGENTS = [
  "KY",
  "LOVELY",
  "JHE",
  "VIVIAN",
  "UNO",
  "ANA",
  "AVIANA",
  "KEL",
  "CU",
  "ANNIE",
  "KEN",
  "CINDY",
  "MAR",
  "PRIMO",
  "THAC",
]

interface ClientModalProps {
  mode: "add" | "view" | "edit"
  client: Client | null
  isOpen: boolean
  onClose: () => void
}

export default function ClientModal({ mode, client, isOpen, onClose }: ClientModalProps) {
  const { toast } = useToast()
  const { isViewer } = useAuth()
  const {
    clients,
    orders,
    deposits,
    withdrawals,
    addClient,
    updateClient,
    isShopIdUnique,
    generateOrderId,
    generateDepositId,
    generateWithdrawalId,
    addOrder,
    updateOrder,
    deleteOrder,
    addDeposit,
    updateDeposit,
    deleteDeposit,
    addWithdrawal,
    updateWithdrawal,
    deleteWithdrawal,
    loading: contextLoading,
  } = useClientContext()

  // Form state
  const [shopId, setShopId] = useState("")
  const [clientName, setClientName] = useState("")
  const [agent, setAgent] = useState<Agent>("KY")
  const [kycDate, setKycDate] = useState<Date | undefined>(new Date())
  const [status, setStatus] = useState<ClientStatus>("In Process")
  const [notes, setNotes] = useState("")
  const [agents, setAgents] = useState<string[]>(DEFAULT_AGENTS)
  const [newAgent, setNewAgent] = useState("")
  const [showAddAgent, setShowAddAgent] = useState(false)
  const [loading, setLoading] = useState(true)

  // Client orders, deposits, and withdrawals
  const [clientOrders, setClientOrders] = useState<Order[]>([])
  const [clientDeposits, setClientDeposits] = useState<Deposit[]>([])
  const [clientWithdrawals, setClientWithdrawals] = useState<Withdrawal[]>([])

  // Transaction filtering and sorting
  const [transactionType, setTransactionType] = useState<"all" | "orders" | "deposits" | "withdrawals">("all")
  const [transactionSearchTerm, setTransactionSearchTerm] = useState("")
  const [transactionSortField, setTransactionSortField] = useState<"date" | "amount">("date")
  const [transactionSortDirection, setTransactionSortDirection] = useState<"asc" | "desc">("desc")
  const [transactionTimeframe, setTransactionTimeframe] = useState<"all" | "week" | "month" | "quarter" | "year">("all")

  // New order, deposit, withdrawal form state
  const [newOrder, setNewOrder] = useState<Partial<Order>>({
    date: format(new Date(), "yyyy-MM-dd"),
    location: "",
    price: 0,
    status: "Pending",
  })

  const [newDeposit, setNewDeposit] = useState<Partial<Deposit>>({
    date: format(new Date(), "yyyy-MM-dd"),
    amount: 0,
    paymentMode: "Crypto",
  })

  const [newWithdrawal, setNewWithdrawal] = useState<Partial<Withdrawal>>({
    date: format(new Date(), "yyyy-MM-dd"),
    amount: 0,
    paymentMode: "Crypto",
  })

  // Validation state
  const [shopIdError, setShopIdError] = useState("")
  const [clientNameError, setClientNameError] = useState("")
  const [newAgentError, setNewAgentError] = useState("")
  const [formSubmitting, setFormSubmitting] = useState(false)

  // Financial summary
  const [totalDeposits, setTotalDeposits] = useState(0)
  const [totalWithdrawals, setTotalWithdrawals] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)
  const [balance, setBalance] = useState(0)

  // Combined transactions for unified view
  const [allTransactions, setAllTransactions] = useState<Array<Order | Deposit | (Withdrawal & { type: string })>>([])

  // Load custom agents from localStorage
  useEffect(() => {
    try {
      const savedAgents = localStorage.getItem("customAgents")
      if (savedAgents) {
        const customAgents = JSON.parse(savedAgents)
        setAgents([...DEFAULT_AGENTS, ...customAgents])
      }
    } catch (error) {
      console.error("Error parsing custom agents:", error)
    }

    // Set loading to false after a short delay to simulate data loading
    const timer = setTimeout(() => {
      setLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  // Initialize form with client data if in edit or view mode
  useEffect(() => {
    if (client) {
      setLoading(true)

      try {
        setShopId(client.shopId || "")
        setClientName(client.clientName || "")
        setAgent(client.agent || "KY")
        setKycDate(client.kycDate ? new Date(client.kycDate) : undefined)
        setStatus(client.status || "In Process")
        setNotes(client.notes || "")

        // Get client orders, deposits, and withdrawals
        const filteredOrders = orders.filter((order) => order.shopId === client.shopId) || []
        const filteredDeposits = deposits.filter((deposit) => deposit.shopId === client.shopId) || []
        const filteredWithdrawals = withdrawals.filter((withdrawal) => withdrawal.shopId === client.shopId) || []

        setClientOrders(filteredOrders)
        setClientDeposits(filteredDeposits)
        setClientWithdrawals(filteredWithdrawals)

        // Create combined transactions array
        const combinedTransactions = [
          ...filteredOrders.map((order) => ({ ...order, type: "order" })),
          ...filteredDeposits.map((deposit) => ({ ...deposit, type: "deposit" })),
          ...filteredWithdrawals.map((withdrawal) => ({ ...withdrawal, type: "withdrawal" })),
        ]

        // Sort by date (newest first)
        combinedTransactions.sort((a, b) => {
          const dateA = new Date(a.date).getTime()
          const dateB = new Date(b.date).getTime()
          return dateB - dateA
        })

        setAllTransactions(combinedTransactions)

        // Calculate financial summary
        const depositSum = filteredDeposits.reduce((sum, deposit) => sum + (deposit.amount || 0), 0)
        const withdrawalSum = filteredWithdrawals.reduce((sum, withdrawal) => sum + (withdrawal.amount || 0), 0)
        const orderSum = filteredOrders.reduce((sum, order) => sum + (order.price || 0), 0)

        setTotalDeposits(depositSum)
        setTotalWithdrawals(withdrawalSum)
        setTotalOrders(orderSum)
        setBalance(depositSum - withdrawalSum - orderSum)
      } catch (error) {
        console.error("Error processing client data:", error)
        // Set empty arrays as fallback
        setClientOrders([])
        setClientDeposits([])
        setClientWithdrawals([])
        setAllTransactions([])
        setTotalDeposits(0)
        setTotalWithdrawals(0)
        setTotalOrders(0)
        setBalance(0)
      }

      // Set loading to false after a short delay
      const timer = setTimeout(() => {
        setLoading(false)
      }, 500)

      return () => clearTimeout(timer)
    } else {
      // Reset form for add mode
      setShopId("")
      setClientName("")
      setAgent("KY")
      setKycDate(new Date())
      setStatus("In Process")
      setNotes("")
      setClientOrders([])
      setClientDeposits([])
      setClientWithdrawals([])
      setAllTransactions([])
      setTotalDeposits(0)
      setTotalWithdrawals(0)
      setTotalOrders(0)
      setBalance(0)
      setLoading(false)
    }
  }, [client, orders, deposits, withdrawals])

  // Filter transactions based on search, type, and timeframe
  useEffect(() => {
    if (!client) return

    try {
      // Get client orders, deposits, and withdrawals
      const filteredOrders = orders.filter((order) => order.shopId === client.shopId) || []
      const filteredDeposits = deposits.filter((deposit) => deposit.shopId === client.shopId) || []
      const filteredWithdrawals = withdrawals.filter((withdrawal) => withdrawal.shopId === client.shopId) || []

      // Filter by transaction type
      let combinedTransactions = []
      if (transactionType === "all" || transactionType === "orders") {
        combinedTransactions.push(...filteredOrders.map((order) => ({ ...order, type: "order" })))
      }
      if (transactionType === "all" || transactionType === "deposits") {
        combinedTransactions.push(...filteredDeposits.map((deposit) => ({ ...deposit, type: "deposit" })))
      }
      if (transactionType === "all" || transactionType === "withdrawals") {
        combinedTransactions.push(...filteredWithdrawals.map((withdrawal) => ({ ...withdrawal, type: "withdrawal" })))
      }

      // Filter by search term
      if (transactionSearchTerm) {
        const term = transactionSearchTerm.toLowerCase()
        combinedTransactions = combinedTransactions.filter((transaction) => {
          // Check common fields
          if (transaction.shopId?.toLowerCase().includes(term)) return true
          if (transaction.clientName?.toLowerCase().includes(term)) return true
          if (transaction.agent?.toLowerCase().includes(term)) return true

          // Check type-specific fields
          if (transaction.type === "order" && (transaction as Order).location?.toLowerCase().includes(term)) return true
          if (transaction.type === "deposit" && (transaction as Deposit).paymentMode?.toLowerCase().includes(term))
            return true
          if (
            transaction.type === "withdrawal" &&
            (transaction as Withdrawal).paymentMode?.toLowerCase().includes(term)
          )
            return true

          return false
        })
      }

      // Filter by timeframe
      if (transactionTimeframe !== "all") {
        const now = new Date()
        const cutoffDate = new Date()

        switch (transactionTimeframe) {
          case "week":
            cutoffDate.setDate(now.getDate() - 7)
            break
          case "month":
            cutoffDate.setMonth(now.getMonth() - 1)
            break
          case "quarter":
            cutoffDate.setMonth(now.getMonth() - 3)
            break
          case "year":
            cutoffDate.setFullYear(now.getFullYear() - 1)
            break
        }

        combinedTransactions = combinedTransactions.filter((transaction) => {
          const transactionDate = new Date(transaction.date)
          return transactionDate >= cutoffDate
        })
      }

      // Sort transactions
      combinedTransactions.sort((a, b) => {
        if (transactionSortField === "date") {
          const dateA = new Date(a.date).getTime()
          const dateB = new Date(b.date).getTime()
          return transactionSortDirection === "asc" ? dateA - dateB : dateB - dateA
        } else {
          // amount
          let amountA = 0
          let amountB = 0

          if (a.type === "order") amountA = (a as Order).price
          if (a.type === "deposit") amountA = (a as Deposit).amount
          if (a.type === "withdrawal") amountA = (a as Withdrawal).amount

          if (b.type === "order") amountB = (b as Order).price
          if (b.type === "deposit") amountB = (a as Deposit).amount
          if (b.type === "withdrawal") amountB = (a as Withdrawal).amount

          return transactionSortDirection === "asc" ? amountA - amountB : amountB - amountA
        }
      })

      setAllTransactions(combinedTransactions)
    } catch (error) {
      console.error("Error filtering transactions:", error)
      setAllTransactions([])
    }
  }, [
    client,
    orders,
    deposits,
    withdrawals,
    transactionType,
    transactionSearchTerm,
    transactionSortField,
    transactionSortDirection,
    transactionTimeframe,
  ])

  // Validate shop ID (must be unique)
  const validateShopId = useCallback(
    async (id: string) => {
      if (!id) {
        setShopIdError("Shop ID is required")
        return false
      }

      try {
        if (mode === "add") {
          const isUnique = await isShopIdUnique(id)
          if (!isUnique) {
            setShopIdError("Duplicate ID. Please enter another one.")
            return false
          }
        } else if (mode === "edit" && client && id !== client.shopId) {
          const isUnique = await isShopIdUnique(id, client.shopId)
          if (!isUnique) {
            setShopIdError("Duplicate ID. Please enter another one.")
            return false
          }
        }

        setShopIdError("")
        return true
      } catch (error) {
        console.error("Error validating shop ID:", error)
        setShopIdError("Error validating shop ID. Please try again.")
        return false
      }
    },
    [mode, client, isShopIdUnique],
  )

  // Validate client name
  const validateClientName = (name: string) => {
    if (!name) {
      setClientNameError("Client name is required")
      return false
    }

    setClientNameError("")
    return true
  }

  // Validate new agent
  const validateNewAgent = (name: string) => {
    if (!name) {
      setNewAgentError("Agent name is required")
      return false
    }

    if (agents.includes(name)) {
      setNewAgentError("Agent already exists")
      return false
    }

    setNewAgentError("")
    return true
  }

  // Handle adding a new agent
  const handleAddAgent = () => {
    if (!validateNewAgent(newAgent)) {
      return
    }

    // Add to agents list
    const updatedAgents = [...agents, newAgent]
    setAgents(updatedAgents)

    // Set as current agent
    setAgent(newAgent)

    // Save custom agents to localStorage
    const customAgents = updatedAgents.filter((a) => !DEFAULT_AGENTS.includes(a))
    localStorage.setItem("customAgents", JSON.stringify(customAgents))

    // Reset form
    setNewAgent("")
    setShowAddAgent(false)

    toast({
      title: "Agent added",
      description: `Agent ${newAgent} has been added successfully.`,
      variant: "success",
    })
  }

  // Handle form submission
  const handleSubmit = async () => {
    setFormSubmitting(true)

    try {
      // Validate form
      const isShopIdValid = await validateShopId(shopId)
      const isClientNameValid = validateClientName(clientName)

      if (!isShopIdValid || !isClientNameValid) {
        setFormSubmitting(false)
        return
      }

      const formattedKycDate = kycDate ? format(kycDate, "yyyy-MM-dd") : ""

      const clientData: Client = {
        shopId,
        clientName,
        agent,
        kycDate: formattedKycDate,
        status,
        notes,
      }

      if (mode === "add") {
        await addClient(clientData)
        toast({
          title: "Client added",
          description: "The client has been added successfully.",
          variant: "success",
        })
      } else if (mode === "edit" && client) {
        await updateClient(clientData)

        // Update related orders, deposits, and withdrawals with new client info
        if (client.shopId !== shopId || client.clientName !== clientName || client.agent !== agent) {
          const updatePromises = [
            ...clientOrders.map((order) =>
              updateOrder({
                ...order,
                shopId,
                clientName,
                agent,
              }),
            ),
            ...clientDeposits.map((deposit) =>
              updateDeposit({
                ...deposit,
                shopId,
                clientName,
                agent,
              }),
            ),
            ...clientWithdrawals.map((withdrawal) =>
              updateWithdrawal({
                ...withdrawal,
                shopId,
                clientName,
                agent,
              }),
            ),
          ]

          await Promise.all(updatePromises)
        }

        toast({
          title: "Client updated",
          description: "The client has been updated successfully.",
          variant: "success",
        })
      }

      onClose()
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        title: "Error",
        description: "There was an error processing your request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setFormSubmitting(false)
    }
  }

  // Handle adding a new order
  const handleAddOrder = async () => {
    if (!newOrder.location || !newOrder.price) {
      toast({
        title: "Validation error",
        description: "Please fill in all required fields for the order.",
        variant: "destructive",
      })
      return
    }

    try {
      const orderId = await generateOrderId()
      const order: Order = {
        orderId,
        shopId,
        clientName,
        agent,
        date: newOrder.date || format(new Date(), "yyyy-MM-dd"),
        location: newOrder.location || "",
        price: typeof newOrder.price === "number" ? newOrder.price : 0,
        status: newOrder.status as "Pending" | "Processing" | "Completed",
      }

      await addOrder(order)
      setClientOrders([...clientOrders, order])

      // Update financial summary
      setTotalOrders(totalOrders + order.price)
      setBalance(balance - order.price)

      // Reset form
      setNewOrder({
        date: format(new Date(), "yyyy-MM-dd"),
        location: "",
        price: 0,
        status: "Pending",
      })

      toast({
        title: "Order added",
        description: "The order has been added successfully.",
        variant: "success",
      })
    } catch (error) {
      console.error("Error adding order:", error)
      toast({
        title: "Error",
        description: "There was an error adding the order. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle adding a new deposit
  const handleAddDeposit = async () => {
    if (!newDeposit.amount) {
      toast({
        title: "Validation error",
        description: "Please enter a deposit amount.",
        variant: "destructive",
      })
      return
    }

    try {
      const depositId = await generateDepositId()
      const deposit: Deposit = {
        depositId,
        shopId,
        clientName,
        agent,
        date: newDeposit.date || format(new Date(), "yyyy-MM-dd"),
        amount: typeof newDeposit.amount === "number" ? newDeposit.amount : 0,
        paymentMode: newDeposit.paymentMode as "Crypto" | "Online Banking" | "Ewallet",
      }

      await addDeposit(deposit)
      setClientDeposits([...clientDeposits, deposit])

      // Update financial summary
      setTotalDeposits(totalDeposits + deposit.amount)
      setBalance(balance + deposit.amount)

      // Reset form
      setNewDeposit({
        date: format(new Date(), "yyyy-MM-dd"),
        amount: 0,
        paymentMode: "Crypto",
      })

      toast({
        title: "Deposit added",
        description: "The deposit has been added successfully.",
        variant: "success",
      })
    } catch (error) {
      console.error("Error adding deposit:", error)
      toast({
        title: "Error",
        description: "There was an error adding the deposit. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle adding a new withdrawal
  const handleAddWithdrawal = async () => {
    if (!newWithdrawal.amount) {
      toast({
        title: "Validation error",
        description: "Please enter a withdrawal amount.",
        variant: "destructive",
      })
      return
    }

    try {
      const withdrawalId = await generateWithdrawalId()
      const withdrawal: Withdrawal = {
        withdrawalId,
        shopId,
        clientName,
        agent,
        date: newWithdrawal.date || format(new Date(), "yyyy-MM-dd"),
        amount: typeof newWithdrawal.amount === "number" ? newWithdrawal.amount : 0,
        paymentMode: newWithdrawal.paymentMode as "Crypto" | "Online Banking" | "Ewallet",
      }

      await addWithdrawal(withdrawal)
      setClientWithdrawals([...clientWithdrawals, withdrawal])

      // Update financial summary
      setTotalWithdrawals(totalWithdrawals + withdrawal.amount)
      setBalance(balance - withdrawal.amount)

      // Reset form
      setNewWithdrawal({
        date: format(new Date(), "yyyy-MM-dd"),
        amount: 0,
        paymentMode: "Crypto",
      })

      toast({
        title: "Withdrawal added",
        description: "The withdrawal has been added successfully.",
        variant: "success",
      })
    } catch (error) {
      console.error("Error adding withdrawal:", error)
      toast({
        title: "Error",
        description: "There was an error adding the withdrawal. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle deleting an order
  const handleDeleteOrder = async (orderId: string) => {
    if (confirm("Are you sure you want to delete this order?")) {
      try {
        // Find the order to get its price for updating the financial summary
        const orderToDelete = clientOrders.find((order) => order.orderId === orderId)
        if (!orderToDelete) return

        await deleteOrder(orderId)

        // Update state
        const updatedOrders = clientOrders.filter((order) => order.orderId !== orderId)
        setClientOrders(updatedOrders)

        // Update financial summary
        setTotalOrders(totalOrders - orderToDelete.price)
        setBalance(balance + orderToDelete.price)

        toast({
          title: "Order deleted",
          description: "The order has been deleted successfully.",
          variant: "success",
        })
      } catch (error) {
        console.error("Error deleting order:", error)
        toast({
          title: "Error",
          description: "There was an error deleting the order. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  // Handle deleting a deposit
  const handleDeleteDeposit = async (depositId: string) => {
    if (confirm("Are you sure you want to delete this deposit?")) {
      try {
        // Find the deposit to get its amount for updating the financial summary
        const depositToDelete = clientDeposits.find((deposit) => deposit.depositId === depositId)
        if (!depositToDelete) return

        await deleteDeposit(depositId)

        // Update state
        const updatedDeposits = clientDeposits.filter((deposit) => deposit.depositId !== depositId)
        setClientDeposits(updatedDeposits)

        // Update financial summary
        setTotalDeposits(totalDeposits - depositToDelete.amount)
        setBalance(balance - depositToDelete.amount)

        toast({
          title: "Deposit deleted",
          description: "The deposit has been deleted successfully.",
          variant: "success",
        })
      } catch (error) {
        console.error("Error deleting deposit:", error)
        toast({
          title: "Error",
          description: "There was an error deleting the deposit. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  // Handle deleting a withdrawal
  const handleDeleteWithdrawal = async (withdrawalId: string) => {
    if (confirm("Are you sure you want to delete this withdrawal?")) {
      try {
        // Find the withdrawal to get its amount for updating the financial summary
        const withdrawalToDelete = clientWithdrawals.find((withdrawal) => withdrawal.withdrawalId === withdrawalId)
        if (!withdrawalToDelete) return

        await deleteWithdrawal(withdrawalId)

        // Update state
        const updatedWithdrawals = clientWithdrawals.filter((withdrawal) => withdrawal.withdrawalId !== withdrawalId)
        setClientWithdrawals(updatedWithdrawals)

        // Update financial summary
        setTotalWithdrawals(totalWithdrawals - withdrawalToDelete.amount)
        setBalance(balance + withdrawalToDelete.amount)

        toast({
          title: "Withdrawal deleted",
          description: "The withdrawal has been deleted successfully.",
          variant: "success",
        })
      } catch (error) {
        console.error("Error deleting withdrawal:", error)
        toast({
          title: "Error",
          description: "There was an error deleting the withdrawal. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-500"
      case "Inactive":
        return "bg-gray-500"
      case "In Process":
        return "bg-yellow-500"
      case "Eliminated":
        return "bg-red-500"
      default:
        return "bg-blue-500"
    }
  }

  // Get order status badge color
  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-500"
      case "Processing":
        return "bg-blue-500"
      case "Pending":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
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

  // Get transaction type badge color
  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case "order":
        return "bg-blue-500"
      case "deposit":
        return "bg-green-500"
      case "withdrawal":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  // Get transaction type icon
  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case "order":
        return <ShoppingCart className="h-4 w-4" />
      case "deposit":
        return <ArrowDownLeft className="h-4 w-4" />
      case "withdrawal":
        return <ArrowUpRight className="h-4 w-4" />
      default:
        return null
    }
  }

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  // Format date for display
  const formatDate = (dateString: string | Date): string => {
    if (!dateString) return "Not available"

    try {
      const date = typeof dateString === "string" ? new Date(dateString) : dateString
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch (e) {
      return "Invalid date"
    }
  }

  // Copy text to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: `${text} has been copied to your clipboard.`,
      variant: "success",
    })
  }

  // Disable future dates in date picker
  const disableFutureDates = (date: Date) => {
    return date > new Date()
  }

  // Render loading skeleton
  if (loading || contextLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-full mt-2" />
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // Render view mode with redesigned UI
  if (mode === "view") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0">
          <div className="flex flex-col md:flex-row h-full">
            {/* Sidebar with client info */}
            <div className="w-full md:w-1/3 bg-slate-50 dark:bg-slate-900 p-6 border-r border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-6">
                <DialogTitle className="text-xl font-bold">Client Profile</DialogTitle>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <span className="sr-only">Close</span>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-6">
                {/* Client ID and Copy button */}
                <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Shop ID</div>
                    <div className="font-medium">{shopId}</div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(shopId)} className="h-8 w-8">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                {/* Client Status */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Status</div>
                  <Badge className={cn("px-3 py-1", getStatusColor(status))}>{status}</Badge>
                </div>

                {/* Client Details */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-4">
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Client Name</div>
                    <div className="font-medium">{clientName}</div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Agent</div>
                    <div className="font-medium">{agent}</div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">KYC Date</div>
                    <div className="font-medium">{kycDate ? formatDate(kycDate) : "N/A"}</div>
                  </div>

                  {notes && (
                    <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Notes</div>
                      <div className="text-sm mt-1 bg-slate-100 dark:bg-slate-700 p-2 rounded">{notes}</div>
                    </div>
                  )}
                </div>

                {/* Financial Summary */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                  <h3 className="text-sm font-medium mb-3 flex items-center">
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Financial Summary
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded">
                      <div className="text-xs text-slate-500 dark:text-slate-400">Deposits</div>
                      <div className="text-lg font-bold text-green-600 dark:text-green-500">
                        {formatCurrency(totalDeposits)}
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded">
                      <div className="text-xs text-slate-500 dark:text-slate-400">Withdrawals</div>
                      <div className="text-lg font-bold text-red-600 dark:text-red-500">
                        {formatCurrency(totalWithdrawals)}
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded">
                      <div className="text-xs text-slate-500 dark:text-slate-400">Orders</div>
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-500">
                        {formatCurrency(totalOrders)}
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded">
                      <div className="text-xs text-slate-500 dark:text-slate-400">Balance</div>
                      <div
                        className={cn(
                          "text-lg font-bold",
                          balance >= 0 ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500",
                        )}
                      >
                        {formatCurrency(balance)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main content with transactions */}
            <div className="w-full md:w-2/3 p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">All Transactions</h2>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={onClose}>
                    Close
                  </Button>
                </div>
              </div>

              {/* Transaction filters */}
              <div className="mb-6 space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search transactions..."
                      value={transactionSearchTerm}
                      onChange={(e) => setTransactionSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>

                  <Select value={transactionTimeframe} onValueChange={(value: any) => setTransactionTimeframe(value)}>
                    <SelectTrigger className="w-[140px]">
                      <CalendarIcon2 className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Timeframe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="week">Last Week</SelectItem>
                      <SelectItem value="month">Last Month</SelectItem>
                      <SelectItem value="quarter">Last Quarter</SelectItem>
                      <SelectItem value="year">Last Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={transactionType === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTransactionType("all")}
                    className="rounded-full"
                  >
                    All
                  </Button>
                  <Button
                    variant={transactionType === "orders" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTransactionType("orders")}
                    className="rounded-full"
                  >
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    Orders
                  </Button>
                  <Button
                    variant={transactionType === "deposits" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTransactionType("deposits")}
                    className="rounded-full"
                  >
                    <ArrowDownLeft className="h-4 w-4 mr-1" />
                    Deposits
                  </Button>
                  <Button
                    variant={transactionType === "withdrawals" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTransactionType("withdrawals")}
                    className="rounded-full"
                  >
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                    Withdrawals
                  </Button>

                  <div className="ml-auto flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setTransactionSortField("date")
                        setTransactionSortDirection(
                          transactionSortField === "date" && transactionSortDirection === "desc" ? "asc" : "desc",
                        )
                      }}
                      className="flex items-center"
                    >
                      <Clock className="h-4 w-4 mr-1" />
                      Date
                      {transactionSortField === "date" &&
                        (transactionSortDirection === "asc" ? (
                          <ChevronUp className="h-4 w-4 ml-1" />
                        ) : (
                          <ChevronDown className="h-4 w-4 ml-1" />
                        ))}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setTransactionSortField("amount")
                        setTransactionSortDirection(
                          transactionSortField === "amount" && transactionSortDirection === "desc" ? "asc" : "desc",
                        )
                      }}
                      className="flex items-center"
                    >
                      <CircleDollarSign className="h-4 w-4 mr-1" />
                      Amount
                      {transactionSortField === "amount" &&
                        (transactionSortDirection === "asc" ? (
                          <ChevronUp className="h-4 w-4 ml-1" />
                        ) : (
                          <ChevronDown className="h-4 w-4 ml-1" />
                        ))}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Transactions list */}
              <div className="space-y-3">
                {allTransactions.length > 0 ? (
                  allTransactions.map((transaction, index) => {
                    // Determine transaction details based on type
                    let id = ""
                    let amount = 0
                    let details = ""
                    let status = ""
                    let paymentMode = ""

                    if (transaction.type === "order") {
                      const order = transaction as Order & { type: string }
                      id = order.orderId
                      amount = order.price
                      details = order.location
                      status = order.status
                    } else if (transaction.type === "deposit") {
                      const deposit = transaction as Deposit & { type: string }
                      id = deposit.depositId
                      amount = deposit.amount
                      paymentMode = deposit.paymentMode
                    } else if (transaction.type === "withdrawal") {
                      const withdrawal = transaction as Withdrawal & { type: string }
                      id = withdrawal.withdrawalId
                      amount = withdrawal.amount
                      paymentMode = withdrawal.paymentMode
                    }

                    return (
                      <div
                        key={`${transaction.type}-${id}`}
                        className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
                      >
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <Badge className={cn("mr-2", getTransactionTypeColor(transaction.type))}>
                                <span className="flex items-center">
                                  {getTransactionTypeIcon(transaction.type)}
                                  <span className="ml-1 capitalize">{transaction.type}</span>
                                </span>
                              </Badge>
                              <div className="font-medium text-sm">{id}</div>
                            </div>
                            <div className="text-sm">{formatDate(transaction.date)}</div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              {details && <div className="text-sm text-slate-600 dark:text-slate-300">{details}</div>}

                              {status && <Badge className={getOrderStatusColor(status)}>{status}</Badge>}

                              {paymentMode && <Badge className={getPaymentModeColor(paymentMode)}>{paymentMode}</Badge>}
                            </div>

                            <div
                              className={cn(
                                "text-lg font-bold",
                                transaction.type === "deposit"
                                  ? "text-green-600 dark:text-green-500"
                                  : transaction.type === "withdrawal" || transaction.type === "order"
                                    ? "text-red-600 dark:text-red-500"
                                    : "",
                              )}
                            >
                              {transaction.type === "deposit" ? "+" : "-"}
                              {formatCurrency(amount)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-4">
                      <Wallet className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium mb-1">No transactions found</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
                      {transactionSearchTerm || transactionType !== "all" || transactionTimeframe !== "all"
                        ? "Try adjusting your filters to see more results."
                        : "This client doesn't have any transactions yet."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Render add/edit mode
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Add New Client" : "Edit Client"}</DialogTitle>
          <DialogDescription>
            {mode === "add" ? "Fill in the details to add a new client" : "Update client information"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {isViewer && (
            <div className="bg-red-50 p-3 rounded-md text-red-800">
              <div className="font-medium">Restricted Access</div>
              <div className="text-sm">You are in view-only mode. Contact an administrator to make changes.</div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shopId">Shop ID</Label>
              <Input
                id="shopId"
                value={shopId}
                onChange={(e) => {
                  setShopId(e.target.value)
                  validateShopId(e.target.value)
                }}
                placeholder="Enter shop ID"
                className={shopIdError ? "border-red-500" : ""}
                disabled={isViewer || mode === "edit"}
              />
              {shopIdError && (
                <div className="text-sm text-red-500 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {shopIdError}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name</Label>
              <Input
                id="clientName"
                value={clientName}
                onChange={(e) => {
                  setClientName(e.target.value)
                  validateClientName(e.target.value)
                }}
                placeholder="Enter client name"
                className={clientNameError ? "border-red-500" : ""}
                disabled={isViewer}
              />
              {clientNameError && (
                <div className="text-sm text-red-500 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {clientNameError}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="agent">Agent</Label>
                {!isViewer && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddAgent(!showAddAgent)}
                    className="h-6 px-2 text-xs"
                  >
                    <UserPlus className="h-3 w-3 mr-1" />
                    Add New
                  </Button>
                )}
              </div>

              {showAddAgent ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={newAgent}
                      onChange={(e) => {
                        setNewAgent(e.target.value)
                        validateNewAgent(e.target.value)
                      }}
                      placeholder="Enter new agent name"
                      className={newAgentError ? "border-red-500" : ""}
                    />
                    <Button onClick={handleAddAgent} size="sm">
                      Add
                    </Button>
                    <Button onClick={() => setShowAddAgent(false)} variant="outline" size="sm">
                      Cancel
                    </Button>
                  </div>
                  {newAgentError && (
                    <div className="text-sm text-red-500 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {newAgentError}
                    </div>
                  )}
                </div>
              ) : (
                <Select value={agent} onValueChange={(value) => setAgent(value)} disabled={isViewer}>
                  <SelectTrigger id="agent">
                    <SelectValue placeholder="Select agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agentName) => (
                      <SelectItem key={agentName} value={agentName}>
                        {agentName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="kycDate">KYC Completed Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn("w-full justify-start text-left font-normal", !kycDate && "text-muted-foreground")}
                    disabled={isViewer}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {kycDate ? format(kycDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={kycDate}
                    onSelect={setKycDate}
                    disabled={isViewer ? true : disableFutureDates}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as ClientStatus)} disabled={isViewer}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="In Process">In Process</SelectItem>
                  <SelectItem value="Eliminated">Eliminated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter notes (max 50 characters)"
                maxLength={50}
                className="h-20"
                disabled={isViewer}
              />
              <div className="text-xs text-muted-foreground text-right">{notes.length}/50 characters</div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {mode === "view" ? "Close" : "Cancel"}
          </Button>
          {mode !== "view" && !isViewer && (
            <Button onClick={handleSubmit} disabled={formSubmitting}>
              {formSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  {mode === "add" ? "Adding..." : "Saving..."}
                </>
              ) : mode === "add" ? (
                "Add Client"
              ) : (
                "Save Changes"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
