"use client"

import { useState, useEffect, useCallback } from "react"
import { useClientContext } from "@/context/client-context"
import { useAuth } from "@/context/auth-context"
import type { Deposit } from "@/types/client"
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
  DollarSign,
  CreditCard,
  FileDown,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import DepositModal from "./modals/deposit-modal"
import BulkDepositModal from "./modals/bulk-deposit-modal"
import ExportOptionsModal from "./modals/export-options-modal"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function DepositsTable() {
  const { deposits, deleteDeposit } = useClientContext()
  const { isViewer } = useAuth()
  const { toast } = useToast()
  const [filteredDeposits, setFilteredDeposits] = useState<Deposit[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [sortField, setSortField] = useState<keyof Deposit>("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"add" | "edit">("add")
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null)
  const [paymentModeFilter, setPaymentModeFilter] = useState<string>("all")
  const [agentFilter, setAgentFilter] = useState<string>("all")
  const [isDeleting, setIsDeleting] = useState(false)
  const [localDeposits, setLocalDeposits] = useState<Deposit[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Multiple delete functionality
  const [selectedDepositIds, setSelectedDepositIds] = useState<string[]>([])
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Load deposits from localStorage on initial render
  useEffect(() => {
    try {
      const savedDeposits = localStorage.getItem("deposits")
      if (savedDeposits) {
        const parsedDeposits = JSON.parse(savedDeposits)
        setLocalDeposits(parsedDeposits)
        console.log(`Loaded ${parsedDeposits.length} deposits from localStorage`)
      }
    } catch (error) {
      console.error("Error loading deposits from localStorage:", error)
    }
  }, [])

  // Use either context deposits or localStorage deposits, whichever has more items
  const allDeposits = deposits && deposits.length > localDeposits.length ? deposits : localDeposits

  // Filter and sort deposits
  useEffect(() => {
    if (!allDeposits || !Array.isArray(allDeposits)) {
      setFilteredDeposits([])
      return
    }

    let result = [...allDeposits]

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (deposit) =>
          (deposit.shopId && deposit.shopId.toLowerCase().includes(term)) ||
          (deposit.clientName && deposit.clientName.toLowerCase().includes(term)) ||
          (deposit.agent && deposit.agent.toLowerCase().includes(term)),
      )
    }

    // Apply payment mode filter
    if (paymentModeFilter !== "all") {
      result = result.filter((deposit) => deposit.paymentMode === paymentModeFilter)
    }

    // Apply agent filter
    if (agentFilter !== "all") {
      result = result.filter((deposit) => deposit.agent === agentFilter)
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sortField === "amount") {
        const aAmount = a.amount || 0
        const bAmount = b.amount || 0
        return sortDirection === "asc" ? aAmount - bAmount : bAmount - aAmount
      }

      const aValue = a[sortField]
      const bValue = b[sortField]

      if (!aValue && !bValue) return 0
      if (!aValue) return sortDirection === "asc" ? -1 : 1
      if (!bValue) return sortDirection === "asc" ? 1 : -1

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
      return 0
    })

    setFilteredDeposits(result)
  }, [allDeposits, searchTerm, sortField, sortDirection, paymentModeFilter, agentFilter])

  // Reset selected deposits when filtered deposits change
  useEffect(() => {
    setSelectedDepositIds([])
  }, [filteredDeposits])

  // Calculate pagination
  const totalPages = Math.ceil(filteredDeposits.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedDeposits = filteredDeposits.slice(startIndex, startIndex + itemsPerPage)

  // Handle sort
  const handleSort = (field: keyof Deposit) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Handle deposit actions
  const handleAddDeposit = () => {
    setModalMode("add")
    setSelectedDeposit(null)
    setIsModalOpen(true)
  }

  const handleBulkAddDeposit = () => {
    setIsBulkModalOpen(true)
  }

  const handleEditDeposit = (deposit: Deposit) => {
    setModalMode("edit")
    setSelectedDeposit(deposit)
    setIsModalOpen(true)
  }

  const handleExportOptions = () => {
    setIsExportModalOpen(true)
  }

  const handleRefreshData = () => {
    setIsRefreshing(true)
    try {
      const savedDeposits = localStorage.getItem("deposits")
      if (savedDeposits) {
        const parsedDeposits = JSON.parse(savedDeposits)
        setLocalDeposits(parsedDeposits)
        toast({
          title: "Data Refreshed",
          description: `Loaded ${parsedDeposits.length} deposits from storage.`,
          variant: "default",
        })
      }
    } catch (error) {
      console.error("Error refreshing data:", error)
      toast({
        title: "Error",
        description: "Failed to refresh data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleDeleteDeposit = useCallback(
    async (depositId: string) => {
      if (confirm("Are you sure you want to delete this deposit?")) {
        setIsDeleting(true)
        try {
          await deleteDeposit(depositId)
          toast({
            title: "Deposit Deleted",
            description: "The deposit has been deleted successfully.",
            variant: "default",
          })
        } catch (error) {
          console.error("Error deleting deposit:", error)
          toast({
            title: "Error",
            description: "There was an error deleting the deposit. Please try again.",
            variant: "destructive",
          })
        } finally {
          setIsDeleting(false)
        }
      }
    },
    [deleteDeposit, toast],
  )

  // Multiple selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDepositIds(paginatedDeposits.map((deposit) => deposit.depositId))
    } else {
      setSelectedDepositIds([])
    }
  }

  const handleSelectDeposit = (depositId: string, checked: boolean) => {
    if (checked) {
      setSelectedDepositIds((prev) => [...prev, depositId])
    } else {
      setSelectedDepositIds((prev) => prev.filter((id) => id !== depositId))
    }
  }

  const handleDeleteSelected = async () => {
    setIsDeleting(true)
    try {
      for (const depositId of selectedDepositIds) {
        await deleteDeposit(depositId)
      }

      toast({
        title: "Deposits Deleted",
        description: `Successfully deleted ${selectedDepositIds.length} deposits.`,
        variant: "default",
      })

      setSelectedDepositIds([])
      setShowDeleteDialog(false)
    } catch (error) {
      console.error("Error deleting deposits:", error)
      toast({
        title: "Error",
        description: "There was an error deleting the deposits. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
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

  // Get unique agents from deposits
  const uniqueAgents =
    allDeposits && Array.isArray(allDeposits)
      ? Array.from(new Set(allDeposits.map((deposit) => deposit.agent).filter(Boolean))).sort()
      : []

  // Format date for display
  const formatDate = (dateString: string | Date) => {
    if (!dateString) return ""
    const date = typeof dateString === "string" ? new Date(dateString) : dateString
    return date.toLocaleDateString()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Deposits</h2>
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
                  Add Deposit
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleAddDeposit}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Single Deposit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleBulkAddDeposit}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Bulk Add Deposits
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
            placeholder="Search deposits..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>

        <Select value={paymentModeFilter} onValueChange={setPaymentModeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by payment mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payment Modes</SelectItem>
            <SelectItem value="Crypto">Crypto</SelectItem>
            <SelectItem value="Online Banking">Online Banking</SelectItem>
            <SelectItem value="Ewallet">Ewallet</SelectItem>
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

      {/* Bulk actions bar */}
      {selectedDepositIds.length > 0 && !isViewer && (
        <div className="flex items-center justify-between bg-muted p-2 rounded-md mb-2">
          <span className="text-sm font-medium">
            {selectedDepositIds.length} {selectedDepositIds.length === 1 ? "deposit" : "deposits"} selected
          </span>
          <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)} disabled={isDeleting}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Selected
          </Button>
        </div>
      )}

      <div className="rounded-md border shadow-sm">
        <Table>
          <TableHeader className="sticky top-0 bg-background">
            <TableRow>
              {!isViewer && (
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={paginatedDeposits.length > 0 && selectedDepositIds.length === paginatedDeposits.length}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all deposits"
                  />
                </TableHead>
              )}
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
              <TableHead className="cursor-pointer" onClick={() => handleSort("amount")}>
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  Amount
                  {sortField === "amount" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    ))}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("paymentMode")}>
                <div className="flex items-center">
                  <CreditCard className="h-4 w-4 mr-1" />
                  Payment Mode
                  {sortField === "paymentMode" &&
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
            {paginatedDeposits.length > 0 ? (
              paginatedDeposits.map((deposit) => (
                <TableRow key={deposit.depositId} className="hover:bg-muted/50">
                  {!isViewer && (
                    <TableCell>
                      <Checkbox
                        checked={selectedDepositIds.includes(deposit.depositId)}
                        onCheckedChange={(checked) => handleSelectDeposit(deposit.depositId, !!checked)}
                        aria-label={`Select deposit ${deposit.depositId}`}
                      />
                    </TableCell>
                  )}
                  <TableCell className="font-medium">{deposit.shopId}</TableCell>
                  <TableCell>{deposit.clientName}</TableCell>
                  <TableCell>{deposit.agent}</TableCell>
                  <TableCell>{formatDate(deposit.date)}</TableCell>
                  <TableCell>${deposit.amount?.toFixed(2) || "0.00"}</TableCell>
                  <TableCell>
                    <Badge className={getPaymentModeColor(deposit.paymentMode || "")}>{deposit.paymentMode}</Badge>
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
                          <DropdownMenuItem onClick={() => handleEditDeposit(deposit)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {!isViewer && (
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteDeposit(deposit.depositId)}
                            disabled={isDeleting}
                          >
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
                <TableCell colSpan={isViewer ? 7 : 8} className="text-center py-4">
                  No deposits found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredDeposits.length)} of{" "}
          {filteredDeposits.length}
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
        <DepositModal
          mode={modalMode}
          deposit={selectedDeposit}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      {isBulkModalOpen && <BulkDepositModal isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} />}

      {isExportModalOpen && (
        <ExportOptionsModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          data={filteredDeposits}
          type="deposits"
        />
      )}

      {/* Confirmation dialog for bulk delete */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Deposits</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedDepositIds.length}{" "}
              {selectedDepositIds.length === 1 ? "deposit" : "deposits"}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSelected}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
