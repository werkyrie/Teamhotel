"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { auth, db } from "@/lib/firebase"
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updatePassword,
  sendPasswordResetEmail,
} from "firebase/auth"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"

// Define user roles
export type UserRole = "Admin" | "Viewer"

// User interface
export interface AppUser {
  uid: string
  email: string
  role: UserRole
  displayName?: string
}

// Auth context interface
interface AuthContextType {
  user: AppUser | null
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; message: string }>
  logout: () => Promise<void>
  isAuthenticated: boolean
  isAdmin: boolean
  isViewer: boolean
  changePassword: (
    email: string,
    currentPassword: string,
    newPassword: string,
  ) => Promise<{ success: boolean; message: string }>
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>
  loginError: string | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [lastActivity, setLastActivity] = useState<number>(Date.now())
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get user role from Firestore
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))
          if (userDoc.exists()) {
            const userData = userDoc.data()
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              role: userData.role as UserRole,
              displayName: userData.displayName || firebaseUser.displayName || "",
            })
          } else {
            // Create user document if it doesn't exist
            const defaultRole: UserRole = "Viewer"
            await setDoc(doc(db, "users", firebaseUser.uid), {
              email: firebaseUser.email,
              role: defaultRole,
              displayName: firebaseUser.displayName || "",
              createdAt: serverTimestamp(),
            })

            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              role: defaultRole,
              displayName: firebaseUser.displayName || "",
            })
          }
        } catch (error) {
          console.error("Error getting user data:", error)
          await firebaseSignOut(auth)
          setUser(null)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Check for session timeout
  useEffect(() => {
    const checkActivity = () => {
      setLastActivity(Date.now())
    }

    const checkSessionTimeout = () => {
      if (user) {
        const rememberMe = localStorage.getItem("rememberMe") === "true"
        const rememberMeExpiry = localStorage.getItem("rememberMeExpiry")

        if (rememberMe && rememberMeExpiry) {
          // If "Remember me" is active, check if the 5-day period has expired
          if (Date.now() > Number.parseInt(rememberMeExpiry)) {
            logout()
            router.push("/login?timeout=true")
          }
        } else {
          // Regular 30-minute session timeout
          if (Date.now() - lastActivity > 30 * 60 * 1000) {
            logout()
            router.push("/login?timeout=true")
          }
        }
      }
    }

    // Set up event listeners for user activity
    window.addEventListener("mousemove", checkActivity)
    window.addEventListener("keydown", checkActivity)
    window.addEventListener("click", checkActivity)
    window.addEventListener("scroll", checkActivity)

    // Check session timeout every minute
    const interval = setInterval(checkSessionTimeout, 60000)

    return () => {
      window.removeEventListener("mousemove", checkActivity)
      window.removeEventListener("keydown", checkActivity)
      window.removeEventListener("click", checkActivity)
      window.removeEventListener("scroll", checkActivity)
      clearInterval(interval)
    }
  }, [user, lastActivity, router])

  const login = async (email: string, password: string, rememberMe = false) => {
    try {
      setLoginError(null)
      // Attempt login with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password)

      // Set persistence based on rememberMe
      if (rememberMe) {
        // This is handled by the session timeout logic
        setLastActivity(Date.now())
        localStorage.setItem("rememberMe", "true")
        localStorage.setItem("rememberMeExpiry", (Date.now() + 5 * 24 * 60 * 60 * 1000).toString())
      } else {
        localStorage.removeItem("rememberMe")
        localStorage.removeItem("rememberMeExpiry")
      }

      // Get user role from Firestore
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid))

      if (!userDoc.exists()) {
        // Create user document if it doesn't exist
        await setDoc(doc(db, "users", userCredential.user.uid), {
          email: userCredential.user.email,
          role: "Viewer", // Default role
          displayName: userCredential.user.displayName || "",
          createdAt: serverTimestamp(),
        })
      }

      return { success: true, message: "Login successful" }
    } catch (error: any) {
      const errorMessage = error.message || "Invalid email or password."
      setLoginError(errorMessage)
      return { success: false, message: errorMessage }
    }
  }

  const logout = async () => {
    try {
      await firebaseSignOut(auth)
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const changePassword = async (email: string, currentPassword: string, newPassword: string) => {
    try {
      if (!auth.currentUser || !user?.email) {
        return { success: false, message: "No user is currently logged in" }
      }

      // Re-authenticate user
      await signInWithEmailAndPassword(auth, email || user.email, currentPassword)

      // Change password
      await updatePassword(auth.currentUser, newPassword)

      return { success: true, message: "Password changed successfully" }
    } catch (error: any) {
      console.error("Error changing password:", error)
      return { success: false, message: error.message || "Failed to change password" }
    }
  }

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email)
      return { success: true, message: "Password reset email sent" }
    } catch (error: any) {
      console.error("Error sending password reset:", error)
      return { success: false, message: error.message || "Failed to send password reset email" }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === "Admin",
        isViewer: user?.role === "Viewer",
        changePassword,
        resetPassword,
        loginError,
        loading,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
