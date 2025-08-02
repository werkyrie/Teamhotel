"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { auth, db } from "@/lib/firebase"
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
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
  nickname?: string
  approved?: boolean
}

// Registration data interface
export interface RegistrationData {
  email: string
  password: string
  nickname: string
  role: "Regular" | "Elite" | "Team Leader" | "Spammer"
}

// Auth context interface
interface AuthContextType {
  user: AppUser | null
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; message: string }>
  register: (data: RegistrationData) => Promise<{ success: boolean; message: string }>
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

            // Check if user is approved
            if (userData.approved === false) {
              await firebaseSignOut(auth)
              setUser(null)
              setLoginError("Your account is pending admin approval. Please wait for approval before logging in.")
              return
            }

            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              role: userData.role as UserRole,
              displayName: userData.displayName || firebaseUser.displayName || "",
              nickname: userData.nickname || userData.displayName || firebaseUser.displayName || "",
              approved: userData.approved !== false,
            })
          } else {
            // Create user document if it doesn't exist (for existing users)
            const defaultRole: UserRole = "Viewer"
            await setDoc(doc(db, "users", firebaseUser.uid), {
              email: firebaseUser.email,
              role: defaultRole,
              displayName: firebaseUser.displayName || "",
              nickname: firebaseUser.displayName || "",
              approved: true, // Existing users are auto-approved
              createdAt: serverTimestamp(),
            })

            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              role: defaultRole,
              displayName: firebaseUser.displayName || "",
              nickname: firebaseUser.displayName || "",
              approved: true,
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
          // Regular 4-hour session timeout instead of 30 minutes
          if (Date.now() - lastActivity > 4 * 60 * 60 * 1000) {
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

    // Check session timeout every 5 minutes instead of every minute
    const interval = setInterval(checkSessionTimeout, 5 * 60000)

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

      // Get user data from Firestore to check approval status
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid))

      if (userDoc.exists()) {
        const userData = userDoc.data()

        // Check if user is approved
        if (userData.approved === false) {
          await firebaseSignOut(auth)
          return {
            success: false,
            message: "Your account is pending admin approval. Please wait for approval before logging in.",
          }
        }
      } else {
        // Create user document if it doesn't exist (for existing users)
        await setDoc(doc(db, "users", userCredential.user.uid), {
          email: userCredential.user.email,
          role: "Viewer", // Default role
          displayName: userCredential.user.displayName || "",
          nickname: userCredential.user.displayName || "",
          approved: true, // Existing users are auto-approved
          createdAt: serverTimestamp(),
        })
      }

      // Set persistence based on rememberMe
      if (rememberMe) {
        setLastActivity(Date.now())
        localStorage.setItem("rememberMe", "true")
        localStorage.setItem("rememberMeExpiry", (Date.now() + 30 * 24 * 60 * 60 * 1000).toString())
      } else {
        localStorage.removeItem("rememberMe")
        localStorage.removeItem("rememberMeExpiry")
      }

      return { success: true, message: "Login successful" }
    } catch (error: any) {
      let errorMessage = "Invalid email or password."

      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email address."
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect password."
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Please enter a valid email address."
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many failed login attempts. Please try again later."
      }

      setLoginError(errorMessage)
      return { success: false, message: errorMessage }
    }
  }

  const register = async (data: RegistrationData) => {
    try {
      setLoginError(null)

      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password)

      // Create user document in Firestore - no agent role stored since it's removed
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email: data.email,
        nickname: data.nickname,
        displayName: data.nickname,
        role: "Viewer", // Default role for new registrations
        approved: false, // Require admin approval
        createdAt: serverTimestamp(),
        registrationDate: new Date().toISOString(),
      })

      // Sign out the user after registration (they need approval)
      await firebaseSignOut(auth)

      return {
        success: true,
        message: "Registration successful! Your account is pending admin approval. You will be notified once approved.",
      }
    } catch (error: any) {
      console.error("Registration error:", error)
      let errorMessage = "Registration failed. Please try again."

      if (error.code === "auth/email-already-in-use") {
        errorMessage = "An account with this email already exists."
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password is too weak. Please choose a stronger password."
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Please enter a valid email address."
      }

      return { success: false, message: errorMessage }
    }
  }

  const logout = async () => {
    try {
      await firebaseSignOut(auth)
      localStorage.removeItem("rememberMe")
      localStorage.removeItem("rememberMeExpiry")
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
        register,
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
