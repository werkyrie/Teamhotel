"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Mail, Phone, MapPin, Building, User, Edit, Shield, Crown } from "lucide-react"
import Link from "next/link"
import Sidebar from "@/components/sidebar"

export default function ProfilePage() {
  const { user, isAdmin, isViewer } = useAuth()
  const [activeTab, setActiveTab] = useState("")

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">Please log in to view your profile.</p>
        </div>
      </div>
    )
  }

  const getRoleBadge = () => {
    if (isAdmin) {
      return (
        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
          <Crown className="w-3 h-3 mr-1" />
          Administrator
        </Badge>
      )
    }
    if (isViewer) {
      return (
        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
          <Shield className="w-3 h-3 mr-1" />
          Viewer
        </Badge>
      )
    }
    return (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
        <User className="w-3 h-3 mr-1" />
        Editor
      </Badge>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 pl-0 md:pl-64">
        <div className="container mx-auto py-8 px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold">Profile</h1>
                <p className="text-muted-foreground">Manage your account settings and preferences</p>
              </div>
              <Link href="/profile/edit">
                <Button>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </Link>
            </div>

            {/* Profile Card */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                    <AvatarFallback className="text-2xl font-bold">
                      {user.name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                      <CardTitle className="text-2xl">{user.name || "Unknown User"}</CardTitle>
                      {getRoleBadge()}
                    </div>
                    <CardDescription className="text-base">{user.email}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Profile Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{user.email}</p>
                    </div>
                  </div>

                  {user.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{user.phone}</p>
                      </div>
                    </div>
                  )}

                  {user.location && (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="font-medium">{user.location}</p>
                      </div>
                    </div>
                  )}

                  {user.department && (
                    <div className="flex items-center gap-3">
                      <Building className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Department</p>
                        <p className="font-medium">{user.department}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Account Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Account Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 flex items-center justify-center">
                      {isAdmin ? (
                        <Crown className="w-4 h-4 text-red-500" />
                      ) : isViewer ? (
                        <Shield className="w-4 h-4 text-blue-500" />
                      ) : (
                        <User className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Role</p>
                      <p className="font-medium">{isAdmin ? "Administrator" : isViewer ? "Viewer" : "Editor"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <CalendarDays className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Member Since</p>
                      <p className="font-medium">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          : "Unknown"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 flex items-center justify-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="font-medium text-green-600">Active</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Permissions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Permissions & Access
                </CardTitle>
                <CardDescription>Your current access level and permissions within the system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                      <User className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="font-medium mb-1">View Access</h3>
                    <p className="text-sm text-muted-foreground">Can view all data and reports</p>
                  </div>

                  <div className="text-center p-4 border rounded-lg">
                    <div
                      className={`w-8 h-8 mx-auto mb-2 flex items-center justify-center rounded-full ${
                        !isViewer ? "bg-green-100 dark:bg-green-900/30" : "bg-gray-100 dark:bg-gray-900/30"
                      }`}
                    >
                      <Edit
                        className={`w-4 h-4 ${!isViewer ? "text-green-600 dark:text-green-400" : "text-gray-400"}`}
                      />
                    </div>
                    <h3 className="font-medium mb-1">Edit Access</h3>
                    <p className="text-sm text-muted-foreground">
                      {!isViewer ? "Can edit and modify data" : "Read-only access"}
                    </p>
                  </div>

                  <div className="text-center p-4 border rounded-lg">
                    <div
                      className={`w-8 h-8 mx-auto mb-2 flex items-center justify-center rounded-full ${
                        isAdmin ? "bg-red-100 dark:bg-red-900/30" : "bg-gray-100 dark:bg-gray-900/30"
                      }`}
                    >
                      <Crown className={`w-4 h-4 ${isAdmin ? "text-red-600 dark:text-red-400" : "text-gray-400"}`} />
                    </div>
                    <h3 className="font-medium mb-1">Admin Access</h3>
                    <p className="text-sm text-muted-foreground">
                      {isAdmin ? "Full system administration" : "Limited access"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
