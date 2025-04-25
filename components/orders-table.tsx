"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useClientContext } from "@/context/client-context"
import { useAuth } from "@/context/auth-context"
import type { Order } from "@/types/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Plus,
  Search,
  Calendar,
  MapPin,
  DollarSign,
  Package,
  FileDown,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import OrderModal from "./modals/order-modal"
import BulkOrderModal from "./modals/bulk-order-modal"
import ExportOptionsModal from "./modals/export-options-modal"
// Import the helper functions
import { formatCurrency, formatDate } from "@/utils/format-helpers"

// Define OrderStatus type
type OrderStatus = "Pending" | "Processing" | "Completed"

export default function OrdersTable() {
  const { orders, clients, deleteOrder, updateOrder } = useClientContext()
  const { isViewer } = useAuth()
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [sortField, setSortField] = useState<keyof Order>("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"add" | "edit">("add")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [agentFilter, setAgentFilter] = useState<string>("all")

  // Filter and sort orders
  useEffect(() => {
    let result = [...orders]

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (order) =>
          order.shopId.toLowerCase().includes(term) ||
          order.clientName.toLowerCase().includes(term) ||
          order.agent.toLowerCase().includes(term) ||
          order.location.toLowerCase().includes(term),
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((order) => order.status === statusFilter)
    }

    // Apply agent filter
    if (agentFilter !== "all") {
      result = result.filter((order) => order.agent === agentFilter)
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sortField === "price") {
        // Handle undefined or null price values
        const priceA = a.price || 0
        const priceB = b.price || 0
        return sortDirection === "asc" ? priceA - priceB : priceB - priceA
      }

      const aValue = a[sortField] || ""
      const bValue = b[sortField] || ""

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
      return 0
    })

    setFilteredOrders(result)
  }, [orders, searchTerm, sortField, sortDirection, statusFilter, agentFilter])

  // Auto-update Processing orders older than 8 days to Completed
  useEffect(() => {
    const autoUpdateProcessingOrders = () => {
      const currentDate = new Date()
      const updatedOrders = orders.filter((order) => {
        if (order.status === "Processing") {
          // Convert order date to Date object if it's a string
          const orderDate = typeof order.date === "string" ? new Date(order.date) : order.date

          // Add 8 days to the order date
          const deadlineDate = new Date(orderDate)
          deadlineDate.setDate(deadlineDate.getDate() + 8)

          // If current date is past the deadline, update to Completed
          if (currentDate > deadlineDate) {
            const updatedOrder = { ...order, status: "Completed" as OrderStatus }
            updateOrder(updatedOrder)
            return false // Remove from filtered list since we're updating it
          }
        }
        return true // Keep all other orders in the filtered list
      })
    }

    // Run the auto-update when component mounts and when orders change
    autoUpdateProcessingOrders()

    // Set up an interval to check every hour (in milliseconds)
    const intervalId = setInterval(autoUpdateProcessingOrders, 60 * 60 * 1000)

    // Clean up the interval when component unmounts
    return () => clearInterval(intervalId)
  }, [orders, updateOrder])

  // Calculate pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage)

  // Handle sort
  const handleSort = (field: keyof Order) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Handle order actions
  const handleAddOrder = () => {
    setModalMode("add")
    setSelectedOrder(null)
    setIsModalOpen(true)
  }

  const handleBulkAddOrder = () => {
    setIsBulkModalOpen(true)
  }

  const handleEditOrder = (order: Order) => {
    setModalMode("edit")
    setSelectedOrder(order)
    setIsModalOpen(true)
  }

  // Handle export options
  const handleExportOptions = () => {
    setIsExportModalOpen(true)
  }

  // Get status badge variant
  const getStatusVariant = (status: string): "pending" | "processing" | "completed" | undefined => {
    switch (status) {
      case "Completed":
        return "completed"
      case "Processing":
        return "processing"
      case "Pending":
        return "pending"
      default:
        return undefined
    }
  }

  // Add this function after the getStatusColor function
  const handleStatusDoubleClick = (order: Order, event: React.MouseEvent) => {
    event.stopPropagation()

    // Create a temporary element to show status options
    const statusOptions = document.createElement("div")
    statusOptions.className = "absolute z-50 bg-background border rounded-md shadow-lg p-1"
    statusOptions.style.left = `${event.clientX}px`
    statusOptions.style.top = `${event.clientY}px`

    const statuses: OrderStatus[] = ["Pending", "Processing", "Completed"]

    statuses.forEach((status) => {
      const option = document.createElement("div")
      option.className = `p-2 hover:bg-muted cursor-pointer flex items-center ${order.status === status ? "bg-muted" : ""}`

      const badge = document.createElement("span")
      const statusVariant = getStatusVariant(status)
      let badgeClass =
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-white mr-2 "

      switch (statusVariant) {
        case "completed":
          badgeClass += "bg-green-500"
          break
        case "processing":
          badgeClass += "bg-blue-500"
          break
        case "pending":
          badgeClass += "bg-yellow-500"
          break
        default:
          badgeClass += "bg-gray-500"
      }

      badge.className = badgeClass
      badge.textContent = status

      option.appendChild(badge)

      option.addEventListener("click", async () => {
        if (order.status !== status) {
          const updatedOrder = { ...order, status }
          await updateOrder(updatedOrder)
        }
        document.body.removeChild(statusOptions)
      })

      statusOptions.appendChild(option)
    })

    // Add click outside to close
    const handleClickOutside = (e: MouseEvent) => {
      // Check if the element is still in the DOM and is a child of document.body
      if (document.body.contains(statusOptions) && !statusOptions.contains(e.target as Node)) {
        try {
          document.body.removeChild(statusOptions)
        } catch (error) {
          console.error("Error removing status options:", error)
        }
        document.removeEventListener("click", handleClickOutside)
      }
    }

    document.body.appendChild(statusOptions)

    // Add a small delay before adding the event listener to prevent immediate closing
    setTimeout(() => {
      document.addEventListener("click", handleClickOutside)
    }, 100)

    // Ensure cleanup if the popup stays open too long
    const cleanupTimeout = setTimeout(() => {
      if (document.body.contains(statusOptions)) {
        try {
          document.body.removeChild(statusOptions)
        } catch (error) {
          console.error("Error removing status options in cleanup:", error)
        }
        document.removeEventListener("click", handleClickOutside)
      }
    }, 10000) // 10 seconds timeout as a safety measure

    // Return a cleanup function
    return () => {
      clearTimeout(cleanupTimeout)
    }
  }

  const handleDeleteOrder = useCallback(
    (orderId: string) => {
      if (confirm("Are you sure you want to delete this order?")) {
        deleteOrder(orderId)
      }
    },
    [deleteOrder],
  )

  // Get unique agents from orders
  const uniqueAgents = Array.from(new Set(orders.map((order) => order.agent))).sort()

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Orders</h2>
        <div className="flex gap-2">
          <Button onClick={handleExportOptions} variant="outline" size="sm">
            <FileDown className="h-4 w-4 mr-2" />
            Export Options
          </Button>
          {!isViewer && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Order
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleAddOrder}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Single Order
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleBulkAddOrder}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Bulk Add Orders
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Processing">Processing</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={agentFilter} onValueChange={setAgentFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by agent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Agents</SelectItem>
            {uniqueAgents.map((agent) => (
              <SelectItem key={agent} value={agent}>
                {agent}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border shadow-sm">
        <Table>
          <TableHeader className="sticky top-0 bg-background">
            <TableRow>
              <TableHead>Shop ID</TableHead>
              <TableHead>Client Name</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("date")}>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Date
                  {sortField === "date" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    ))}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("location")}>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  Location
                  {sortField === "location" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    ))}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("price")}>
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  Price
                  {sortField === "price" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    ))}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("status")}>
                <div className="flex items-center">
                  <Package className="h-4 w-4 mr-1" />
                  Status
                  {sortField === "status" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    ))}
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedOrders.length > 0 ? (
              paginatedOrders.map((order) => (
                <TableRow key={order.orderId} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{order.shopId}</TableCell>
                  <TableCell>{order.clientName}</TableCell>
                  <TableCell>{order.agent}</TableCell>
                  <TableCell>{order.date instanceof Date ? formatDate(order.date) : formatDate(order.date)}</TableCell>
                  <TableCell>{order.location}</TableCell>
                  <TableCell>{formatCurrency(order.price)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={getStatusVariant(order.status)}
                      className="cursor-pointer"
                      onDoubleClick={(e) => !isViewer && handleStatusDoubleClick(order, e)}
                    >
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!isViewer && (
                          <DropdownMenuItem onClick={() => handleEditOrder(order)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {!isViewer && (
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteOrder(order.orderId)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
                  No orders found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {filteredOrders.length > 0 ? startIndex + 1 : 0}-
          {Math.min(startIndex + itemsPerPage, filteredOrders.length)} of {filteredOrders.length}
        </div>

        <div className="flex items-center space-x-2">
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => {
              setItemsPerPage(Number.parseInt(value))
              setCurrentPage(1)
            }}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="10" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 / page</SelectItem>
              <SelectItem value="25">25 / page</SelectItem>
              <SelectItem value="50">50 / page</SelectItem>
              <SelectItem value="100">100 / page</SelectItem>
            </SelectContent>
          </Select>

          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }

                return (
                  <PaginationItem key={i}>
                    <PaginationLink onClick={() => setCurrentPage(pageNum)} isActive={currentPage === pageNum}>
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                )
              })}

              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>

      {isModalOpen && (
        <OrderModal mode={modalMode} order={selectedOrder} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      )}

      {isBulkModalOpen && <BulkOrderModal isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} />}

      {isExportModalOpen && (
        <ExportOptionsModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          data={filteredOrders}
          type="orders"
        />
      )}
    </div>
  )
}
