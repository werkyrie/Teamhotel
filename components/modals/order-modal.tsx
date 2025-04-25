"use client"

import { useState, useEffect } from "react"
import { useClientContext } from "@/context/client-context"
import type { Order, Client, OrderStatus } from "@/types/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { format } from "date-fns"
import { AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

interface OrderModalProps {
  mode: "add" | "edit"
  order: Order | null
  isOpen: boolean
  onClose: () => void
}

export default function OrderModal({ mode, order, isOpen, onClose }: OrderModalProps) {
  const { clients, addOrder, updateOrder, generateOrderId } = useClientContext()
  const { toast } = useToast()

  // Form state
  const [orderId, setOrderId] = useState("")
  const [shopId, setShopId] = useState("")
  const [clientName, setClientName] = useState("")
  const [agent, setAgent] = useState("")
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [location, setLocation] = useState("")
  const [price, setPrice] = useState(0)
  const [status, setStatus] = useState<OrderStatus>("Pending")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Validation state
  const [shopIdError, setShopIdError] = useState("")
  const [locationError, setLocationError] = useState("")
  const [priceError, setPriceError] = useState("")

  // Available clients for dropdown
  const [availableClients, setAvailableClients] = useState<Client[]>([])

  // Add these new state variables and functions at the top of the component
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredClients, setFilteredClients] = useState<Client[]>([])

  // Add this function to get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-500"
      case "Inactive":
        return "bg-gray-500"
      case "In Process":
        return "bg-yellow-500"
      case "Eliminated":
        return "bg-red-500"
      default:
        return "bg-blue-500"
    }
  }

  // Initialize form with order data if in edit mode
  useEffect(() => {
    const initializeForm = async () => {
      if (clients && clients.length > 0) {
        setAvailableClients(clients)
        setFilteredClients(clients)
      }

      if (mode === "edit" && order) {
        setOrderId(order.orderId)
        setShopId(order.shopId)
        setClientName(order.clientName)
        setAgent(order.agent)
        setDate(typeof order.date === "string" ? order.date : format(new Date(order.date), "yyyy-MM-dd"))
        setLocation(order.location)
        setPrice(order.price)
        setStatus(order.status)
      } else {
        // Reset form for add mode
        try {
          const newOrderId = await generateOrderId()
          setOrderId(newOrderId)
        } catch (error) {
          console.error("Error generating order ID:", error)
          setOrderId(`OR${Date.now().toString()}`)
        }
        setShopId("")
        setClientName("")
        setAgent("")
        setDate(format(new Date(), "yyyy-MM-dd"))
        setLocation("")
        setPrice(0)
        setStatus("Pending")
      }
    }

    initializeForm()
  }, [mode, order, clients, generateOrderId])

  // Update client name and agent when shop ID changes
  useEffect(() => {
    if (shopId && clients) {
      const selectedClient = clients.find((client) => client.shopId === shopId)
      if (selectedClient) {
        setClientName(selectedClient.clientName)
        setAgent(selectedClient.agent)
      }
    }
  }, [shopId, clients])

  // Filter clients based on search term
  useEffect(() => {
    if (searchTerm && availableClients) {
      const term = searchTerm.toLowerCase()
      const filtered = availableClients.filter(
        (client) =>
          (client.shopId && client.shopId.toLowerCase().includes(term)) ||
          (client.clientName && client.clientName.toLowerCase().includes(term)),
      )
      setFilteredClients(filtered)
    } else {
      setFilteredClients(availableClients)
    }
  }, [searchTerm, availableClients])

  // Validate shop ID
  const validateShopId = (shopIdToValidate?: string) => {
    const shopIdValue = shopIdToValidate || shopId
    if (!shopIdValue) {
      setShopIdError("Shop ID is required")
      return false
    }

    if (!clients) {
      setShopIdError("No clients available")
      return false
    }

    const clientExists = clients.some((client) => client.shopId === shopIdValue)
    if (!clientExists) {
      setShopIdError("Client with this Shop ID does not exist")
      return false
    }

    setShopIdError("")
    return true
  }

  // Validate location
  const validateLocation = () => {
    if (!location) {
      setLocationError("Location is required")
      return false
    }

    setLocationError("")
    return true
  }

  // Validate price
  const validatePrice = () => {
    if (price <= 0) {
      setPriceError("Price must be greater than 0")
      return false
    }

    setPriceError("")
    return true
  }

  // Handle form submission
  const handleSubmit = async () => {
    // Validate form
    const isShopIdValid = validateShopId()
    const isLocationValid = validateLocation()
    const isPriceValid = validatePrice()

    if (!isShopIdValid || !isLocationValid || !isPriceValid) {
      return
    }

    setIsSubmitting(true)

    try {
      const orderData: Order = {
        orderId,
        shopId,
        clientName,
        agent,
        date,
        location,
        price,
        status,
      }

      if (mode === "add") {
        await addOrder(orderData)
        toast({
          title: "Order Added",
          description: `Order ${orderId} has been added successfully.`,
          variant: "success",
        })
      } else if (mode === "edit" && order) {
        await updateOrder(orderData)
        toast({
          title: "Order Updated",
          description: `Order ${orderId} has been updated successfully.`,
          variant: "success",
        })
      }

      onClose()
    } catch (error) {
      console.error("Error submitting order:", error)
      toast({
        title: "Error",
        description: "There was an error processing your request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Add New Order" : "Edit Order"}</DialogTitle>
          <DialogDescription>
            {mode === "add" ? "Fill in the details to add a new order" : "Update order information"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {mode === "edit" && (
            <div className="space-y-2">
              <Label htmlFor="orderId">Order ID</Label>
              <Input id="orderId" value={orderId} readOnly />
            </div>
          )}

          {/* Replace the Shop ID select dropdown with an enhanced searchable version */}
          <div className="space-y-2">
            <Label htmlFor="shopId">Shop ID</Label>
            <div className="relative">
              <Input
                id="shopIdSearch"
                placeholder="Search by Shop ID or Client Name"
                value={searchTerm || ""}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                }}
                className={shopIdError ? "border-red-500" : ""}
                disabled={mode === "edit"}
              />
              {searchTerm && filteredClients && filteredClients.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                  {filteredClients.map((client) => (
                    <div
                      key={client.shopId}
                      className="p-2 hover:bg-muted cursor-pointer flex justify-between items-center"
                      onClick={() => {
                        setShopId(client.shopId)
                        setSearchTerm("")
                        validateShopId(client.shopId)
                      }}
                    >
                      <div>
                        <div className="font-medium">{client.shopId}</div>
                        <div className="text-sm text-muted-foreground">{client.clientName}</div>
                      </div>
                      {client.status && <Badge className={getStatusColor(client.status)}>{client.status}</Badge>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {shopIdError && (
              <div className="text-sm text-red-500 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {shopIdError}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name</Label>
              <Input id="clientName" value={clientName} readOnly />
            </div>

            <div className="space-y-2">
              <Label htmlFor="agent">Agent</Label>
              <Input id="agent" value={agent} readOnly />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={format(new Date(), "yyyy-MM-dd")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value)
                validateLocation()
              }}
              placeholder="Enter location"
              className={locationError ? "border-red-500" : ""}
            />
            {locationError && (
              <div className="text-sm text-red-500 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {locationError}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => {
                  setPrice(Number.parseFloat(e.target.value))
                  validatePrice()
                }}
                placeholder="Enter price"
                className={priceError ? "border-red-500" : ""}
              />
              {priceError && (
                <div className="text-sm text-red-500 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {priceError}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as OrderStatus)}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Processing">Processing</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Processing..." : mode === "add" ? "Add Order" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
