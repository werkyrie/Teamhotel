"use client"

import { useEffect, useState, useMemo, memo } from "react"
import { useClientContext } from "@/context/client-context"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, ArrowRight, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/auth-context"

// Memoized request item component
const RequestItem = memo(
  ({
    request,
    onClick,
  }: {
    request: any
    onClick: (id: string) => void
  }) => {
    // Memoize the formatted date to avoid recalculation
    const formattedDate = useMemo(() => {
      return format(new Date(request.date), "MMM d, yyyy")
    }, [request.date])

    // Memoize the formatted currency to avoid recalculation
    const formattedCurrency = useMemo(() => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
      }).format(request.price)
    }, [request.price])

    return (
      <div className="flex items-center justify-between p-3 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 text-amber-500 mt-0.5" />
          <div>
            <p className="font-medium">{request.clientName}</p>
            <p className="text-sm text-muted-foreground">{request.shopId}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs bg-amber-100 dark:bg-amber-800/30 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full">
                {formattedCurrency}
              </span>
              <span className="text-xs text-slate-500">{formattedDate}</span>
            </div>
          </div>
        </div>
        <Button size="sm" onClick={() => onClick(request.id)}>
          Review
        </Button>
      </div>
    )
  },
)

function AdminOrderRequestsCard() {
  const { orderRequests } = useClientContext()
  const { isAdmin } = useAuth()
  const router = useRouter()
  const [pendingRequests, setPendingRequests] = useState<any[]>([])

  // Memoize pending requests calculation
  const filteredPendingRequests = useMemo(() => {
    if (!orderRequests) return []
    return orderRequests.filter((request) => request.status === "Pending")
  }, [orderRequests])

  // Update state only when filtered requests change
  useEffect(() => {
    setPendingRequests(filteredPendingRequests)
  }, [filteredPendingRequests])

  // Only show this card to admins
  if (!isAdmin) return null

  // Memoize the handler to prevent recreation on each render
  const handleReviewClick = (id: string) => {
    router.push(`/?tab=order-requests&view=${id}`)
  }

  const handleViewAll = () => {
    router.push("/?tab=order-requests")
  }

  // If no pending requests, show a simplified card
  if (pendingRequests.length === 0) {
    return (
      <Card
        className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-gray-200 dark:border-gray-700"
        style={{ contain: "content" }}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-500" />
            Order Requests
          </CardTitle>
          <CardDescription>No pending order requests</CardDescription>
        </CardHeader>
        <CardFooter className="pt-2">
          <Button variant="ghost" size="sm" onClick={handleViewAll} className="ml-auto">
            View All <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card
      className={cn(
        "bg-gradient-to-br border-2",
        "from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-800",
      )}
      style={{ contain: "content" }}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber-500" />
            Order Requests
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-xs" onClick={handleViewAll}>
            View All <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
        <CardDescription>
          You have {pendingRequests.length} pending order request{pendingRequests.length > 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {pendingRequests.slice(0, 3).map((request) => (
            <RequestItem key={request.id} request={request} onClick={handleReviewClick} />
          ))}

          {pendingRequests.length > 3 && (
            <Button variant="outline" className="w-full text-xs" onClick={handleViewAll}>
              View all {pendingRequests.length} requests
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Export as memoized component
export default memo(AdminOrderRequestsCard)
