"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { db } from "@/lib/firebase"
import { collection, doc, setDoc, Timestamp, serverTimestamp, getDocs } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

export default function MigrateToFirebase() {
  const [migrating, setMigrating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState("")
  const { toast } = useToast()

  const migrateData = async () => {
    try {
      setMigrating(true)
      setStatus("Starting migration...")
      setProgress(5)

      // Check if data already exists in Firebase
      const clientsSnapshot = await getDocs(collection(db, "clients"))
      if (!clientsSnapshot.empty) {
        if (!confirm("Data already exists in Firebase. Continuing will overwrite existing data. Proceed?")) {
          setMigrating(false)
          setProgress(0)
          setStatus("")
          return
        }
      }

      // Get data from localStorage
      setStatus("Reading local data...")
      setProgress(10)
      const clients = JSON.parse(localStorage.getItem("clients") || "[]")
      const orders = JSON.parse(localStorage.getItem("orders") || "[]")
      const deposits = JSON.parse(localStorage.getItem("deposits") || "[]")
      const withdrawals = JSON.parse(localStorage.getItem("withdrawals") || "[]")
      const orderRequests = JSON.parse(localStorage.getItem("orderRequests") || "[]")

      // Migrate clients
      setStatus("Migrating clients...")
      setProgress(20)
      for (let i = 0; i < clients.length; i++) {
        const client = clients[i]
        await setDoc(doc(db, "clients", client.shopId), {
          clientName: client.clientName,
          agent: client.agent,
          kycDate: client.kycDate ? Timestamp.fromDate(new Date(client.kycDate)) : null,
          status: client.status,
          notes: client.notes || "",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
        setProgress(20 + Math.floor((i / clients.length) * 15))
      }

      // Migrate orders
      setStatus("Migrating orders...")
      setProgress(35)
      for (let i = 0; i < orders.length; i++) {
        const order = orders[i]
        await setDoc(doc(db, "orders", order.orderId), {
          shopId: order.shopId,
          clientName: order.clientName,
          agent: order.agent,
          date: order.date ? Timestamp.fromDate(new Date(order.date)) : Timestamp.fromDate(new Date()),
          location: order.location,
          price: order.price,
          status: order.status,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
        setProgress(35 + Math.floor((i / orders.length) * 15))
      }

      // Migrate deposits
      setStatus("Migrating deposits...")
      setProgress(50)
      for (let i = 0; i < deposits.length; i++) {
        const deposit = deposits[i]
        await setDoc(doc(db, "deposits", deposit.depositId), {
          shopId: deposit.shopId,
          clientName: deposit.clientName,
          agent: deposit.agent,
          date: deposit.date ? Timestamp.fromDate(new Date(deposit.date)) : Timestamp.fromDate(new Date()),
          amount: deposit.amount,
          paymentMode: deposit.paymentMode,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
        setProgress(50 + Math.floor((i / deposits.length) * 15))
      }

      // Migrate withdrawals
      setStatus("Migrating withdrawals...")
      setProgress(65)
      for (let i = 0; i < withdrawals.length; i++) {
        const withdrawal = withdrawals[i]
        await setDoc(doc(db, "withdrawals", withdrawal.withdrawalId), {
          shopId: withdrawal.shopId,
          clientName: withdrawal.clientName,
          agent: withdrawal.agent,
          date: withdrawal.date ? Timestamp.fromDate(new Date(withdrawal.date)) : Timestamp.fromDate(new Date()),
          amount: withdrawal.amount,
          paymentMode: withdrawal.paymentMode,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
        setProgress(65 + Math.floor((i / withdrawals.length) * 15))
      }

      // Migrate order requests
      setStatus("Migrating order requests...")
      setProgress(80)
      for (let i = 0; i < orderRequests.length; i++) {
        const request = orderRequests[i]
        await setDoc(doc(db, "orderRequests", request.id), {
          shopId: request.shopId,
          clientName: request.clientName,
          agent: request.agent,
          date: request.date ? Timestamp.fromDate(new Date(request.date)) : Timestamp.fromDate(new Date()),
          location: request.location,
          price: request.price,
          status: request.status,
          remarks: request.remarks || "",
          createdAt: Timestamp.fromMillis(request.createdAt),
          updatedAt: serverTimestamp(),
        })
        setProgress(80 + Math.floor((i / orderRequests.length) * 15))
      }

      setStatus("Migration completed successfully!")
      setProgress(100)
      toast({
        title: "Migration Successful",
        description: "Your data has been successfully migrated to Firebase.",
      })
    } catch (error) {
      console.error("Migration error:", error)
      setStatus(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
      toast({
        title: "Migration Failed",
        description: "There was an error migrating your data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setTimeout(() => {
        setMigrating(false)
        setProgress(0)
        setStatus("")
      }, 3000)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Migrate to Firebase</CardTitle>
        <CardDescription>Migrate your local data to Firebase for team collaboration</CardDescription>
      </CardHeader>
      <CardContent>
        {migrating ? (
          <div className="space-y-4">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-center">{status}</p>
          </div>
        ) : (
          <Alert>
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              This will migrate all your local data to Firebase. Make sure you have set up Firebase correctly before
              proceeding.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={migrateData} disabled={migrating} className="w-full">
          {migrating ? "Migrating..." : "Start Migration"}
        </Button>
      </CardFooter>
    </Card>
  )
}
