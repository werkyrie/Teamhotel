"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import InventoryTable from "./inventory-table"
import AddDeviceForm from "./add-device-form"
import AgentStatistics from "./agent-statistics"
import type { DeviceInventory, AgentStats } from "@/types/inventory"
import { db } from "@/lib/firebase"
import { collection, query, orderBy, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

export default function InventoryPage() {
  const [devices, setDevices] = useState<DeviceInventory[]>([])
  const [filteredDevices, setFilteredDevices] = useState<DeviceInventory[]>([])
  const [agentStats, setAgentStats] = useState<AgentStats>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("inventory")
  const { toast } = useToast()

  // Fetch devices from Firebase
  useEffect(() => {
    setLoading(true)
    console.log("Fetching inventory data from Firebase...")

    try {
      const inventoryRef = collection(db, "inventory")
      const q = query(inventoryRef, orderBy("createdAt", "desc"))

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          console.log(`Received ${snapshot.docs.length} devices from Firebase`)
          const deviceData: DeviceInventory[] = []
          snapshot.forEach((doc) => {
            deviceData.push({ id: doc.id, ...doc.data() } as DeviceInventory)
          })
          setDevices(deviceData)
          setFilteredDevices(deviceData)
          updateAgentStats(deviceData)
          setLoading(false)
        },
        (error) => {
          console.error("Error fetching inventory:", error)
          toast({
            title: "Error",
            description: "Failed to load inventory data: " + error.message,
            variant: "destructive",
          })
          setLoading(false)
        },
      )

      return () => unsubscribe()
    } catch (error) {
      console.error("Error setting up Firebase listener:", error)
      toast({
        title: "Error",
        description: "Failed to connect to the database",
        variant: "destructive",
      })
      setLoading(false)
    }
  }, [toast])

  // Update agent statistics
  const updateAgentStats = (deviceData: DeviceInventory[]) => {
    const stats: AgentStats = {}
    deviceData.forEach((device) => {
      stats[device.agent] = (stats[device.agent] || 0) + 1
    })
    setAgentStats(stats)
  }

  // Handle search
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredDevices(devices)
    } else {
      const term = searchTerm.toLowerCase()
      const filtered = devices.filter((device) => {
        return (
          device.agent.toLowerCase().includes(term) ||
          device.imei.toLowerCase().includes(term) ||
          device.model.toLowerCase().includes(term) ||
          device.color.toLowerCase().includes(term) ||
          (device.appleIdUsername && device.appleIdUsername.toLowerCase().includes(term)) ||
          (device.remarks && device.remarks.toLowerCase().includes(term))
        )
      })
      setFilteredDevices(filtered)
    }
  }, [searchTerm, devices])

  // Add new device
  const addDevice = async (device: DeviceInventory) => {
    try {
      const newDevice = {
        ...device,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      // Check for duplicate IMEI
      const isDuplicate = devices.some((d) => d.imei === device.imei)
      if (isDuplicate) {
        toast({
          title: "Error",
          description: "This IMEI already exists in the inventory",
          variant: "destructive",
        })
        return false
      }

      const docRef = doc(collection(db, "inventory"))
      await setDoc(docRef, newDevice)

      toast({
        title: "Success",
        description: "Device added successfully",
      })

      setActiveTab("inventory")
      return true
    } catch (error) {
      console.error("Error adding device:", error)
      toast({
        title: "Error",
        description: "Failed to add device: " + (error as Error).message,
        variant: "destructive",
      })
      return false
    }
  }

  // Update device
  const updateDevice = async (id: string, updatedDevice: Partial<DeviceInventory>) => {
    try {
      // Check for duplicate IMEI if IMEI is being updated
      if (updatedDevice.imei) {
        const isDuplicate = devices.some((d) => d.id !== id && d.imei === updatedDevice.imei)
        if (isDuplicate) {
          toast({
            title: "Error",
            description: "This IMEI already exists in the inventory",
            variant: "destructive",
          })
          return false
        }
      }

      const deviceRef = doc(db, "inventory", id)
      await setDoc(
        deviceRef,
        {
          ...updatedDevice,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )

      toast({
        title: "Success",
        description: "Device updated successfully",
      })
      return true
    } catch (error) {
      console.error("Error updating device:", error)
      toast({
        title: "Error",
        description: "Failed to update device: " + (error as Error).message,
        variant: "destructive",
      })
      return false
    }
  }

  // Delete device
  const deleteDevice = async (id: string) => {
    try {
      await deleteDoc(doc(db, "inventory", id))
      toast({
        title: "Success",
        description: "Device deleted successfully",
      })
      return true
    } catch (error) {
      console.error("Error deleting device:", error)
      toast({
        title: "Error",
        description: "Failed to delete device: " + (error as Error).message,
        variant: "destructive",
      })
      return false
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Device Inventory Management</h1>
        <p className="text-muted-foreground">Track and manage all your devices in one place</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-3">
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="add-device">Add New Device</TabsTrigger>
          <TabsTrigger value="stats">Agent Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Device Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex h-40 w-full items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <InventoryTable
                  devices={filteredDevices}
                  onDelete={deleteDevice}
                  onUpdate={updateDevice}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add-device">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Add New Device</CardTitle>
            </CardHeader>
            <CardContent>
              <AddDeviceForm onSubmit={addDevice} agentNames={Object.keys(agentStats)} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Agent Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex h-40 w-full items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <AgentStatistics agentStats={agentStats} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
