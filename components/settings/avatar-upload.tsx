"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Camera, Upload, X, Shield } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function AvatarUpload() {
  const { isAdmin } = useAuth()
  const { toast } = useToast()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load avatar from localStorage on mount
  useEffect(() => {
    const savedAvatar = localStorage.getItem("userAvatar")
    if (savedAvatar) {
      setAvatarUrl(savedAvatar)
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload an image file (JPEG, PNG, etc.)",
      })
      return
    }

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please upload an image smaller than 2MB",
      })
      return
    }

    setIsUploading(true)

    // Read the file as a data URL
    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      setAvatarUrl(dataUrl)
      localStorage.setItem("userAvatar", dataUrl)
      window.dispatchEvent(new Event("avatarUpdated"))
      setIsUploading(false)

      toast({
        title: "Avatar updated",
        description: "Your avatar has been successfully updated",
      })
    }

    reader.onerror = () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to read the image file",
      })
      setIsUploading(false)
    }

    reader.readAsDataURL(file)
  }

  const handleRemoveAvatar = () => {
    setAvatarUrl(null)
    localStorage.removeItem("userAvatar")
    window.dispatchEvent(new Event("avatarUpdated"))

    toast({
      title: "Avatar removed",
      description: "Your avatar has been removed",
    })
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Avatar Settings</CardTitle>
          <CardDescription>Customize your profile avatar</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertTitle>Admin Access Required</AlertTitle>
            <AlertDescription>
              Only administrators can change avatar settings. Please contact an administrator for assistance.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Avatar Settings</CardTitle>
        <CardDescription>Customize your profile avatar</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center justify-center gap-4">
          <Avatar className="h-24 w-24 border-2 border-muted">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt="User avatar" />
            ) : (
              <AvatarFallback className="bg-primary text-primary-foreground">
                <Shield className="h-12 w-12" />
              </AvatarFallback>
            )}
          </Avatar>

          <div className="flex gap-2">
            <Button
              onClick={handleUploadClick}
              variant="outline"
              disabled={isUploading}
              className="flex items-center gap-2"
            >
              {isUploading ? "Uploading..." : "Upload Avatar"}
              <Upload className="h-4 w-4" />
            </Button>

            {avatarUrl && (
              <Button
                onClick={handleRemoveAvatar}
                variant="outline"
                className="flex items-center gap-2 text-red-500 hover:text-red-600"
              >
                Remove
                <X className="h-4 w-4" />
              </Button>
            )}

            <Input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Avatar Guidelines</Label>
          <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
            <li>Use a square image for best results</li>
            <li>Maximum file size: 2MB</li>
            <li>Supported formats: JPEG, PNG, GIF</li>
            <li>The avatar will be visible to all users</li>
          </ul>
        </div>

        <Alert>
          <Camera className="h-4 w-4" />
          <AlertTitle>Take a Photo</AlertTitle>
          <AlertDescription>
            You can also take a photo with your device camera by clicking "Upload Avatar" and selecting the camera
            option.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
