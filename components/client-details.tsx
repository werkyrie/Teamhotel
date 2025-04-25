"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, UserIcon, BuildingIcon, ClipboardCheckIcon, InfoIcon } from "lucide-react"
import type { Client } from "@/types/client"

interface ClientDetailsProps {
  client: Client
}

export function ClientDetails({ client }: ClientDetailsProps) {
  // Format date for display
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return "Not available"

    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch (e) {
      return "Invalid date"
    }
  }

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-emerald-500 hover:bg-emerald-600"
      case "Inactive":
        return "bg-rose-500 hover:bg-rose-600"
      case "In Process":
        return "bg-amber-500 hover:bg-amber-600"
      case "Eliminated":
        return "bg-slate-500 hover:bg-slate-600"
      default:
        return "bg-blue-500 hover:bg-blue-600"
    }
  }

  return (
    <Card className="shadow-md border-slate-200 dark:border-slate-700 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl font-bold text-slate-800 dark:text-slate-100">{client.clientName}</CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400 mt-1">
              Client ID: {client.shopId}
            </CardDescription>
          </div>
          <Badge className={`${getStatusColor(client.status)} text-white px-3 py-1 text-sm font-medium`}>
            {client.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <BuildingIcon className="h-5 w-5 text-slate-500 dark:text-slate-400 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Shop ID</h3>
                <p className="text-lg font-semibold text-slate-800 dark:text-slate-200">{client.shopId}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <UserIcon className="h-5 w-5 text-slate-500 dark:text-slate-400 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Agent</h3>
                <p className="text-lg font-semibold text-slate-800 dark:text-slate-200">{client.agent}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <CalendarIcon className="h-5 w-5 text-slate-500 dark:text-slate-400 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">KYC Date</h3>
                <p className="text-lg font-semibold text-slate-800 dark:text-slate-200">{formatDate(client.kycDate)}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <ClipboardCheckIcon className="h-5 w-5 text-slate-500 dark:text-slate-400 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Status</h3>
                <Badge className={`${getStatusColor(client.status)} text-white mt-1`}>{client.status}</Badge>
              </div>
            </div>
          </div>
        </div>

        {client.notes && (
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-start space-x-3">
              <InfoIcon className="h-5 w-5 text-slate-500 dark:text-slate-400 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Notes</h3>
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-md border border-slate-200 dark:border-slate-700">
                  <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">{client.notes}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
