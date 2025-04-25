"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { Client, Order, Deposit, Withdrawal, OrderRequest, OrderRequestStatus } from "@/types/client"

interface ClientContextType {
  clients: Client[]
  orders: Order[]
  deposits: Deposit[]
  withdrawals: Withdrawal[]
  orderRequests: OrderRequest[]
  loading: boolean
  addClient: (client: Client) => Promise<void>
  updateClient: (client: Client) => Promise<void>
  deleteClient: (shopId: string) => Promise<void>
  bulkDeleteClients: (shopIds: string[]) => Promise<void>
  addOrder: (order: Order) => Promise<void>
  updateOrder: (order: Order) => Promise<void>
  deleteOrder: (orderId: string) => Promise<void>
  addDeposit: (deposit: Deposit) => Promise<void>
  updateDeposit: (deposit: Deposit) => Promise<void>
  deleteDeposit: (depositId: string) => Promise<void>
  addWithdrawal: (withdrawal: Withdrawal) => Promise<void>
  updateWithdrawal: (withdrawal: Withdrawal) => Promise<void>
  deleteWithdrawal: (withdrawalId: string) => Promise<void>
  addOrderRequest: (request: Omit<OrderRequest, "id" | "status" | "createdAt">) => Promise<void>
  updateOrderRequestStatus: (id: string, status: OrderRequestStatus) => Promise<void>
  deleteOrderRequest: (id: string) => Promise<void>
  isShopIdUnique: (shopId: string, currentId?: string) => Promise<boolean>
  generateOrderId: () => string
  generateDepositId: () => string
  generateWithdrawalId: () => string
  resetAllData: () => void
  exportData: () => string
  importData: (jsonData: string) => void
  bulkAddDeposits: (newDeposits: Deposit[]) => void
  bulkAddWithdrawals: (newWithdrawals: Withdrawal[]) => void
}

const ClientContext = createContext<ClientContextType | undefined>(undefined)

