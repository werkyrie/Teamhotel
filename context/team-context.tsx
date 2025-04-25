"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { Agent, Penalty, Reward, TeamMetrics, Attendance } from "@/types/team"
import { db } from "@/lib/firebase"
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, onSnapshot } from "firebase/firestore"

interface TeamContextType {
  agents: Agent[]
  penalties: Penalty[]
  rewards: Reward[]
  attendance: Attendance[]
  metrics: TeamMetrics
  addAgent: (agent: Omit<Agent, "id" | "commission" | "commissionRate">) => Promise<Agent>
  updateAgent: (agent: Agent, editorEmail?: string) => Promise<void>
  deleteAgent: (id: string) => Promise<void>
  addPenalty: (penalty: Omit<Penalty, "id">) => Promise<Penalty>
  updatePenalty: (penalty: Penalty) => Promise<void>
  deletePenalty: (id: string) => Promise<void>
  addReward: (reward: Omit<Reward, "id">) => Promise<Reward>
  updateReward: (reward: Reward) => Promise<void>
  deleteReward: (id: string) => Promise<void>
  addAttendance: (attendance: Omit<Attendance, "id">) => Promise<Attendance>
  updateAttendance: (attendance: Attendance) => Promise<void>
  deleteAttendance: (id: string) => Promise<void>
  calculateCommission: (depositAmount: number, withdrawalAmount?: number) => { rate: number; amount: number }
}

const TeamContext = createContext<TeamContextType | undefined>(undefined)

