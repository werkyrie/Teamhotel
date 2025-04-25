import type React from "react"
export interface Client {
  shopId: string
  clientName: string
  agent: Agent
  kycDate: string
  status: ClientStatus
  notes?: string
}

export type Agent = string

export type ClientStatus = "Active" | "Inactive" | "In Process" | "Eliminated"

export interface Order {
  orderId: string
  shopId: string
  clientName: string
  agent: Agent
  date: string
  location: string
  price: number
  status: OrderStatus
}

export type OrderStatus = "Pending" | "Processing" | "Completed"

export interface Deposit {
  depositId: string
  shopId: string
  clientName: string
  agent: Agent
  date: string
  amount: number
  paymentMode: PaymentMode
}

export interface Withdrawal {
  withdrawalId: string
  shopId: string
  clientName: string
  agent: Agent
  date: string
  amount: number
  paymentMode: PaymentMode
}

export type PaymentMode = "Crypto" | "Online Banking" | "Ewallet"

export interface OrderRequest {
  id: string
  shopId: string
  clientName: string
  agent: Agent
  date: string | Date
  location: string
  price: number
  status: OrderRequestStatus
  remarks?: string
  createdAt: number
}

export type OrderRequestStatus = "Pending" | "Approved" | "Rejected"

export interface TimelineEvent {
  id: string
  type: "order" | "deposit" | "withdrawal"
  date: string
  amount: number
  status?: string
  location?: string
  paymentMode?: string
}

// New interface for chat messages
export interface ChatMessage {
  id: string
  orderRequestId: string
  userId: string
  userName: string
  content: string
  timestamp: number
  isAdmin: boolean
  readBy?: string[]
}

// Update the ClientContextType interface to include the new bulk functions
export interface ClientContextType {
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
  resetAllData: () => Promise<void>
  exportData: () => Promise<string>
  importData: (jsonData: string) => Promise<void>
  bulkAddDeposits: (deposits: Deposit[]) => Promise<void>
  bulkAddWithdrawals: (withdrawals: Withdrawal[]) => Promise<void>
  refreshData: () => Promise<void>
  setDeposits: React.Dispatch<React.SetStateAction<Deposit[]>>
  setWithdrawals: React.Dispatch<React.SetStateAction<Withdrawal[]>>
  addChatMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => Promise<void>
  getChatMessages: (orderRequestId: string) => Promise<ChatMessage[]>
}
