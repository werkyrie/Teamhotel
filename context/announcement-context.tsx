"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import type { Announcement, AnnouncementFormData } from "@/types/announcement"

interface AnnouncementContextType {
  announcements: Announcement[]
  activeAnnouncement: Announcement | null
  loading: boolean
  createAnnouncement: (data: AnnouncementFormData) => Promise<void>
  updateAnnouncement: (id: string, data: Partial<AnnouncementFormData>) => Promise<void>
  deleteAnnouncement: (id: string) => Promise<void>
  activateAnnouncement: (id: string) => Promise<void>
  deactivateAnnouncement: (id: string) => Promise<void>
  dismissAnnouncement: (id: string) => void
  isDismissed: (id: string) => boolean
}

const AnnouncementContext = createContext<AnnouncementContextType | undefined>(undefined)

export function AnnouncementProvider({ children }: { children: React.ReactNode }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [activeAnnouncement, setActiveAnnouncement] = useState<Announcement | null>(null)
  const [loading, setLoading] = useState(true)
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<string[]>([])
  const { user, isAdmin } = useAuth()
  const { toast } = useToast()

  // Load dismissed announcements from localStorage
  useEffect(() => {
    const dismissed = localStorage.getItem("dismissedAnnouncements")
    if (dismissed) {
      setDismissedAnnouncements(JSON.parse(dismissed))
    }
  }, [])

  // Listen to announcements from Firestore
  useEffect(() => {
    if (!user) return

    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const announcementData: Announcement[] = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          announcementData.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            expiresAt: data.expiresAt?.toDate() || undefined,
          } as Announcement)
        })

        setAnnouncements(announcementData)

        // Find active announcement for non-admin users
        if (!isAdmin) {
          const active = announcementData.find((ann) => ann.isActive && (!ann.expiresAt || ann.expiresAt > new Date()))
          console.log("Setting active announcement for viewer:", active)
          console.log("User is admin:", isAdmin)
          console.log("All announcements:", announcementData)
          setActiveAnnouncement(active || null)
        }

        setLoading(false)
      },
      (error) => {
        console.error("Error fetching announcements:", error)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [user, isAdmin])

  const createAnnouncement = async (data: AnnouncementFormData) => {
    if (!user || !isAdmin) {
      toast({
        title: "Error",
        description: "Only admins can create announcements",
        variant: "destructive",
      })
      return
    }

    try {
      await addDoc(collection(db, "announcements"), {
        ...data,
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: user.uid,
        expiresAt: data.expiresAt || null,
      })

      toast({
        title: "Success",
        description: "Announcement created successfully",
      })
    } catch (error) {
      console.error("Error creating announcement:", error)
      toast({
        title: "Error",
        description: "Failed to create announcement",
        variant: "destructive",
      })
    }
  }

  const updateAnnouncement = async (id: string, data: Partial<AnnouncementFormData>) => {
    if (!user || !isAdmin) {
      toast({
        title: "Error",
        description: "Only admins can update announcements",
        variant: "destructive",
      })
      return
    }

    try {
      await updateDoc(doc(db, "announcements", id), {
        ...data,
        updatedAt: new Date(),
      })

      toast({
        title: "Success",
        description: "Announcement updated successfully",
      })
    } catch (error) {
      console.error("Error updating announcement:", error)
      toast({
        title: "Error",
        description: "Failed to update announcement",
        variant: "destructive",
      })
    }
  }

  const deleteAnnouncement = async (id: string) => {
    if (!user || !isAdmin) {
      toast({
        title: "Error",
        description: "Only admins can delete announcements",
        variant: "destructive",
      })
      return
    }

    try {
      await deleteDoc(doc(db, "announcements", id))

      toast({
        title: "Success",
        description: "Announcement deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting announcement:", error)
      toast({
        title: "Error",
        description: "Failed to delete announcement",
        variant: "destructive",
      })
    }
  }

  const activateAnnouncement = async (id: string) => {
    if (!user || !isAdmin) return

    try {
      // First deactivate all other announcements
      const batch = announcements.map(async (ann) => {
        if (ann.id !== id && ann.isActive) {
          await updateDoc(doc(db, "announcements", ann.id), {
            isActive: false,
            updatedAt: new Date(),
          })
        }
      })

      await Promise.all(batch)

      // Then activate the selected one
      await updateDoc(doc(db, "announcements", id), {
        isActive: true,
        updatedAt: new Date(),
      })

      toast({
        title: "Success",
        description: "Announcement activated successfully",
      })
    } catch (error) {
      console.error("Error activating announcement:", error)
      toast({
        title: "Error",
        description: "Failed to activate announcement",
        variant: "destructive",
      })
    }
  }

  const deactivateAnnouncement = async (id: string) => {
    if (!user || !isAdmin) return

    try {
      await updateDoc(doc(db, "announcements", id), {
        isActive: false,
        updatedAt: new Date(),
      })

      toast({
        title: "Success",
        description: "Announcement deactivated successfully",
      })
    } catch (error) {
      console.error("Error deactivating announcement:", error)
      toast({
        title: "Error",
        description: "Failed to deactivate announcement",
        variant: "destructive",
      })
    }
  }

  const dismissAnnouncement = (id: string) => {
    const newDismissed = [...dismissedAnnouncements, id]
    setDismissedAnnouncements(newDismissed)
    localStorage.setItem("dismissedAnnouncements", JSON.stringify(newDismissed))

    // Hide the active announcement if it's the one being dismissed
    if (activeAnnouncement?.id === id) {
      setActiveAnnouncement(null)
    }
  }

  const isDismissed = (id: string) => {
    return dismissedAnnouncements.includes(id)
  }

  const value = {
    announcements,
    activeAnnouncement: activeAnnouncement && !isDismissed(activeAnnouncement.id) ? activeAnnouncement : null,
    loading,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    activateAnnouncement,
    deactivateAnnouncement,
    dismissAnnouncement,
    isDismissed,
  }

  return <AnnouncementContext.Provider value={value}>{children}</AnnouncementContext.Provider>
}

export function useAnnouncements() {
  const context = useContext(AnnouncementContext)
  if (context === undefined) {
    throw new Error("useAnnouncements must be used within an AnnouncementProvider")
  }
  return context
}
