"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useClientContext } from "@/context/client-context"
import { useNotificationContext } from "@/context/notification-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  AlertCircle,
  CalendarIcon,
  Search,
  User,
  Building,
  MapPin,
  DollarSign,
  MessageSquare,
  Plus,
  Trash,
  Clock,
} from "lucide-react"
import { format } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

// Define the order item type
interface OrderItem {
  id: number
  location: string
  price: string | number
  time: string
  remarks: string
}

export default function OrderRequestForm() {
  const { clients, addOrderRequest } = useClientContext()
  const { toast } = useToast()
  const { addNotification } = useNotificationContext()

  // Form state
  const [shopId, setShopId] = useState("")
  const [clientName, setClientName] = useState("")
  const [agent, setAgent] = useState("")
  const [date, setDate] = useState<Date | undefined>(new Date())

  // Multiple order items state - each with its own time
  const [orderItems, setOrderItems] = useState<OrderItem[]>([
    {
      id: Date.now(),
      location: "",
      price: "",
      time: format(new Date(), "HH:mm"),
      remarks: "",
    },
  ])

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredClients, setFilteredClients] = useState(clients || [])
  const [showClientDropdown, setShowClientDropdown] = useState(false)

  // Validation state
  const [shopIdError, setShopIdError] = useState("")
  const [locationErrors, setLocationErrors] = useState<{ [key: number]: string }>({})
  const [priceErrors, setPriceErrors] = useState<{ [key: number]: string }>({})

  // Update filtered clients when clients or search term changes
  useEffect(() => {
    if (clients) {
      // Only include Active and Inactive clients
      const eligibleClients = clients.filter((client) => client.status === "Active" || client.status === "Inactive")

      if (searchTerm) {
        const filtered = eligibleClients.filter(
          (client) =>
            (client.shopId && client.shopId.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (client.clientName && client.clientName.toLowerCase().includes(searchTerm.toLowerCase())),
        )
        setFilteredClients(filtered)
      } else {
        setFilteredClients(eligibleClients)
      }
    }
  }, [clients, searchTerm])

  // Auto-fill client name and agent when shop ID is selected
  useEffect(() => {
    if (shopId && clients) {
      const selectedClient = clients.find((client) => client.shopId === shopId)
      if (selectedClient) {
        setClientName(selectedClient.clientName)
        setAgent(selectedClient.agent)
        setShopIdError("")
      }
    }
  }, [shopId, clients])

  // Validate shop ID
  const validateShopId = () => {
    if (!shopId) {
      setShopIdError("Shop ID is required")
      return false
    }

    if (!clients) {
      setShopIdError("No clients available")
      return false
    }

    const clientExists = clients.some(
      (client) => client.shopId === shopId && (client.status === "Active" || client.status === "Inactive"),
    )

    if (!clientExists) {
      setShopIdError("Client with this Shop ID does not exist or is not eligible for orders")
      return false
    }

    setShopIdError("")
    return true
  }

  // Validate all order items
  const validateOrderItems = () => {
    const newLocationErrors: { [key: number]: string } = {}
    const newPriceErrors: { [key: number]: string } = {}
    let isValid = true

    orderItems.forEach((item) => {
      // Validate location
      if (!item.location) {
        newLocationErrors[item.id] = "Location is required"
        isValid = false
      }

      // Validate price
      const numericPrice = typeof item.price === "string" ? Number.parseFloat(item.price) : item.price
      if (!item.price || isNaN(numericPrice) || numericPrice <= 0) {
        newPriceErrors[item.id] = "Price must be greater than 0"
        isValid = false
      }
    })

    setLocationErrors(newLocationErrors)
    setPriceErrors(newPriceErrors)
    return isValid
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    const isShopIdValid = validateShopId()
    const areOrderItemsValid = validateOrderItems()

    if (!isShopIdValid || !areOrderItemsValid) {
      return
    }

    // Submit each order item
    for (const item of orderItems) {
      // Convert price to number for submission
      const numericPrice = typeof item.price === "string" ? Number.parseFloat(item.price) : item.price

      // Combine the selected date with the item's time
      let orderDateTime = new Date()
      if (date) {
        orderDateTime = new Date(date)
        const [hours, minutes] = item.time.split(":").map(Number)
        orderDateTime.setHours(hours)
        orderDateTime.setMinutes(minutes)
      }

      // Create order request
      addOrderRequest({
        shopId,
        clientName,
        agent,
        date: format(orderDateTime, "yyyy-MM-dd HH:mm"),
        location: item.location,
        price: numericPrice,
        remarks: item.remarks,
      })
    }

    // Create notification for administrators
    const totalOrders = orderItems.length
    const totalAmount = orderItems.reduce((sum, item) => {
      const price = typeof item.price === "string" ? Number.parseFloat(item.price) : item.price
      return sum + (isNaN(price) ? 0 : price)
    }, 0)

    addNotification({
      type: "info",
      title: "New Order Request",
      message: `${clientName} (${shopId}) has submitted ${totalOrders} order(s) worth a total of ${totalAmount.toFixed(2)} on ${date ? format(date, "PPP") : format(new Date(), "PPP")}`,
      link: "/order-requests",
    })

    // Reset form
    setShopId("")
    setClientName("")
    setAgent("")
    setDate(new Date())
    setOrderItems([{ id: Date.now(), location: "", price: "", time: format(new Date(), "HH:mm"), remarks: "" }])
    setSearchTerm("")
    setLocationErrors({})
    setPriceErrors({})

    // Show success toast
    toast({
      title: "Order Request Submitted",
      description: `${totalOrders} order(s) have been submitted successfully.`,
      variant: "success",
    })
  }

  // Add a new order item
  const addOrderItem = () => {
    setOrderItems([
      ...orderItems,
      {
        id: Date.now(),
        location: "",
        price: "",
        time: format(new Date(), "HH:mm"),
        remarks: "",
      },
    ])
  }

  // Remove an order item
  const removeOrderItem = (id: number) => {
    setOrderItems(orderItems.filter((item) => item.id !== id))
  }

  // Update an order item field
  const updateOrderItem = (id: number, field: keyof OrderItem, value: string | number) => {
    const newItems = orderItems.map((item) => {
      if (item.id === id) {
        return { ...item, [field]: value }
      }
      return item
    })
    setOrderItems(newItems)
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="shopId" className="flex items-center gap-1">
              <Building className="h-4 w-4" /> Shop ID
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="shopId"
                placeholder="Search by Shop ID or Client Name"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setShowClientDropdown(true)
                }}
                onFocus={() => setShowClientDropdown(true)}
                onBlur={() => {
                  // Delay hiding dropdown to allow for click
                  setTimeout(() => setShowClientDropdown(false), 200)
                }}
                className={cn("pl-10", shopIdError ? "border-red-500" : "")}
              />
              {showClientDropdown && filteredClients && filteredClients.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                  {filteredClients.map((client) => (
                    <div
                      key={client.shopId}
                      className="p-2 hover:bg-muted cursor-pointer flex justify-between items-center"
                      onClick={() => {
                        setShopId(client.shopId)
                        setSearchTerm(client.shopId)
                        setShowClientDropdown(false)
                      }}
                    >
                      <div>
                        <div className="font-medium">{client.shopId}</div>
                        <div className="text-sm text-muted-foreground">{client.clientName}</div>
                      </div>
                      {client.status && (
                        <Badge variant={client.status === "Active" ? "default" : "secondary"}>{client.status}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {showClientDropdown && searchTerm && (!filteredClients || filteredClients.length === 0) && (
                <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg p-4 text-center">
                  No eligible clients found. Only Active and Inactive clients can be selected.
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientName" className="flex items-center gap-1">
                <User className="h-4 w-4" /> Client Name
              </Label>
              <Input id="clientName" value={clientName} readOnly className="bg-muted/50" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="agent" className="flex items-center gap-1">
                <User className="h-4 w-4" /> Agent
              </Label>
              <Input id="agent" value={agent} readOnly className="bg-muted/50" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4" /> Date (shared for all orders)
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Order Items</h3>
              <Button type="button" variant="outline" size="sm" onClick={addOrderItem}>
                <Plus className="h-4 w-4 mr-1" /> Add Order
              </Button>
            </div>

            {orderItems.map((item, index) => (
              <Card key={item.id} className="overflow-hidden border">
                <div className="bg-muted p-3 flex justify-between items-center">
                  <h4 className="font-medium">Order Item {index + 1}</h4>
                  {orderItems.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOrderItem(item.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash className="h-4 w-4 text-red-500" />
                      <span className="sr-only">Remove item</span>
                    </Button>
                  )}
                </div>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`location-${item.id}`} className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" /> Location
                      </Label>
                      <Input
                        id={`location-${item.id}`}
                        value={item.location}
                        onChange={(e) => updateOrderItem(item.id, "location", e.target.value)}
                        placeholder="Enter location"
                        className={locationErrors[item.id] ? "border-red-500" : ""}
                      />
                      {locationErrors[item.id] && (
                        <div className="text-sm text-red-500 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {locationErrors[item.id]}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`time-${item.id}`} className="flex items-center gap-1">
                        <Clock className="h-4 w-4" /> Time
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !item.time && "text-muted-foreground",
                            )}
                          >
                            <Clock className="mr-2 h-4 w-4" />
                            {item.time || "Select time"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-4" align="start">
                          <div className="grid gap-4">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-2">
                                <Label htmlFor={`hours-${item.id}`}>Hour</Label>
                                <select
                                  id={`hours-${item.id}`}
                                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                                  value={item.time.split(":")[0]}
                                  onChange={(e) => {
                                    const [_, minutes] = item.time.split(":")
                                    updateOrderItem(item.id, "time", `${e.target.value}:${minutes}`)
                                  }}
                                >
                                  {Array.from({ length: 24 }).map((_, i) => (
                                    <option key={i} value={i.toString().padStart(2, "0")}>
                                      {i.toString().padStart(2, "0")}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`minutes-${item.id}`}>Minute</Label>
                                <select
                                  id={`minutes-${item.id}`}
                                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                                  value={item.time.split(":")[1]}
                                  onChange={(e) => {
                                    const [hours] = item.time.split(":")
                                    updateOrderItem(item.id, "time", `${hours}:${e.target.value}`)
                                  }}
                                >
                                  {Array.from({ length: 60 }).map((_, i) => (
                                    <option key={i} value={i.toString().padStart(2, "0")}>
                                      {i.toString().padStart(2, "0")}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <div className="flex justify-between">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const now = new Date()
                                  const hours = now.getHours().toString().padStart(2, "0")
                                  const minutes = now.getMinutes().toString().padStart(2, "0")
                                  updateOrderItem(item.id, "time", `${hours}:${minutes}`)
                                }}
                              >
                                Now
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateOrderItem(item.id, "time", "09:00")}
                              >
                                9:00 AM
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateOrderItem(item.id, "time", "12:00")}
                              >
                                12:00 PM
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateOrderItem(item.id, "time", "17:00")}
                              >
                                5:00 PM
                              </Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`price-${item.id}`} className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" /> Price
                      </Label>
                      <Input
                        id={`price-${item.id}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => {
                          const value = e.target.value
                          if (value === "") {
                            updateOrderItem(item.id, "price", "")
                          } else {
                            updateOrderItem(item.id, "price", Number.parseFloat(value))
                          }
                        }}
                        placeholder="Enter price"
                        className={priceErrors[item.id] ? "border-red-500" : ""}
                      />
                      {priceErrors[item.id] && (
                        <div className="text-sm text-red-500 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {priceErrors[item.id]}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`remarks-${item.id}`} className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" /> Remarks
                      </Label>
                      <Textarea
                        id={`remarks-${item.id}`}
                        value={item.remarks}
                        onChange={(e) => updateOrderItem(item.id, "remarks", e.target.value)}
                        placeholder="Enter any additional comments"
                        rows={2}
                        className="resize-none"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="pt-2">
            <Button type="submit" className="w-full">
              Submit Order Request{orderItems.length > 1 ? "s" : ""}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
