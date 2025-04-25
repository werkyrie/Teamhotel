"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ClientDetails } from "@/components/client-details"
import { ClientOrders } from "@/components/client-orders"
import { FinancialTimeline } from "@/components/financial-timeline"
import DepositModal from "@/components/modals/deposit-modal"
import WithdrawalModal from "@/components/modals/withdrawal-modal"
import { useClientContext } from "@/context/client-context"
import type { Client } from "@/types/client"
import { FileText, Minus, Plus } from "lucide-react"
import { useAuth } from "@/context/auth-context"

export default function ClientPage() {
  const params = useParams()
  const shopId =
    typeof params.shopId === "string" ? params.shopId : Array.isArray(params.shopId) ? params.shopId[0] : ""
  const router = useRouter()
  const { clients } = useClientContext()
  const { isViewer } = useAuth() // Add this line to get the user role
  const [client, setClient] = useState<Client | null>(null)
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false)
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false)

  useEffect(() => {
    if (shopId && clients && clients.length > 0) {
      const foundClient = clients.find((c) => c.shopId === shopId)
      setClient(foundClient || null)
    }
  }, [shopId, clients])

  if (!client) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Client Not Found</h1>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Client: {client.clientName}</h1>
        <div className="flex gap-2">
          {isViewer ? (
            <Button onClick={() => router.push("/?tab=order-requests")}>
              <FileText className="mr-2 h-4 w-4" /> Request Order
            </Button>
          ) : (
            <>
              <Button onClick={() => setIsDepositModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Deposit
              </Button>
              <Button onClick={() => setIsWithdrawalModalOpen(true)}>
                <Minus className="mr-2 h-4 w-4" /> Add Withdrawal
              </Button>
            </>
          )}
          <Button variant="outline" onClick={() => router.push("/")}>
            Go Back
          </Button>
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList className="mb-4">
          <TabsTrigger value="details">Client Details</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="financial">Financial Timeline</TabsTrigger>
        </TabsList>
        <TabsContent value="details">
          <ClientDetails client={client} />
        </TabsContent>
        <TabsContent value="orders">
          <ClientOrders shopId={client.shopId} />
        </TabsContent>
        <TabsContent value="financial">
          <FinancialTimeline shopId={client.shopId} />
        </TabsContent>
      </Tabs>

      {isDepositModalOpen && (
        <DepositModal
          mode="add"
          isOpen={isDepositModalOpen}
          onClose={() => setIsDepositModalOpen(false)}
          deposit={{
            depositId: "",
            shopId: client.shopId,
            clientName: client.clientName,
            agent: client.agent,
            date: new Date().toISOString().split("T")[0],
            amount: 0,
            paymentMode: "Crypto",
          }}
        />
      )}

      {isWithdrawalModalOpen && (
        <WithdrawalModal
          mode="add"
          isOpen={isWithdrawalModalOpen}
          onClose={() => setIsWithdrawalModalOpen(false)}
          withdrawal={{
            withdrawalId: "",
            shopId: client.shopId,
            clientName: client.clientName,
            agent: client.agent,
            date: new Date().toISOString().split("T")[0],
            amount: 0,
            paymentMode: "Crypto",
          }}
        />
      )}
    </div>
  )
}
