"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, EyeOff, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { DeviceInventory } from "@/types/inventory"

interface AddDeviceFormProps {
  onSubmit: (device: DeviceInventory) => Promise<boolean>
  agentNames: string[]
}

export default function AddDeviceForm({ onSubmit, agentNames }: AddDeviceFormProps) {
  const [formData, setFormData] = useState<DeviceInventory>({
    agent: "",
    imei: "",
    model: "",
    color: "",
    appleIdUsername: "",
    password: "",
    dateChecked: new Date().toISOString().split("T")[0],
    remarks: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const success = await onSubmit(formData)
      if (success) {
        // Reset form
        setFormData({
          agent: "",
          imei: "",
          model: "",
          color: "",
          appleIdUsername: "",
          password: "",
          dateChecked: new Date().toISOString().split("T")[0],
          remarks: "",
        })
      }
    } catch (error) {
      console.error("Error adding device:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="agent">
            Agent Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="agent"
            name="agent"
            value={formData.agent}
            onChange={handleChange}
            placeholder="Enter agent name"
            required
            list="agent-list"
          />
          {agentNames.length > 0 && (
            <datalist id="agent-list">
              {agentNames.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center">
            <Label htmlFor="imei">
              IMEI Number <span className="text-red-500">*</span>
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-4 w-4 ml-1">
                    <Info className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    To find your device IMEI:
                    <br />
                    1. Dial *#06# on your phone
                    <br />
                    2. Or go to Settings &gt; General &gt; About
                    <br />
                    3. Or check the back of your device or under the battery
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            id="imei"
            name="imei"
            value={formData.imei}
            onChange={handleChange}
            placeholder="Enter device IMEI"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="model">
            Device Model <span className="text-red-500">*</span>
          </Label>
          <Select name="model" value={formData.model} onValueChange={(value) => handleSelectChange("model", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select device model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="iPhone 8">iPhone 8</SelectItem>
              <SelectItem value="iPhone 9">iPhone 9</SelectItem>
              <SelectItem value="iPhone 10">iPhone 10</SelectItem>
              <SelectItem value="iPhone 11">iPhone 11</SelectItem>
              <SelectItem value="iPhone 12">iPhone 12</SelectItem>
              <SelectItem value="iPhone 13">iPhone 13</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="color">
            Color <span className="text-red-500">*</span>
          </Label>
          <Input
            id="color"
            name="color"
            value={formData.color}
            onChange={handleChange}
            placeholder="Enter device color"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="appleIdUsername">Apple ID Username</Label>
          <Input
            id="appleIdUsername"
            name="appleIdUsername"
            value={formData.appleIdUsername}
            onChange={handleChange}
            placeholder="Enter Apple ID username"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateChecked">
            Last Date Checked <span className="text-red-500">*</span>
          </Label>
          <Input
            id="dateChecked"
            name="dateChecked"
            type="date"
            value={formData.dateChecked}
            onChange={handleChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="remarks">Remarks</Label>
          <Textarea
            id="remarks"
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
            placeholder="Additional notes or remarks"
            rows={3}
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Adding..." : "Add Device"}
      </Button>
    </form>
  )
}
