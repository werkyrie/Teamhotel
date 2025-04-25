export interface Agent {
  id: string
  name: string
  addedToday: number
  monthlyAdded: number
  openAccounts: number
  totalDeposits: number
  totalWithdrawals?: number
  commission?: number
  commissionRate?: number
  email?: string
  phone?: string
  position?: string
  joinDate?: string
  status?: "Active" | "Inactive"
  lastEditedBy?: string
  lastEditedAt?: string
}

export interface Penalty {
  id: string
  agentId: string
  agentName: string
  description: string
  amount: number
  date: string
}

export interface Reward {
  id: string
  agentId: string
  agentName: string
  description: string
  amount: number
  date: string
  status: "Received" | "Pending" | "Cancelled"
}

export interface Attendance {
  id: string
  agentId: string
  agentName: string
  date: string
  status: "Whole Day" | "Half Day" | "Leave" | "Undertime"
  remarks: string
}

export interface TeamMetrics {
  totalAgents: number
  totalAddedToday: number
  totalMonthlyAdded: number
  totalOpenAccounts: number
  totalDeposits: number
}
