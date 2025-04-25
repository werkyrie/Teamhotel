import type { Client, Order, Deposit, Withdrawal } from "@/types/client"
import { format } from "date-fns"

// Get today's date and format it
const today = format(new Date(), "yyyy-MM-dd")
// Get yesterday's date and format it
const yesterday = format(new Date(Date.now() - 86400000), "yyyy-MM-dd")
// Get date from 2 days ago
const twoDaysAgo = format(new Date(Date.now() - 86400000 * 2), "yyyy-MM-dd")

export const sampleClients: Client[] = [
  {
    shopId: "SHOP001",
    clientName: "John Smith",
    agent: "KY",
    kycDate: yesterday,
    status: "Active",
    notes: "Regular customer",
  },
  {
    shopId: "SHOP002",
    clientName: "Jane Doe",
    agent: "LOVELY",
    kycDate: twoDaysAgo,
    status: "In Process",
    notes: "New customer, pending verification",
  },
  {
    shopId: "SHOP003",
    clientName: "Robert Johnson",
    agent: "JHE",
    kycDate: today,
    status: "Active",
    notes: "VIP customer",
  },
]

export const sampleOrders: Order[] = [
  {
    orderId: "OR00001",
    shopId: "SHOP001",
    clientName: "John Smith",
    agent: "KY",
    date: yesterday,
    location: "New York",
    price: 250.5,
    status: "Completed",
  },
  {
    orderId: "OR00002",
    shopId: "SHOP001",
    clientName: "John Smith",
    agent: "KY",
    date: today,
    location: "Boston",
    price: 120.75,
    status: "Processing",
  },
  {
    orderId: "OR00003",
    shopId: "SHOP002",
    clientName: "Jane Doe",
    agent: "LOVELY",
    date: today,
    location: "Chicago",
    price: 350.0,
    status: "Pending",
  },
]

export const sampleDeposits: Deposit[] = [
  {
    depositId: "DP00001",
    shopId: "SHOP001",
    clientName: "John Smith",
    agent: "KY",
    date: twoDaysAgo,
    amount: 500.0,
    paymentMode: "Crypto",
  },
  {
    depositId: "DP00002",
    shopId: "SHOP003",
    clientName: "Robert Johnson",
    agent: "JHE",
    date: yesterday,
    amount: 1000.0,
    paymentMode: "Online Banking",
  },
]

export const sampleWithdrawals: Withdrawal[] = [
  {
    withdrawalId: "WD00001",
    shopId: "SHOP001",
    clientName: "John Smith",
    agent: "KY",
    date: today,
    amount: 200.0,
    paymentMode: "Ewallet",
  },
]