export function TeamProvider({ children }: { children: ReactNode }) {
  const [agents, setAgents] = useState<Agent[]>([])
  const [penalties, setPenalties] = useState<Penalty[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [metrics, setMetrics] = useState<TeamMetrics>({
    totalAgents: 0,
    totalAddedToday: 0,
    totalMonthlyAdded: 0,
    totalOpenAccounts: 0,
    totalDeposits: 0,
  })

  // Load data from Firebase on initial render
  useEffect(() => {
    const loadData = async () => {
      try {
        // Set up real-time listeners for each collection with proper error handling
        const agentsUnsubscribe = onSnapshot(
          collection(db, "agents"),
          (snapshot) => {
            // Create a Map to ensure uniqueness by ID
            const agentMap = new Map()

            snapshot.docs.forEach((doc) => {
              const agentData = { id: doc.id, ...doc.data() } as Agent
              agentMap.set(doc.id, agentData)
            })

            // Convert Map to array
            const uniqueAgents = Array.from(agentMap.values())
            setAgents(uniqueAgents)
          },
          (error) => {
            console.error("Error in agents listener:", error)
            // Fall back to localStorage if Firebase fails
            const savedAgents = localStorage.getItem("agents")
            if (savedAgents) setAgents(JSON.parse(savedAgents))
          },
        )

        const penaltiesUnsubscribe = onSnapshot(
          collection(db, "penalties"),
          (snapshot) => {
            // Create a Map to ensure uniqueness by ID
            const penaltyMap = new Map()

            snapshot.docs.forEach((doc) => {
              const penaltyData = { id: doc.id, ...doc.data() } as Penalty
              penaltyMap.set(doc.id, penaltyData)
            })

            // Convert Map to array
            const uniquePenalties = Array.from(penaltyMap.values())
            setPenalties(uniquePenalties)
          },
          (error) => {
            console.error("Error in penalties listener:", error)
            // Fall back to localStorage if Firebase fails
            const savedPenalties = localStorage.getItem("penalties")
            if (savedPenalties) setPenalties(JSON.parse(savedPenalties))
          },
        )

        const rewardsUnsubscribe = onSnapshot(
          collection(db, "rewards"),
          (snapshot) => {
            // Create a Map to ensure uniqueness by ID
            const rewardMap = new Map()

            snapshot.docs.forEach((doc) => {
              const rewardData = { id: doc.id, ...doc.data() } as Reward
              rewardMap.set(doc.id, rewardData)
            })

            // Convert Map to array
            const uniqueRewards = Array.from(rewardMap.values())
            setRewards(uniqueRewards)
          },
          (error) => {
            console.error("Error in rewards listener:", error)
            // Fall back to localStorage if Firebase fails
            const savedRewards = localStorage.getItem("rewards")
            if (savedRewards) setRewards(JSON.parse(savedRewards))
          },
        )

        const attendanceUnsubscribe = onSnapshot(
          collection(db, "attendance"),
          (snapshot) => {
            // Create a Map to ensure uniqueness by ID
            const attendanceMap = new Map()

            snapshot.docs.forEach((doc) => {
              const attendanceData = { id: doc.id, ...doc.data() } as Attendance
              attendanceMap.set(doc.id, attendanceData)
            })

            // Convert Map to array
            const uniqueAttendance = Array.from(attendanceMap.values())
            setAttendance(uniqueAttendance)
          },
          (error) => {
            console.error("Error in attendance listener:", error)
            // Fall back to localStorage if Firebase fails
            const savedAttendance = localStorage.getItem("attendance")
            if (savedAttendance) setAttendance(JSON.parse(savedAttendance))
          },
        )

        // Clean up listeners on unmount
        return () => {
          agentsUnsubscribe()
          penaltiesUnsubscribe()
          rewardsUnsubscribe()
          attendanceUnsubscribe()
        }
      } catch (error) {
        console.error("Error setting up team data listeners:", error)

        // Fallback to localStorage if Firebase setup fails
        const savedAgents = localStorage.getItem("agents")
        const savedPenalties = localStorage.getItem("penalties")
        const savedRewards = localStorage.getItem("rewards")
        const savedAttendance = localStorage.getItem("attendance")

        if (savedAgents) setAgents(JSON.parse(savedAgents))
        if (savedPenalties) setPenalties(JSON.parse(savedPenalties))
        if (savedRewards) setRewards(JSON.parse(savedRewards))
        if (savedAttendance) setAttendance(JSON.parse(savedAttendance))
      }
    }

    loadData()
  }, [])

  // Update metrics whenever agents change
  useEffect(() => {
    const totalAgents = agents.length
    const totalAddedToday = agents.reduce((sum, agent) => sum + (agent.addedToday || 0), 0)
    const totalMonthlyAdded = agents.reduce((sum, agent) => sum + (agent.monthlyAdded || 0), 0)
    const totalOpenAccounts = agents.reduce((sum, agent) => sum + (agent.openAccounts || 0), 0)
    const totalDeposits = agents.reduce((sum, agent) => sum + (agent.totalDeposits || 0), 0)

    setMetrics({
      totalAgents,
      totalAddedToday,
      totalMonthlyAdded,
      totalOpenAccounts,
      totalDeposits,
    })
  }, [agents])

  // Calculate commission based on deposit amount
  const calculateCommission = (depositAmount: number, withdrawalAmount = 0) => {
    // Calculate net amount (deposits - withdrawals)
    const netAmount = Math.max(0, depositAmount - withdrawalAmount)
    let rate = 0

    if (netAmount >= 100000) {
      rate = 0.1 // 10%
    } else if (netAmount >= 50000) {
      rate = 0.09 // 9%
    } else if (netAmount >= 20000) {
      rate = 0.07 // 7%
    } else if (netAmount >= 10000) {
      rate = 0.05 // 5%
    } else if (netAmount >= 1000) {
      rate = 0.04 // 4%
    }

    const amount = netAmount * rate

    return { rate, amount }
  }

  // Update agents with commission calculations
  useEffect(() => {
    const updateAgentsWithCommission = async () => {
      const updatedAgents = agents.map((agent) => {
        const { rate, amount } = calculateCommission(agent.totalDeposits || 0, agent.totalWithdrawals || 0)
        return {
          ...agent,
          commission: amount,
          commissionRate: rate * 100, // Convert to percentage
        }
      })

      if (JSON.stringify(updatedAgents) !== JSON.stringify(agents)) {
        setAgents(updatedAgents)

        // Update commission values in Firebase
        for (const agent of updatedAgents) {
          try {
            const agentRef = doc(db, "agents", agent.id)
            await updateDoc(agentRef, {
              commission: agent.commission,
              commissionRate: agent.commissionRate,
            })
          } catch (error) {
            console.error(`Error updating commission for agent ${agent.id}:`, error)
          }
        }
      }
    }

    if (agents.length > 0) {
      updateAgentsWithCommission()
    }
  }, [agents])

  // Agent CRUD operations
  const addAgent = async (agent: Omit<Agent, "id" | "commission" | "commissionRate">) => {
    try {
      const { rate, amount } = calculateCommission(agent.totalDeposits || 0)
      const newAgent = {
        ...agent,
        commission: amount,
        commissionRate: rate * 100,
      }

      // Check for duplicate email before adding
      const existingAgent = agents.find((a) => a.email === agent.email)
      if (existingAgent) {
        throw new Error(`An agent with email ${agent.email} already exists`)
      }

      // Add to Firebase
      const docRef = await addDoc(collection(db, "agents"), newAgent)
      const agentWithId = { ...newAgent, id: docRef.id } as Agent

      // Update local state with Firebase ID - use functional update to avoid race conditions
      setAgents((prev) => {
        // Check if agent already exists in state
        if (prev.some((a) => a.id === docRef.id)) {
          return prev
        }
        return [...prev, agentWithId]
      })

      // Backup to localStorage
      const updatedAgents = [...agents, agentWithId]
      localStorage.setItem("agents", JSON.stringify(updatedAgents))

      return agentWithId
    } catch (error) {
      console.error("Error adding agent:", error)

      if ((error as Error).message.includes("already exists")) {
        throw error // Re-throw the duplicate email error
      }

      // Improved ID generation with timestamp and random string to ensure uniqueness
      const uniqueId = `agent-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`

      const newAgent: Agent = {
        ...agent,
        id: uniqueId,
        commission: 0,
        commissionRate: 0,
      }

      const { rate, amount } = calculateCommission(newAgent.totalDeposits || 0)
      newAgent.commission = amount
      newAgent.commissionRate = rate * 100

      // Update local state - use functional update to avoid race conditions
      setAgents((prev) => {
        // Check if agent already exists in state
        if (prev.some((a) => a.id === uniqueId)) {
          return prev
        }
        return [...prev, newAgent]
      })

      const updatedAgents = [...agents, newAgent]
      localStorage.setItem("agents", JSON.stringify(updatedAgents))
      return newAgent
    }
  }

  const updateAgent = async (updatedAgent: Agent, editorEmail?: string) => {
    try {
      // If editor email is provided, extract the name and update lastEditedBy
      if (editorEmail) {
        const editorName = editorEmail.split("@")[0]
        // Capitalize first letter
        const formattedName = editorName.charAt(0).toUpperCase() + editorName.slice(1)
        updatedAgent = {
          ...updatedAgent,
          lastEditedBy: formattedName,
          lastEditedAt: new Date().toISOString(),
        }
      }

      // Update in Firebase
      const agentRef = doc(db, "agents", updatedAgent.id)
      await updateDoc(agentRef, { ...updatedAgent })

      // Update local state
      setAgents((prev) => prev.map((agent) => (agent.id === updatedAgent.id ? updatedAgent : agent)))

      // Backup to localStorage
      localStorage.setItem(
        "agents",
        JSON.stringify(agents.map((agent) => (agent.id === updatedAgent.id ? updatedAgent : agent))),
      )
    } catch (error) {
      console.error("Error updating agent:", error)

      // Fallback to localStorage only
      setAgents((prev) => prev.map((agent) => (agent.id === updatedAgent.id ? updatedAgent : agent)))
      localStorage.setItem(
        "agents",
        JSON.stringify(agents.map((agent) => (agent.id === updatedAgent.id ? updatedAgent : agent))),
      )
    }
  }

  const deleteAgent = async (id: string) => {
    try {
      // Delete from Firebase
      await deleteDoc(doc(db, "agents", id))

      // Delete related penalties, rewards, and attendance
      const penaltyQuery = query(collection(db, "penalties"), where("agentId", "==", id))
      const penaltyDocs = await getDocs(penaltyQuery)
      penaltyDocs.forEach(async (penaltyDoc) => {
        await deleteDoc(doc(db, "penalties", penaltyDoc.id))
      })

      const rewardQuery = query(collection(db, "rewards"), where("agentId", "==", id))
      const rewardDocs = await getDocs(rewardQuery)
      rewardDocs.forEach(async (rewardDoc) => {
        await deleteDoc(doc(db, "rewards", rewardDoc.id))
      })

      const attendanceQuery = query(collection(db, "attendance"), where("agentId", "==", id))
      const attendanceDocs = await getDocs(attendanceQuery)
      attendanceDocs.forEach(async (attendanceDoc) => {
        await deleteDoc(doc(db, "attendance", attendanceDoc.id))
      })

      // Update local state
      setAgents((prev) => prev.filter((agent) => agent.id !== id))
      setPenalties((prev) => prev.filter((penalty) => penalty.agentId !== id))
      setRewards((prev) => prev.filter((reward) => reward.agentId !== id))
      setAttendance((prev) => prev.filter((attendance) => attendance.agentId !== id))

      // Backup to localStorage
      localStorage.setItem("agents", JSON.stringify(agents.filter((agent) => agent.id !== id)))
      localStorage.setItem("penalties", JSON.stringify(penalties.filter((penalty) => penalty.agentId !== id)))
      localStorage.setItem("rewards", JSON.stringify(rewards.filter((reward) => reward.agentId !== id)))
      localStorage.setItem("attendance", JSON.stringify(attendance.filter((attendance) => attendance.agentId !== id)))
    } catch (error) {
      console.error("Error deleting agent:", error)

      // Fallback to localStorage only
      setAgents((prev) => prev.filter((agent) => agent.id !== id))
      setPenalties((prev) => prev.filter((penalty) => penalty.agentId !== id))
      setRewards((prev) => prev.filter((reward) => reward.agentId !== id))
      setAttendance((prev) => prev.filter((attendance) => attendance.agentId !== id))

      localStorage.setItem("agents", JSON.stringify(agents.filter((agent) => agent.id !== id)))
      localStorage.setItem("penalties", JSON.stringify(penalties.filter((penalty) => penalty.agentId !== id)))
      localStorage.setItem("rewards", JSON.stringify(rewards.filter((reward) => reward.agentId !== id)))
      localStorage.setItem("attendance", JSON.stringify(attendance.filter((attendance) => attendance.agentId !== id)))
    }
  }

  // Penalty CRUD operations
  const addPenalty = async (penalty: Omit<Penalty, "id">) => {
    try {
      // Check for potential duplicates
      const potentialDuplicate = penalties.find(
        (p) => p.agentId === penalty.agentId && p.description === penalty.description && p.date === penalty.date,
      )

      if (potentialDuplicate) {
        throw new Error(`A similar penalty already exists for this agent on ${penalty.date}`)
      }

      // Add to Firebase
      const docRef = await addDoc(collection(db, "penalties"), penalty)
      const penaltyWithId = { ...penalty, id: docRef.id } as Penalty

      // Update local state with Firebase ID - use functional update to avoid race conditions
      setPenalties((prev) => {
        // Check if penalty already exists in state
        if (prev.some((p) => p.id === docRef.id)) {
          return prev
        }
        return [...prev, penaltyWithId]
      })

      // Backup to localStorage
      const updatedPenalties = [...penalties, penaltyWithId]
      localStorage.setItem("penalties", JSON.stringify(updatedPenalties))

      return penaltyWithId
    } catch (error) {
      console.error("Error adding penalty:", error)

      if ((error as Error).message.includes("already exists")) {
        throw error // Re-throw the duplicate penalty error
      }

      // Improved ID generation with timestamp and random string
      const uniqueId = `penalty-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`

      const newPenalty: Penalty = {
        ...penalty,
        id: uniqueId,
      }

      // Update local state - use functional update to avoid race conditions
      setPenalties((prev) => {
        // Check if penalty already exists in state
        if (prev.some((p) => p.id === uniqueId)) {
          return prev
        }
        return [...prev, newPenalty]
      })

      const updatedPenalties = [...penalties, newPenalty]
      localStorage.setItem("penalties", JSON.stringify(updatedPenalties))
      return newPenalty
    }
  }

  const updatePenalty = async (updatedPenalty: Penalty) => {
    try {
      // Update in Firebase
      const penaltyRef = doc(db, "penalties", updatedPenalty.id)
      await updateDoc(penaltyRef, { ...updatedPenalty })

      // Update local state
      setPenalties((prev) => prev.map((penalty) => (penalty.id === updatedPenalty.id ? updatedPenalty : penalty)))

      // Backup to localStorage
      localStorage.setItem(
        "penalties",
        JSON.stringify(penalties.map((penalty) => (penalty.id === updatedPenalty.id ? updatedPenalty : penalty))),
      )
    } catch (error) {
      console.error("Error updating penalty:", error)

      // Fallback to localStorage only
      setPenalties((prev) => prev.map((penalty) => (penalty.id === updatedPenalty.id ? updatedPenalty : penalty)))
      localStorage.setItem(
        "penalties",
        JSON.stringify(penalties.map((penalty) => (penalty.id === updatedPenalty.id ? updatedPenalty : penalty))),
      )
    }
  }

  const deletePenalty = async (id: string) => {
    try {
      // Delete from Firebase
      await deleteDoc(doc(db, "penalties", id))

      // Update local state
      setPenalties((prev) => prev.filter((penalty) => penalty.id !== id))

      // Backup to localStorage
      localStorage.setItem("penalties", JSON.stringify(penalties.filter((penalty) => penalty.id !== id)))
    } catch (error) {
      console.error("Error deleting penalty:", error)

      // Fallback to localStorage only
      setPenalties((prev) => prev.filter((penalty) => penalty.id !== id))
      localStorage.setItem("penalties", JSON.stringify(penalties.filter((penalty) => penalty.id !== id)))
    }
  }

  // Reward CRUD operations
  const addReward = async (reward: Omit<Reward, "id">) => {
    try {
      // Check for potential duplicates
      const potentialDuplicate = rewards.find(
        (r) => r.agentId === reward.agentId && r.description === reward.description && r.date === reward.date,
      )

      if (potentialDuplicate) {
        throw new Error(`A similar reward already exists for this agent on ${reward.date}`)
      }

      // Add to Firebase
      const docRef = await addDoc(collection(db, "rewards"), reward)
      const rewardWithId = { ...reward, id: docRef.id } as Reward

      // Update local state with Firebase ID - use functional update to avoid race conditions
      setRewards((prev) => {
        // Check if reward already exists in state
        if (prev.some((r) => r.id === docRef.id)) {
          return prev
        }
        return [...prev, rewardWithId]
      })

      // Backup to localStorage
      const updatedRewards = [...rewards, rewardWithId]
      localStorage.setItem("rewards", JSON.stringify(updatedRewards))

      return rewardWithId
    } catch (error) {
      console.error("Error adding reward:", error)

      if ((error as Error).message.includes("already exists")) {
        throw error // Re-throw the duplicate reward error
      }

      // Improved ID generation with timestamp and random string
      const uniqueId = `reward-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`

      const newReward: Reward = {
        ...reward,
        id: uniqueId,
      }

      // Update local state - use functional update to avoid race conditions
      setRewards((prev) => {
        // Check if reward already exists in state
        if (prev.some((r) => r.id === uniqueId)) {
          return prev
        }
        return [...prev, newReward]
      })

      const updatedRewards = [...rewards, newReward]
      localStorage.setItem("rewards", JSON.stringify(updatedRewards))
      return newReward
    }
  }

  const updateReward = async (updatedReward: Reward) => {
    try {
      // Update in Firebase
      const rewardRef = doc(db, "rewards", updatedReward.id)
      await updateDoc(rewardRef, { ...updatedReward })

      // Update local state
      setRewards((prev) => prev.map((reward) => (reward.id === updatedReward.id ? updatedReward : reward)))

      // Backup to localStorage
      localStorage.setItem(
        "rewards",
        JSON.stringify(rewards.map((reward) => (reward.id === updatedReward.id ? updatedReward : reward))),
      )
    } catch (error) {
      console.error("Error updating reward:", error)

      // Fallback to localStorage only
      setRewards((prev) => prev.map((reward) => (reward.id === updatedReward.id ? updatedReward : reward)))
      localStorage.setItem(
        "rewards",
        JSON.stringify(rewards.map((reward) => (reward.id === updatedReward.id ? updatedReward : reward))),
      )
    }
  }

  const deleteReward = async (id: string) => {
    try {
      // Delete from Firebase
      await deleteDoc(doc(db, "rewards", id))

      // Update local state
      setRewards((prev) => prev.filter((reward) => reward.id !== id))

      // Backup to localStorage
      localStorage.setItem("rewards", JSON.stringify(rewards.filter((reward) => reward.id !== id)))
    } catch (error) {
      console.error("Error deleting reward:", error)

      // Fallback to localStorage only
      setRewards((prev) => prev.filter((reward) => reward.id !== id))
      localStorage.setItem("rewards", JSON.stringify(rewards.filter((reward) => reward.id !== id)))
    }
  }

  // Attendance CRUD operations
  const addAttendance = async (attendanceRecord: Omit<Attendance, "id">) => {
    try {
      // Check for potential duplicates
      const potentialDuplicate = attendance.find(
        (a) => a.agentId === attendanceRecord.agentId && a.date === attendanceRecord.date,
      )

      if (potentialDuplicate) {
        throw new Error(`An attendance record already exists for this agent on ${attendanceRecord.date}`)
      }

      // Add to Firebase
      const docRef = await addDoc(collection(db, "attendance"), attendanceRecord)
      const attendanceWithId = { ...attendanceRecord, id: docRef.id } as Attendance

      // Update local state with Firebase ID - use functional update to avoid race conditions
      setAttendance((prev) => {
        // Check if attendance already exists in state
        if (prev.some((a) => a.id === docRef.id)) {
          return prev
        }
        return [...prev, attendanceWithId]
      })

      // Backup to localStorage - Fix the localStorage key
      const updatedAttendance = [...attendance, attendanceWithId]
      localStorage.setItem("attendance", JSON.stringify(updatedAttendance))

      return attendanceWithId
    } catch (error) {
      console.error("Error adding attendance:", error)

      if ((error as Error).message.includes("already exists")) {
        throw error // Re-throw the duplicate attendance error
      }

      // Improved ID generation with timestamp and random string
      const uniqueId = `attendance-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`

      const newAttendance: Attendance = {
        ...attendanceRecord,
        id: uniqueId,
      }

      // Update local state - use functional update to avoid race conditions
      setAttendance((prev) => {
        // Check if attendance already exists in state
        if (prev.some((a) => a.id === uniqueId)) {
          return prev
        }
        return [...prev, newAttendance]
      })

      const updatedAttendance = [...attendance, newAttendance]
      localStorage.setItem("attendance", JSON.stringify(updatedAttendance))
      return newAttendance
    }
  }

  const updateAttendance = async (updatedAttendance: Attendance) => {
    try {
      // Update in Firebase
      const attendanceRef = doc(db, "attendance", updatedAttendance.id)
      await updateDoc(attendanceRef, { ...updatedAttendance })

      // Update local state
      setAttendance((prev) =>
        prev.map((attendance) => (attendance.id === updatedAttendance.id ? updatedAttendance : attendance)),
      )

      // Backup to localStorage
      localStorage.setItem(
        "attendance",
        JSON.stringify(attendance.map((item) => (item.id === updatedAttendance.id ? updatedAttendance : item))),
      )
    } catch (error) {
      console.error("Error updating attendance:", error)

      // Fallback to localStorage only
      setAttendance((prev) =>
        prev.map((attendance) => (attendance.id === updatedAttendance.id ? updatedAttendance : attendance)),
      )
      localStorage.setItem(
        "attendance",
        JSON.stringify(attendance.map((item) => (item.id === updatedAttendance.id ? updatedAttendance : item))),
      )
    }
  }

  const deleteAttendance = async (id: string) => {
    try {
      // Delete from Firebase
      await deleteDoc(doc(db, "attendance", id))

      // Update local state
      setAttendance((prev) => prev.filter((attendance) => attendance.id !== id))

      // Backup to localStorage
      localStorage.setItem("attendance", JSON.stringify(attendance.filter((item) => item.id !== id)))
    } catch (error) {
      console.error("Error deleting attendance:", error)

      // Fallback to localStorage only
      setAttendance((prev) => prev.filter((attendance) => attendance.id !== id))
      localStorage.setItem("attendance", JSON.stringify(attendance.filter((item) => item.id !== id)))
    }
  }

  return (
    <TeamContext.Provider
      value={{
        agents,
        penalties,
        rewards,
        attendance,
        metrics,
        addAgent,
        updateAgent,
        deleteAgent,
        addPenalty,
        updatePenalty,
        deletePenalty,
        addReward,
        updateReward,
        deleteReward,
        addAttendance,
        updateAttendance,
        deleteAttendance,
        calculateCommission,
      }}
    >
      {children}
    </TeamContext.Provider>
  )
}

export function useTeamContext() {
  const context = useContext(TeamContext)
  if (context === undefined) {
    throw new Error("useTeamContext must be used within a TeamProvider")
  }
  return context
}
