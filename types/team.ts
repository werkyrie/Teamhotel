export interface Agent {
  id: string
  name: string
  nickname: string
  email: string
  status?: "Active" | "Inactive"
  role?: "Team Leader" | "Elite" | "Regular" | "Spammer"
  joinDate?: string
  addedToday: number
  monthlyAdded: number
  openAccounts: number
  totalDeposits: number
  totalWithdrawals?: number
  commission?: number
  commissionRate?: number
  lastEditedBy?: string
  lastEditedAt?: string
}

export interface Penalty {
  id: string
  agentId: string
  agentName: string
  amount: number
  description: string
  date: string
}

export interface Reward {
  id: string
  agentId: string
  agentName: string
  amount: number
  description: string
  date: string
}

export interface Attendance {
  id: string
  agentId: string
  agentName: string
  date: string
  status: "Whole Day" | "Half Day" | "Leave" | "Undertime"
  remarks?: string
}

export interface TeamMetrics {
  totalAgents: number
  totalAddedToday: number
  totalMonthlyAdded: number
  totalOpenAccounts: number
  totalDeposits: number
}

export interface TeamStats {
  totalAgents: number
  activeAgents: number
  totalClients: number
  totalDeposits: number
  totalWithdrawals: number
  topAgent: string
}
