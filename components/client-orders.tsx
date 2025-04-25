"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useClientContext } from "@/context/client-context"
import type { Order } from "@/types/client"

interface ClientOrdersProps {
  shopId: string
}

export function ClientOrders({ shopId }: ClientOrdersProps) {
  const { orders } = useClientContext()
  const [clientOrders, setClientOrders] = useState<Order[]>([])

  useEffect(() => {
    if (shopId && orders) {
      const filteredOrders = orders.filter((order) => order.shopId === shopId)
      // Sort by date (newest first)
      filteredOrders.sort((a, b) => {
        const dateA = new Date(a.date).getTime()
        const dateB = new Date(b.date).getTime()
        return dateB - dateA
      })
      setClientOrders(filteredOrders)
    }
  }, [shopId, orders])

  // Format date for display
  const formatDate = (dateString: string | Date): string => {
    if (!dateString) return "Not available"

    try {
      const date = typeof dateString === "string" ? new Date(dateString) : dateString
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch (e) {
      return "Invalid date"
    }
  }

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-500"
      case "Processing":
        return "bg-blue-500"
      case "Pending":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  if (clientOrders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Client Orders</CardTitle>
          <CardDescription>No orders found for this client</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-8 text-muted-foreground">No order history available</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Orders</CardTitle>
        <CardDescription>Order history for this client</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Agent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientOrders.map((order) => (
              <TableRow key={order.orderId}>
                <TableCell className="font-medium">{order.orderId}</TableCell>
                <TableCell>{formatDate(order.date)}</TableCell>
                <TableCell>{order.location}</TableCell>
                <TableCell>{formatCurrency(order.price)}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                </TableCell>
                <TableCell>{order.agent}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