export function ClientProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [orderRequests, setOrderRequests] = useState<OrderRequest[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Load data from localStorage on initial render
    const savedClients = localStorage.getItem("clients")
    const savedOrders = localStorage.getItem("orders")
    const savedDeposits = localStorage.getItem("deposits")
    const savedWithdrawals = localStorage.getItem("withdrawals")
    const savedOrderRequests = localStorage.getItem("orderRequests")

    if (savedClients) setClients(JSON.parse(savedClients))
    if (savedOrders) setOrders(JSON.parse(savedOrders))
    if (savedDeposits) setDeposits(JSON.parse(savedDeposits))
    if (savedWithdrawals) setWithdrawals(JSON.parse(savedWithdrawals))
    if (savedOrderRequests) setOrderRequests(JSON.parse(savedOrderRequests))

    setLoading(false)
  }, [])

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("clients", JSON.stringify(clients))
  }, [clients])

  useEffect(() => {
    localStorage.setItem("orders", JSON.stringify(orders))
  }, [orders])

  useEffect(() => {
    localStorage.setItem("deposits", JSON.stringify(deposits))
  }, [deposits])

  useEffect(() => {
    localStorage.setItem("withdrawals", JSON.stringify(withdrawals))
  }, [withdrawals])

  useEffect(() => {
    localStorage.setItem("orderRequests", JSON.stringify(orderRequests))
  }, [orderRequests])

  // Check if a Shop ID is unique
  const isShopIdUnique = (shopId: string, currentId?: string): boolean => {
    return !clients.some((client) => client.shopId === shopId && client.shopId !== currentId)
  }

  // Generate unique IDs
  const generateOrderId = (): string => {
    const lastOrder = orders.length > 0 ? Number.parseInt(orders[orders.length - 1].orderId.replace("OR", "")) : 0
    const newId = lastOrder + 1
    return `OR${newId.toString().padStart(5, "0")}`
  }

  const generateDepositId = (): string => {
    const lastDeposit =
      deposits.length > 0 ? Number.parseInt(deposits[deposits.length - 1].depositId.replace("DP", "")) : 0
    const newId = lastDeposit + 1
    return `DP${newId.toString().padStart(5, "0")}`
  }

  const generateWithdrawalId = (): string => {
    const lastWithdrawal =
      withdrawals.length > 0 ? Number.parseInt(withdrawals[withdrawals.length - 1].withdrawalId.replace("WD", "")) : 0
    const newId = lastWithdrawal + 1
    return `WD${newId.toString().padStart(5, "0")}`
  }

  // Client CRUD operations
  const addClient = (client: Client) => {
    setClients((prev) => [...prev, client])
  }

  const updateClient = (updatedClient: Client) => {
    setClients((prev) => prev.map((client) => (client.shopId === updatedClient.shopId ? updatedClient : client)))
  }

  const deleteClient = (shopId: string) => {
    setClients((prev) => prev.filter((client) => client.shopId !== shopId))
  }

  const bulkDeleteClients = async (shopIds: string[]) => {
    setClients((prev) => prev.filter((client) => !shopIds.includes(client.shopId)))
  }

  // Order CRUD operations
  const addOrder = (order: Order) => {
    setOrders((prev) => [...prev, order])
  }

  const updateOrder = (updatedOrder: Order) => {
    setOrders((prev) => prev.map((order) => (order.orderId === updatedOrder.orderId ? updatedOrder : order)))
  }

  const deleteOrder = (orderId: string) => {
    setOrders((prev) => prev.filter((order) => order.orderId !== orderId))
  }

  // Deposit CRUD operations
  const addDeposit = (deposit: Deposit) => {
    setDeposits((prev) => {
      const newDeposits = [...prev, deposit]
      return newDeposits
    })
  }

  const updateDeposit = (updatedDeposit: Deposit) => {
    setDeposits((prev) =>
      prev.map((deposit) => (deposit.depositId === updatedDeposit.depositId ? updatedDeposit : deposit)),
    )
  }

  const deleteDeposit = (depositId: string) => {
    setDeposits((prev) => prev.filter((deposit) => deposit.depositId !== depositId))
  }

  // Withdrawal CRUD operations
  const addWithdrawal = (withdrawal: Withdrawal) => {
    setWithdrawals((prev) => {
      const newWithdrawals = [...prev, withdrawal]
      return newWithdrawals
    })
  }

  const updateWithdrawal = (updatedWithdrawal: Withdrawal) => {
    setWithdrawals((prev) =>
      prev.map((withdrawal) =>
        withdrawal.withdrawalId === updatedWithdrawal.withdrawalId ? updatedWithdrawal : withdrawal,
      ),
    )
  }

  const deleteWithdrawal = (withdrawalId: string) => {
    setWithdrawals((prev) => prev.filter((withdrawal) => withdrawal.withdrawalId !== withdrawalId))
  }

  // Order Request CRUD operations
  const addOrderRequest = (request: Omit<OrderRequest, "id" | "status" | "createdAt">) => {
    const newRequest: OrderRequest = {
      ...request,
      id: Math.random().toString(36).substring(2, 9),
      status: "Pending",
      createdAt: Date.now(),
    }
    setOrderRequests((prev) => [...prev, newRequest])
  }

  const updateOrderRequestStatus = (id: string, status: OrderRequestStatus) => {
    setOrderRequests((prev) => prev.map((request) => (request.id === id ? { ...request, status } : request)))
  }

  const deleteOrderRequest = (id: string) => {
    setOrderRequests((prev) => prev.filter((request) => request.id !== id))
  }

  // Reset all data
  const resetAllData = () => {
    setClients([])
    setOrders([])
    setDeposits([])
    setWithdrawals([])
    setOrderRequests([])
  }

  // Export data as JSON
  const exportData = (): string => {
    const data = {
      clients,
      orders,
      deposits,
      withdrawals,
      orderRequests,
    }
    return JSON.stringify(data, null, 2)
  }

  // Import data from JSON
  const importData = (jsonData: string) => {
    try {
      const data = JSON.parse(jsonData)
      setClients(data.clients || [])
      setOrders(data.orders || [])
      setDeposits(data.deposits || [])
      setWithdrawals(data.withdrawals || [])
      setOrderRequests(data.orderRequests || [])
    } catch (error) {
      console.error("Error importing data:", error)
    }
  }

  // Add this function to directly update deposits
  const bulkAddDeposits = (newDeposits: Deposit[]) => {
    setDeposits((prev) => {
      const updatedDeposits = [...prev, ...newDeposits]
      // Force update localStorage
      localStorage.setItem("deposits", JSON.stringify(updatedDeposits))
      return updatedDeposits
    })
  }

  // Add this function to directly update withdrawals
  const bulkAddWithdrawals = (newWithdrawals: Withdrawal[]) => {
    setWithdrawals((prev) => {
      const updatedWithdrawals = [...prev, ...newWithdrawals]
      // Force update localStorage
      localStorage.setItem("withdrawals", JSON.stringify(updatedWithdrawals))
      return updatedWithdrawals
    })
  }

  // Update the ClientContext.Provider value to include these new functions
  return (
    <ClientContext.Provider
      value={{
        clients,
        orders,
        deposits,
        withdrawals,
        orderRequests,
        loading,
        addClient,
        updateClient,
        deleteClient,
        bulkDeleteClients,
        addOrder,
        updateOrder,
        deleteOrder,
        addDeposit,
        updateDeposit,
        deleteDeposit,
        addWithdrawal,
        updateWithdrawal,
        deleteWithdrawal,
        bulkAddDeposits,
        bulkAddWithdrawals,
        addOrderRequest,
        updateOrderRequestStatus,
        deleteOrderRequest,
        isShopIdUnique,
        generateOrderId,
        generateDepositId,
        generateWithdrawalId,
        resetAllData,
        exportData,
        importData,
      }}
    >
      {children}
    </ClientContext.Provider>
  )
}

export function useClientContext() {
  const context = useContext(ClientContext)
  if (context === undefined) {
    throw new Error("useClientContext must be used within a ClientProvider")
  }
  return context
}
