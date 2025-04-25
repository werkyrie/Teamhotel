"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import OrderRequestForm from "./order-request-form"
import OrderRequestList from "./order-request-list"
import { FileText, PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function OrderRequestPage() {
  const [activeTab, setActiveTab] = useState("list")

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Order Requests</h2>
        <Button onClick={() => setActiveTab("new")} variant={activeTab === "list" ? "default" : "outline"}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Create New Request
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>View Requests</span>
          </TabsTrigger>
          <TabsTrigger value="new" className="flex items-center gap-2">
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
