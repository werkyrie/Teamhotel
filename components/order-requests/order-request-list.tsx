"use client"

import { useState, useEffect } from "react"
import { useClientContext } from "@/context/client-context"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, ClipboardList, Grid3X3, List, LayoutGrid, Rows3 } from "lucide-react"
import OrderRequestCard from "./order-request-card"
import type { OrderRequest, OrderRequestStatus } from "@/types/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"

type ViewMode = "grid" | "compact" | "list" | "dense"

export default function OrderRequestList() {
  const { orderRequests } = useClientContext()
  const [filteredRequests, setFilteredRequests] = useState<OrderRequest[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showFilters, setShowFilters] = useState(false)
  const [locationFilter, setLocationFilter] = useState<string>("all")
  const [agentFilter, setAgentFilter] = useState<string>("all")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")

  // Add pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = viewMode === "dense" ? 20 : viewMode === "compact" ? 16 : 12
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage)

  // Get current page items
  const currentItems = filteredRequests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Get unique locations and agents for filters
  const locations = [...new Set(orderRequests.map((req) => req.location))].sort()
  const agents = [...new Set(orderRequests.map((req) => req.agent))].sort()

  // Filter and sort order requests
  useEffect(() => {
    let result = [...orderRequests]

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (request) =>
          request.shopId.toLowerCase().includes(term) ||
          request.clientName.toLowerCase().includes(term) ||
          request.agent.toLowerCase().includes(term) ||
          request.location.toLowerCase().includes(term),
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((request) => request.status === statusFilter)
    }

    // Apply location filter
    if (locationFilter !== "all") {
      result = result.filter((request) => request.location === locationFilter)
    }

    // Apply agent filter
    if (agentFilter !== "all") {
      result = result.filter((request) => request.agent === agentFilter)
    }

    // Sort by date (newest first) and then by status (Pending first)
    result.sort((a, b) => {
      // First sort by status priority (Pending > Approved > Rejected)
      const statusPriority = { Pending: 0, Approved: 1, Rejected: 2 }
      const statusDiff = statusPriority[a.status as OrderRequestStatus] - statusPriority[b.status as OrderRequestStatus]

      if (statusDiff !== 0) return statusDiff

      // Then sort by creation date (newest first)
      return b.createdAt - a.createdAt
    })

    setFilteredRequests(result)

    // Reset to first page when filters change
    setCurrentPage(1)
  }, [orderRequests, searchTerm, statusFilter, locationFilter, agentFilter])

  // Reset to first page when view mode changes
  useEffect(() => {
    setCurrentPage(1)
  }, [viewMode])

  // Get status badge variant
  const getStatusVariant = (status: OrderRequestStatus): string => {
    switch (status) {
      case "Pending":
        return "pending"
      case "Approved":
        return "approved"
      case "Rejected":
        return "rejected"
      default:
        return "outline"
    }
  }

  // Render different view modes
  const renderViewContent = () => {
    if (viewMode === "list") {
      return (
        <div className="space-y-2">
          {currentItems.map((request) => (
            <Card key={request.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-sm">{request.clientName}</h3>
                      <Badge variant={getStatusVariant(request.status as OrderRequestStatus)} className="text-xs">
                        {request.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Shop ID: {request.shopId}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">{formatCurrency(request.price || 0)}</p>
                    <p className="text-xs text-muted-foreground">{request.location}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{request.agent}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(request.date)}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )
    }

    if (viewMode === "compact") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {currentItems.map((request) => (
            <Card key={request.id} className="p-3 hover:shadow-md transition-shadow">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm truncate">{request.clientName}</h3>
                  <Badge variant={getStatusVariant(request.status as OrderRequestStatus)} className="text-xs">
                    {request.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">ID: {request.shopId}</p>
                <div className="flex justify-between text-xs">
                  <span className="font-medium">{formatCurrency(request.price || 0)}</span>
                  <span className="text-muted-foreground">{request.location}</span>
                </div>
                <p className="text-xs text-muted-foreground">{request.agent}</p>
              </div>
            </Card>
          ))}
        </div>
      )
    }

    if (viewMode === "dense") {
      return (
        <div className="space-y-1">
          <div className="grid grid-cols-12 gap-2 p-2 bg-muted/50 rounded text-xs font-medium">
            <div className="col-span-2">Client</div>
            <div className="col-span-2">Shop ID</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-2">Price</div>
            <div className="col-span-2">Location</div>
            <div className="col-span-2">Agent</div>
            <div className="col-span-1">Date</div>
          </div>
          {currentItems.map((request) => (
            <div key={request.id} className="grid grid-cols-12 gap-2 p-2 hover:bg-muted/30 rounded text-xs border-b">
              <div className="col-span-2 font-medium truncate">{request.clientName}</div>
              <div className="col-span-2 text-muted-foreground truncate">{request.shopId}</div>
              <div className="col-span-1">
                <Badge variant={getStatusVariant(request.status as OrderRequestStatus)} className="text-xs py-0 px-1">
                  {request.status}
                </Badge>
              </div>
              <div className="col-span-2 font-medium">{formatCurrency(request.price || 0)}</div>
              <div className="col-span-2 text-muted-foreground truncate">{request.location}</div>
              <div className="col-span-2 text-muted-foreground truncate">{request.agent}</div>
              <div className="col-span-1 text-muted-foreground">{formatDate(request.date)}</div>
            </div>
          ))}
        </div>
      )
    }

    // Default grid view
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentItems.map((request) => (
          <div
            key={request.id}
            className={cn("transition-all duration-500", request.status === "Pending" && "animate-pending-pulse")}
          >
            <OrderRequestCard request={request} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search requests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? "bg-muted" : ""}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* View Mode Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">View:</span>
          <div className="flex border rounded-lg p-1">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-8 px-3"
            >
              <Grid3X3 className="h-4 w-4 mr-1" />
              Grid
            </Button>
            <Button
              variant={viewMode === "compact" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("compact")}
              className="h-8 px-3"
            >
              <LayoutGrid className="h-4 w-4 mr-1" />
              Compact
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-8 px-3"
            >
              <List className="h-4 w-4 mr-1" />
              List
            </Button>
            <Button
              variant={viewMode === "dense" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("dense")}
              className="h-8 px-3"
            >
              <Rows3 className="h-4 w-4 mr-1" />
              Dense
            </Button>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredRequests.length} request{filteredRequests.length !== 1 ? "s" : ""}
        </div>
      </div>

      {showFilters && (
        <Card className="p-4">
          <CardContent className="p-0 pt-4 flex flex-col sm:flex-row gap-4">
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={agentFilter} onValueChange={setAgentFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent} value={agent}>
                    {agent}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {filteredRequests.length > 0 ? (
        <div className="space-y-4">
          {renderViewContent()}

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-center items-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Show pages around current page
                  let pageToShow = currentPage
                  if (currentPage <= 3) {
                    pageToShow = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageToShow = totalPages - 4 + i
                  } else {
                    pageToShow = currentPage - 2 + i
                  }

                  // Ensure page is in valid range
                  if (pageToShow > 0 && pageToShow <= totalPages) {
                    return (
                      <Button
                        key={pageToShow}
                        variant={currentPage === pageToShow ? "default" : "outline"}
                        size="sm"
                        className="w-9 h-9"
                        onClick={() => setCurrentPage(pageToShow)}
                      >
                        {pageToShow}
                      </Button>
                    )
                  }
                  return null
                })}

                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <span className="mx-1">...</span>
                    <Button variant="outline" size="sm" className="w-9 h-9" onClick={() => setCurrentPage(totalPages)}>
                      {totalPages}
                    </Button>
                  </>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>

              <span className="text-sm text-muted-foreground ml-2">
                Page {currentPage} of {totalPages} ({filteredRequests.length} items)
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 px-4 border rounded-lg bg-muted/30 text-center">
          <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">No order requests found</h3>
          <p className="text-muted-foreground max-w-md mb-4">
            {searchTerm || statusFilter !== "all" || locationFilter !== "all" || agentFilter !== "all"
              ? "Try adjusting your search filters to find what you're looking for."
              : "There are currently no order requests in the system."}
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-px w-10 bg-border"></div>
            <span>Use the filters above to refine results</span>
            <div className="h-px w-10 bg-border"></div>
          </div>
        </div>
      )}
    </div>
  )
}
