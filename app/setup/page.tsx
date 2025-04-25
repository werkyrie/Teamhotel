"use client"

import type React from "react"

import { useState } from "react"
import { auth, db } from "@/lib/firebase"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function SetupPage() {
  const [email, setEmail] = useState("Admin")
  const [password, setPassword] = useState("bosskyrie")
  const [confirmPassword, setConfirmPassword] = useState("bosskyrie")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null)
  const [setupComplete, setSetupComplete] = useState(false)

  const createAdminUser = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match" })
      return
    }

    if (password.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters" })
      return
    }

    setIsLoading(true)
    setMessage(null)

    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)

      // Create user document in Firestore with Admin role
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email: email,
        role: "Admin",
        displayName: "Admin",
        createdAt: serverTimestamp(),
      })

      setMessage({
        type: "success",
        text: "Admin user created successfully! You can now log in with these credentials.",
      })
      setSetupComplete(true)
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Failed to create admin user",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Initial Setup</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4 bg-blue-50 text-blue-900 dark:bg-blue-900/20 dark:text-blue-200">
            <AlertDescription>Welcome to the initial setup. Create your admin user to get started.</AlertDescription>
          </Alert>

          {message && (
            <Alert
              className={`mb-4 ${
                message.type === "success"
                  ? "bg-green-50 text-green-900 dark:bg-green-900/20 dark:text-green-200"
                  : message.type === "error"
                    ? "bg-red-50 text-red-900 dark:bg-red-900/20 dark:text-red-200"
                    : "bg-blue-50 text-blue-900 dark:bg-blue-900/20 dark:text-blue-200"
              }`}
            >
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          {!setupComplete ? (
            <form onSubmit={createAdminUser}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Admin Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating Admin User..." : "Create Admin User"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="text-center">
              <p className="mb-4">Setup complete! You can now log in with your new admin account.</p>
              <Button onClick={() => (window.location.href = "/login")} className="w-full">
                Go to Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
