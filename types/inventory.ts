export interface DeviceInventory {
  id?: string
  agent: string
  imei: string
  model: string
  color: string
  appleIdUsername?: string
  password?: string
  dateChecked: string
  remarks?: string
  createdAt?: number
  updatedAt?: number
}

export interface AgentStats {
  [agent: string]: number
}
