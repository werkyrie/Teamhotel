"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useClientContext } from "@/context/client-context"
import { useAuth } from "@/context/auth-context"
import type { Client } from "@/types/client"
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
  Eye,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Plus,
  Search,
  FileDown,
  Upload,
  Wifi,
  WifiOff,
  Filter,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import ClientModal from "./modals/client-modal"
import CsvImportModal from "./modals/csv-import-modal"
import ExportOptionsModal from "./modals/export-options-modal"
import BulkDeleteModal from "./modals/bulk-delete-modal"
import { useToast } from "@/hooks/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export default function ClientsTable({ viewOnly = false }) {
  const { clients, deleteClient } = useClientContext()
  const { isViewer, isAdmin } = useAuth()
  const { toast } = useToast()
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [displayedClients, setDisplayedClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [sortField, setSortField] = useState<keyof Client>("shopId")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCsvImportModalOpen, setIsCsvImportModalOpen] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"add" | "view" | "edit">("add")
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [agentFilter, setAgentFilter] = useState<string>("all")
  const [isOnline, setIsOnline] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const observer = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // Check online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      toast({
        title: "You are online",
        description: "Your changes will be synchronized",
        variant: "success",
      })
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast({
        title: "You are offline",
        description: "You can still view and edit data. Changes will be saved locally.",
        variant: "warning",
      })
    }

    // Set initial status
    setIsOnline(navigator.onLine)

    // Add event listeners
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [toast])

  // Filter and sort clients
  const filterAndSortClients = useCallback(() => {
    setIsLoading(true)

    // Use setTimeout to simulate async operation and prevent UI blocking
    setTimeout(() => {
      let result = [...clients]

      // Apply search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        result = result.filter(
          (client) =>
            client.shopId.toLowerCase().includes(term) ||
            client.clientName.toLowerCase().includes(term) ||
            client.agent.toLowerCase().includes(term),
        )
      }

      // Apply status filter
      if (statusFilter !== "all") {
        result = result.filter((client) => client.status === statusFilter)
      }

      // Apply agent filter
      if (agentFilter !== "all") {
        result = result.filter((client) => client.agent === agentFilter)
      }

      // Apply sorting
      result.sort((a, b) => {
        const aValue = a[sortField]
        const bValue = b[sortField]

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
        return 0
      })

      setFilteredClients(result)
      setIsLoading(false)
    }, 100)
  }, [clients, searchTerm, sortField, sortDirection, statusFilter, agentFilter])

  useEffect(() => {
    filterAndSortClients()
  }, [filterAndSortClients])

  // Lazy loading with Intersection Observer
  useEffect(() => {
    // Calculate pagination
    const startIndex = 0
    const endIndex = currentPage * itemsPerPage
    setDisplayedClients(filteredClients.slice(startIndex, endIndex))

    // Set up intersection observer for infinite scroll
    observer.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && displayedClients.length < filteredClients.length) {
          setCurrentPage((prev) => prev + 1)
        }
      },
      { threshold: 0.5 },
    )

    if (loadMoreRef.current) {
      observer.current.observe(loadMoreRef.current)
    }

    return () => {
      if (observer.current && loadMoreRef.current) {
        observer.current.unobserve(loadMoreRef.current)
      }
    }
  }, [filteredClients, currentPage, itemsPerPage, isLoading, displayedClients.length])

  // Handle sort
  const handleSort = (field: keyof Client) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Handle client actions
  const handleAddClient = () => {
    setModalMode("add")
    setSelectedClient(null)
    setIsModalOpen(true)
  }

  const handleViewClient = (client: Client) => {
    setModalMode("view")
    setSelectedClient(client)
    setIsModalOpen(true)
  }

  const handleEditClient = (client: Client) => {
    setModalMode("edit")
    setSelectedClient(client)
    setIsModalOpen(true)
  }

  const handleImportCsv = () => {
    setIsCsvImportModalOpen(true)
  }

  const handleExportOptions = () => {
    setIsExportModalOpen(true)
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

  const handleDeleteClient = (client: Client) => {
    if (confirm("Are you sure you want to delete this client?")) {
      deleteClient(client.shopId)
    }
  }

  // Handle row click for view and double click for edit
  const handleRowClick = (client: Client) => {
    handleViewClient(client)
  }

  const handleRowDoubleClick = (client: Client) => {
    if (!isViewer) {
      handleEditClient(client)
    }
  }

  // Get unique agents from clients
  const uniqueAgents = Array.from(new Set(clients.map((client) => client.agent))).sort()

  const handleSelectClient = (shopId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedClients((prev) => [...prev, shopId])
    } else {
      setSelectedClients((prev) => prev.filter((id) => id !== shopId))
    }
  }

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedClients(displayedClients.map((client) => client.shopId))
    } else {
      setSelectedClients([])
    }
  }

  // Responsive table columns based on screen size
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Clients</h2>
        <div className="flex flex-wrap gap-2">
          {!isOnline && (
            <Badge
              variant="outline"
              className="flex items-center gap-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
            >
              <WifiOff className="h-3 w-3" />
              Offline Mode
            </Badge>
          )}
          {isOnline && (
            <Badge
              variant="outline"
              className="flex items-center gap-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            >
              <Wifi className="h-3 w-3" />
              Online
            </Badge>
          )}
          <Button onClick={handleExportOptions} variant="outline" size="sm" className="hidden sm:flex">
            <FileDown className="h-4 w-4 mr-2" />
            Export
          </Button>
          {/* Only show bulk delete button for admins */}
          {isAdmin && selectedClients.length > 0 && (
            <Button onClick={() => setIsBulkDeleteModalOpen(true)} variant="destructive" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete ({selectedClients.length})
            </Button>
          )}
          {!isViewer && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Add Client</span>
                  <span className="sm:hidden">Add</span>
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleAddClient}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Single Client
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleImportCsv}>
                  <Upload className="mr-2 h-4 w-4" />
                  Import from CSV
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
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* Mobile filter button */}
        <div className="md:hidden">
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Status</h4>
                  <Select
                    value={statusFilter}
                    onValueChange={(value) => {
                      setStatusFilter(value)
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="In Process">In Process</SelectItem>
                      <SelectItem value="Eliminated">Eliminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Agent</h4>
                  <Select
                    value={agentFilter}
                    onValueChange={(value) => {
                      setAgentFilter(value)
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger className="w-full">
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

                <div className="space-y-2">
                  <h4 className="font-medium">Items per page</h4>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(Number.parseInt(value))
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="10" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 / page</SelectItem>
                      <SelectItem value="25">25 / page</SelectItem>
                      <SelectItem value="50">50 / page</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  className="w-full"
                  onClick={() => {
                    setIsFilterOpen(false)
                  }}
                >
                  Apply Filters
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Desktop filters */}
        <div className="hidden md:block">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
              <SelectItem value="In Process">In Process</SelectItem>
              <SelectItem value="Eliminated">Eliminated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="hidden md:block">
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
      </div>

      <div className="rounded-md border shadow-sm overflow-x-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-background">
            <TableRow>
              {/* Only show checkboxes for admins */}
              {isAdmin && (
                <TableHead className="w-[50px]">
                  <input
                    type="checkbox"
                    checked={displayedClients.length > 0 && selectedClients.length === displayedClients.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4"
                  />
                </TableHead>
              )}
              <TableHead className="w-[150px] cursor-pointer" onClick={() => handleSort("shopId")}>
                Shop ID
                {sortField === "shopId" &&
                  (sortDirection === "asc" ? (
                    <ChevronUp className="inline ml-1 h-4 w-4" />
                  ) : (
                    <ChevronDown className="inline ml-1 h-4 w-4" />
                  ))}
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("clientName")}>
                Client Name
                {sortField === "clientName" &&
                  (sortDirection === "asc" ? (
                    <ChevronUp className="inline ml-1 h-4 w-4" />
                  ) : (
                    <ChevronDown className="inline ml-1 h-4 w-4" />
                  ))}
              </TableHead>
              <TableHead className="cursor-pointer hidden md:table-cell" onClick={() => handleSort("agent")}>
                Agent
                {sortField === "agent" &&
                  (sortDirection === "asc" ? (
                    <ChevronUp className="inline ml-1 h-4 w-4" />
                  ) : (
                    <ChevronDown className="inline ml-1 h-4 w-4" />
                  ))}
              </TableHead>
              <TableHead className="cursor-pointer hidden md:table-cell" onClick={() => handleSort("kycDate")}>
                KYC Date
                {sortField === "kycDate" &&
                  (sortDirection === "asc" ? (
                    <ChevronUp className="inline ml-1 h-4 w-4" />
                  ) : (
                    <ChevronDown className="inline ml-1 h-4 w-4" />
                  ))}
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("status")}>
                Status
                {sortField === "status" &&
                  (sortDirection === "asc" ? (
                    <ChevronUp className="inline ml-1 h-4 w-4" />
                  ) : (
                    <ChevronDown className="inline ml-1 h-4 w-4" />
                  ))}
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedClients.length > 0 ? (
              displayedClients.map((client) => (
                <TableRow
                  key={client.shopId}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(client)}
                  onDoubleClick={() => handleRowDoubleClick(client)}
                >
                  {/* Only show checkboxes for admins */}
                  {isAdmin && (
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedClients.includes(client.shopId)}
                        onChange={(e) => handleSelectClient(client.shopId, e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4"
                      />
                    </TableCell>
                  )}
                  <TableCell className="font-medium">{client.shopId}</TableCell>
                  <TableCell>{client.clientName}</TableCell>
                  <TableCell className="hidden md:table-cell">{client.agent}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {client.kycDate instanceof Date ? client.kycDate.toLocaleDateString() : client.kycDate}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(client.status)}>{client.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            handleViewClient(client)
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </DropdownMenuItem>
                        {!isViewer && (
                          <>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditClient(client)
                              }}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteClient(client)
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={isAdmin ? 7 : 6} className="text-center py-4">
                  {isLoading ? "Loading clients..." : "No clients found"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Infinite scroll loading indicator */}
      {displayedClients.length < filteredClients.length && (
        <div ref={loadMoreRef} className="py-4 text-center text-sm text-muted-foreground">
          {isLoading ? "Loading more clients..." : "Scroll to load more"}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          Showing {displayedClients.length} of {filteredClients.length} clients
        </div>

        <div className="flex items-center space-x-2">
          <div className="hidden sm:block">
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
          </div>

          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>

              {Array.from({ length: Math.min(5, Math.ceil(filteredClients.length / itemsPerPage)) }, (_, i) => {
                let pageNum
                if (Math.ceil(filteredClients.length / itemsPerPage) <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= Math.ceil(filteredClients.length / itemsPerPage) - 2) {
                  pageNum = Math.ceil(filteredClients.length / itemsPerPage) - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }

                return (
                  <PaginationItem key={i} className="hidden sm:inline-block">
                    <PaginationLink onClick={() => setCurrentPage(pageNum)} isActive={currentPage === pageNum}>
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                )
              })}

              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(filteredClients.length / itemsPerPage)))
                  }
                  className={
                    currentPage === Math.ceil(filteredClients.length / itemsPerPage)
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>

      {isModalOpen && (
        <ClientModal
          mode={modalMode}
          client={selectedClient}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      {isCsvImportModalOpen && (
        <CsvImportModal isOpen={isCsvImportModalOpen} onClose={() => setIsCsvImportModalOpen(false)} />
      )}

      {isExportModalOpen && (
        <ExportOptionsModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          data={filteredClients}
          type="clients"
        />
      )}

      {isBulkDeleteModalOpen && (
        <BulkDeleteModal
          isOpen={isBulkDeleteModalOpen}
          onClose={() => {
            setIsBulkDeleteModalOpen(false)
            setSelectedClients([])
          }}
          selectedClients={selectedClients}
        />
      )}
    </div>
  )
}
