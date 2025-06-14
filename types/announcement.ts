export interface Announcement {
  id: string
  title: string
  message: string
  type: "info" | "warning" | "success" | "error"
  priority: "low" | "medium" | "high"
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string
  expiresAt?: Date
  imageUrl?: string
  backgroundColor?: string
  textColor?: string
}

export interface AnnouncementFormData {
  title: string
  message: string
  type: "info" | "warning" | "success" | "error"
  priority: "low" | "medium" | "high"
  expiresAt?: Date
  imageUrl?: string
  backgroundColor?: string
  textColor?: string
}
