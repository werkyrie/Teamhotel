"use client"

import { useState, useEffect } from "react"
import { db, auth } from "@/lib/firebase"
import { collection, getDocs, doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/auth-context"
import { Trash2, UserPlus, Edit, CheckCircle, XCircle, Clock, UserCheck } from "lucide-react"

interface User {
  id: string
  email: string
  role: string
  displayName: string
  nickname?: string
  approved: boolean
  createdAt: any
  registrationDate?: string
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [pendingUsers, setPendingUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [isEditUserOpen, setIsEditUserOpen] = useState(false)
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    role: "Viewer",
    nickname: "",
  })
  const [editUser, setEditUser] = useState<User | null>(null)
  const { toast } = useToast()
  const { user: currentUser } = useAuth()

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, "users"))
        const approvedUsersList: User[] = []
        const pendingUsersList: User[] = []

        usersSnapshot.forEach((doc) => {
          const userData = doc.data()
          const user: User = {
            id: doc.id,
            email: userData.email || "",
            role: userData.role || "Viewer",
            displayName: userData.displayName || userData.nickname || "",
            nickname: userData.nickname || "",
            approved: userData.approved !== false,
            createdAt: userData.createdAt,
            registrationDate: userData.registrationDate,
          }

          if (userData.approved === false) {
            pendingUsersList.push(user)
          } else {
            approvedUsersList.push(user)
          }
        })

        setUsers(approvedUsersList)
        setPendingUsers(pendingUsersList)
      } catch (error) {
        console.error("Error fetching users:", error)
        toast({
          title: "Error",
          description: "Failed to load users",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [toast])

  const handleApproveUser = async (userId: string) => {
    try {
      // Update user document to set approved = true
      await setDoc(
        doc(db, "users", userId),
        {
          approved: true,
          approvedAt: serverTimestamp(),
          approvedBy: currentUser?.uid,
        },
        { merge: true },
      )

      // Move user from pending to approved list
      const approvedUser = pendingUsers.find((user) => user.id === userId)
      if (approvedUser) {
        approvedUser.approved = true
        setUsers([...users, approvedUser])
        setPendingUsers(pendingUsers.filter((user) => user.id !== userId))
      }

      toast({
        title: "Success",
        description: "User approved successfully",
      })
    } catch (error: any) {
      console.error("Error approving user:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to approve user",
        variant: "destructive",
      })
    }
  }

  const handleRejectUser = async (userId: string) => {
    if (!confirm("Are you sure you want to reject this user? This will permanently delete their account.")) {
      return
    }

    try {
      // Delete user document from Firestore
      await deleteDoc(doc(db, "users", userId))

      // Remove user from pending list
      setPendingUsers(pendingUsers.filter((user) => user.id !== userId))

      toast({
        title: "Success",
        description: "User rejected and account deleted",
      })
    } catch (error: any) {
      console.error("Error rejecting user:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to reject user",
        variant: "destructive",
      })
    }
  }

  const handleAddUser = async () => {
    if (newUser.password !== newUser.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return
    }

    if (newUser.password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      })
      return
    }

    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, newUser.email, newUser.password)

      // Create user document in Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email: newUser.email,
        role: newUser.role,
        displayName: newUser.nickname || newUser.email.split("@")[0],
        nickname: newUser.nickname || newUser.email.split("@")[0],
        approved: true, // Admin-created users are auto-approved
        createdAt: serverTimestamp(),
        createdBy: currentUser?.uid,
      })

      // Add user to local state
      setUsers([
        ...users,
        {
          id: userCredential.user.uid,
          email: newUser.email,
          role: newUser.role,
          displayName: newUser.nickname || newUser.email.split("@")[0],
          nickname: newUser.nickname || newUser.email.split("@")[0],
          approved: true,
          createdAt: new Date(),
        },
      ])

      // Reset form and close dialog
      setNewUser({
        email: "",
        password: "",
        confirmPassword: "",
        role: "Viewer",
        nickname: "",
      })
      setIsAddUserOpen(false)

      toast({
        title: "Success",
        description: "User created successfully",
      })
    } catch (error: any) {
      console.error("Error adding user:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      })
    }
  }

  const handleUpdateUser = async () => {
    if (!editUser) return

    try {
      // Update user document in Firestore
      await setDoc(
        doc(db, "users", editUser.id),
        {
          email: editUser.email,
          role: editUser.role,
          displayName: editUser.nickname || editUser.displayName,
          nickname: editUser.nickname,
        },
        { merge: true },
      )

      // Update user in local state
      setUsers(users.map((user) => (user.id === editUser.id ? editUser : user)))

      // Close dialog
      setIsEditUserOpen(false)

      toast({
        title: "Success",
        description: "User updated successfully",
      })
    } catch (error: any) {
      console.error("Error updating user:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      })
    }
  }

  const handleDeleteUser = async (userId: string) => {
    // Don't allow deleting yourself
    if (userId === currentUser?.uid) {
      toast({
        title: "Error",
        description: "You cannot delete your own account",
        variant: "destructive",
      })
      return
    }

    if (!confirm("Are you sure you want to delete this user?")) {
      return
    }

    try {
      // Delete user document from Firestore
      await deleteDoc(doc(db, "users", userId))

      // Remove user from local state
      setUsers(users.filter((user) => user.id !== userId))

      toast({
        title: "Success",
        description: "User deleted successfully",
      })
    } catch (error: any) {
      console.error("Error deleting user:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Manage user accounts, permissions, and approvals</CardDescription>
          </div>
          <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>Create a new user account with specific permissions.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="user@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nickname">Nickname</Label>
                  <Input
                    id="nickname"
                    value={newUser.nickname}
                    onChange={(e) => setNewUser({ ...newUser, nickname: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={newUser.confirmPassword}
                    onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddUser}>Create User</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit User Dialog */}
          <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
                <DialogDescription>Update user information and permissions.</DialogDescription>
              </DialogHeader>
              {editUser && (
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">Email</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editUser.email}
                      onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-nickname">Nickname</Label>
                    <Input
                      id="edit-nickname"
                      value={editUser.nickname || ""}
                      onChange={(e) => setEditUser({ ...editUser, nickname: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-role">Role</Label>
                    <Select value={editUser.role} onValueChange={(value) => setEditUser({ ...editUser, role: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="Viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateUser}>Update User</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">Loading users...</div>
        ) : (
          <Tabs defaultValue="approved" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="approved" className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Approved Users ({users.length})
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending Approval ({pendingUsers.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="approved">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        No approved users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.nickname || user.displayName || "—"}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === "Admin" ? "default" : "secondary"}>{user.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approved
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditUser(user)
                              setIsEditUserOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={user.id === currentUser?.uid}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="pending">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Registration Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        No pending approvals
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.nickname || user.displayName || "—"}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          {user.registrationDate ? new Date(user.registrationDate).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleApproveUser(user.id)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <CheckCircle className="h-4 w-4" />
                            <span className="sr-only">Approve</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRejectUser(user.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4" />
                            <span className="sr-only">Reject</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          Total users: {users.length} approved, {pendingUsers.length} pending
        </div>
      </CardFooter>
    </Card>
  )
}
