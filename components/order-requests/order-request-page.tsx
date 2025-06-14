"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import OrderRequestForm from "./order-request-form"
import OrderRequestList from "./order-request-list"
import { FileText, PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

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
  const [activeTab, setActiveTab] = useState("list")

  // Add this useEffect to inject the animation
  useEffect(() => {
    return addBlinkAnimation()
  }, [])

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
          <Button onClick={() => setActiveTab("new")} variant={activeTab === "list" ? "default" : "outline"}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Create New Request
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>View Requests</span>
          </TabsTrigger>
          <TabsTrigger
            value="new"
            className="flex items-center gap-2 relative overflow-hidden animate-pulse border-2 border-transparent before:absolute before:inset-0 before:border-2 before:border-blue-500 dark:before:border-blue-400 before:animate-[blink_1.5s_ease-in-out_infinite]"
          >
            <PlusCircle className="h-4 w-4" />
            <span>New Request</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <OrderRequestList />
        </TabsContent>

        <TabsContent value="new" className="mt-6">
          <OrderRequestForm />
        </TabsContent>
      </Tabs>
    </div>
  )
}
