"use client"

import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, getDocs } from "firebase/firestore"

export default function FirebaseInit() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    async function initializeFirebase() {
      try {
        // Check if collections exist
        const collections = ["clients", "orders", "deposits", "withdrawals", "orderRequests", "users"]

        for (const collectionName of collections) {
          // Just try to get documents to see if collection exists
          await getDocs(collection(db, collectionName))
          console.log(`Collection ${collectionName} exists or was created`)
        }

        setStatus("success")
        setMessage("Firebase initialized successfully!")
      } catch (error) {
        console.error("Error initializing Firebase:", error)
        setStatus("error")
        setMessage(`Error initializing Firebase: ${error}`)
      }
    }

    initializeFirebase()
  }, [])

  return (
    <div className="p-4 rounded-lg border">
      <h2 className="text-lg font-semibold mb-2">Firebase Initialization</h2>
      <div
        className={`p-2 rounded ${
          status === "loading" ? "bg-yellow-100" : status === "success" ? "bg-green-100" : "bg-red-100"
        }`}
      >
        {status === "loading" ? "Initializing Firebase..." : message}
      </div>
    </div>
  )
}
