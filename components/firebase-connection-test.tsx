"use client"

import { useState } from "react"
import { db } from "@/lib/firebase"
import { collection, getDocs } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function FirebaseConnectionTest() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [collections, setCollections] = useState<string[]>([])

  async function testConnection() {
    setStatus("loading")
    setMessage("Testing Firebase connection...")

    try {
      // Try to get a list of collections
      const collectionsSnapshot = await getDocs(collection(db, "clients"))
      setCollections([`clients (${collectionsSnapshot.size} documents)`])

      setStatus("success")
      setMessage("Successfully connected to Firebase!")
    } catch (error) {
      console.error("Firebase connection error:", error)
      setStatus("error")
      setMessage(`Error connecting to Firebase: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Firebase Connection Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={testConnection} disabled={status === "loading"} className="w-full">
          {status === "loading" ? "Testing..." : "Test Firebase Connection"}
        </Button>

        {status !== "idle" && (
          <div
            className={`p-3 rounded-md ${
              status === "loading"
                ? "bg-yellow-100 text-yellow-800"
                : status === "success"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
            }`}
          >
            <p className="font-medium">{message}</p>

            {collections.length > 0 && (
              <div className="mt-2">
                <p className="font-medium">Collections found:</p>
                <ul className="list-disc pl-5 mt-1">
                  {collections.map((col, i) => (
                    <li key={i}>{col}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
