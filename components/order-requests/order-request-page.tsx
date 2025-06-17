"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import OrderRequestForm from "./order-request-form"
import OrderRequestList from "./order-request-list"
import { FileText, PlusCircle, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useClientContext } from "@/context/client-context"
import { Badge } from "@/components/ui/badge"

// Add this custom animation
const addBlinkAnimation = () => {
  const style = document.createElement("style")
  style.textContent = `
    @keyframes blink {
      0%, 100% { opacity: 0; }
      50% { opacity: 1; }
    }
  `
  document.head.appendChild(style)
  return () => {
    document.head.removeChild(style)
  }
}

export default function OrderRequestPage() {
  const [activeTab, setActiveTab] = useState("pending")
  const { orderRequests } = useClientContext()

  // Add this useEffect to inject the animation
  useEffect(() => {
    return addBlinkAnimation()
  }, [])

  // Count requests by status
  const pendingCount = orderRequests.filter((req) => req.status === "Pending").length
  const approvedCount = orderRequests.filter((req) => req.status === "Approved").length
  const rejectedCount = orderRequests.filter((req) => req.status === "Rejected").length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Order Requests</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={() => window.open("https://ordersbalance.netlify.app/?view=public", "_blank")}
            variant="secondary"
            className="flex items-center"
          >
            <FileText className="h-4 w-4 mr-2 animate-pulse text-yellow-500 drop-shadow-[0_0_3px_rgba(234,179,8,0.5)]" />
            View Client Balance
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending" className="flex items-center gap-2 relative">
            <Clock className="h-4 w-4" />
            <span>Pending</span>
            {pendingCount > 0 && (
              <Badge
                variant="destructive"
                className="ml-1 h-5 w-5 p-0 text-xs flex items-center justify-center animate-pulse"
              >
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <span>Approved</span>
            {approvedCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs flex items-center justify-center">
                {approvedCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>Rejected</span>
            {rejectedCount > 0 && (
              <Badge variant="outline" className="ml-1 h-5 w-5 p-0 text-xs flex items-center justify-center">
                {rejectedCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="new"
            className="flex items-center gap-2 relative overflow-hidden animate-pulse border-2 border-transparent before:absolute before:inset-0 before:border-2 before:border-blue-500 dark:before:border-blue-400 before:animate-[blink_1.5s_ease-in-out_infinite]"
          >
            <PlusCircle className="h-4 w-4" />
            <span>New Request</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <OrderRequestList statusFilter="Pending" />
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          <OrderRequestList statusFilter="Approved" />
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          <OrderRequestList statusFilter="Rejected" />
        </TabsContent>

        <TabsContent value="new" className="mt-6">
          <OrderRequestForm />
        </TabsContent>
      </Tabs>
    </div>
  )
}
