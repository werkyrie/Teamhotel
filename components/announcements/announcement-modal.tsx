"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, X, Palette } from "lucide-react"
import { useAnnouncements } from "@/context/announcement-context"
import { useToast } from "@/hooks/use-toast"
import type { Announcement, AnnouncementFormData } from "@/types/announcement"

interface AnnouncementModalProps {
  isOpen: boolean
  onClose: () => void
  announcement?: Announcement | null
}

const colorPresets = [
  { name: "Default", bg: "", text: "" },
  { name: "Blue Theme", bg: "#dbeafe", text: "#1e40af" },
  { name: "Green Theme", bg: "#dcfce7", text: "#166534" },
  { name: "Yellow Theme", bg: "#fef3c7", text: "#92400e" },
  { name: "Red Theme", bg: "#fee2e2", text: "#991b1b" },
  { name: "Purple Theme", bg: "#f3e8ff", text: "#7c3aed" },
  { name: "Dark Theme", bg: "#1f2937", text: "#f9fafb" },
]

export default function AnnouncementModal({ isOpen, onClose, announcement }: AnnouncementModalProps) {
  const { createAnnouncement, updateAnnouncement } = useAnnouncements()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState<AnnouncementFormData>({
    title: "",
    message: "",
    type: "info",
    priority: "medium",
    backgroundColor: "",
    textColor: "",
  })

  useEffect(() => {
    if (announcement) {
      setFormData({
        title: announcement.title,
        message: announcement.message,
        type: announcement.type,
        priority: announcement.priority,
        expiresAt: announcement.expiresAt,
        imageUrl: announcement.imageUrl,
        backgroundColor: announcement.backgroundColor || "",
        textColor: announcement.textColor || "",
      })
      if (announcement.imageUrl) {
        setImagePreview(announcement.imageUrl)
      }
    } else {
      setFormData({
        title: "",
        message: "",
        type: "info",
        priority: "medium",
        backgroundColor: "",
        textColor: "",
      })
      setImagePreview("")
      setImageFile(null)
    }
  }, [announcement])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast({
          title: "Error",
          description: "Image size must be less than 5MB",
          variant: "destructive",
        })
        return
      }

      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview("")
    setFormData((prev) => ({ ...prev, imageUrl: "" }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const uploadImageToStorage = async (file: File): Promise<string> => {
    // For demo purposes, we'll use a data URL
    // In production, you'd upload to Firebase Storage or another service
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        resolve(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let imageUrl = formData.imageUrl || ""

      if (imageFile) {
        imageUrl = await uploadImageToStorage(imageFile)
      }

      const dataToSave = {
        ...formData,
        imageUrl: imageUrl || undefined,
      }

      if (announcement) {
        await updateAnnouncement(announcement.id, dataToSave)
      } else {
        await createAnnouncement(dataToSave)
      }
      onClose()
    } catch (error) {
      console.error("Error saving announcement:", error)
      toast({
        title: "Error",
        description: "Failed to save announcement",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof AnnouncementFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const applyColorPreset = (preset: (typeof colorPresets)[0]) => {
    setFormData((prev) => ({
      ...prev,
      backgroundColor: preset.bg,
      textColor: preset.text,
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{announcement ? "Edit Announcement" : "Create Announcement"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Enter announcement title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleChange("message", e.target.value)}
              placeholder="Enter announcement message"
              rows={4}
              required
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Image (Optional)</Label>
            <div className="space-y-3">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview || "/placeholder.svg"}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">Click to upload image</p>
                  <p className="text-xs text-gray-400">Max 5MB</p>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </div>
          </div>

          {/* Color Theme */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Color Theme
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {colorPresets.map((preset) => (
                <Button
                  key={preset.name}
                  type="button"
                  variant="outline"
                  className="h-12 justify-start"
                  style={{
                    backgroundColor: preset.bg || undefined,
                    color: preset.text || undefined,
                  }}
                  onClick={() => applyColorPreset(preset)}
                >
                  {preset.name}
                </Button>
              ))}
            </div>

            {/* Custom Colors */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="backgroundColor">Background Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="backgroundColor"
                    type="color"
                    value={formData.backgroundColor || "#ffffff"}
                    onChange={(e) => handleChange("backgroundColor", e.target.value)}
                    className="w-12 h-10 p-1 border rounded"
                  />
                  <Input
                    value={formData.backgroundColor || ""}
                    onChange={(e) => handleChange("backgroundColor", e.target.value)}
                    placeholder="#ffffff"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="textColor">Text Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="textColor"
                    type="color"
                    value={formData.textColor || "#000000"}
                    onChange={(e) => handleChange("textColor", e.target.value)}
                    className="w-12 h-10 p-1 border rounded"
                  />
                  <Input
                    value={formData.textColor || ""}
                    onChange={(e) => handleChange("textColor", e.target.value)}
                    placeholder="#000000"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preview */}
          {(formData.title || formData.message) && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <Card
                className="p-4"
                style={{
                  backgroundColor: formData.backgroundColor || undefined,
                  color: formData.textColor || undefined,
                }}
              >
                <CardContent className="p-0 space-y-2">
                  {formData.title && <h3 className="font-semibold text-lg">{formData.title}</h3>}
                  {imagePreview && (
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Preview"
                      className="w-full h-24 object-cover rounded"
                    />
                  )}
                  {formData.message && <p className="text-sm whitespace-pre-wrap">{formData.message}</p>}
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={formData.type} onValueChange={(value) => handleChange("type", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => handleChange("priority", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiresAt">Expiration Date (Optional)</Label>
            <Input
              id="expiresAt"
              type="datetime-local"
              value={formData.expiresAt ? formData.expiresAt.toISOString().slice(0, 16) : ""}
              onChange={(e) => handleChange("expiresAt", e.target.value ? new Date(e.target.value) : undefined)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : announcement ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
