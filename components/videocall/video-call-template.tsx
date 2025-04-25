"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { jsPDF } from "jspdf"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  User,
  MapPin,
  Briefcase,
  Heart,
  PawPrint,
  Users,
  CloudSun,
  Calendar,
  Globe,
  Car,
  UserIcon,
  Tag,
  Clock,
  BabyIcon,
  Edit,
  Info,
  FileText,
  Download,
  ArrowLeft,
  CheckCircle,
  Video,
  Music,
  ChevronDown,
  ChevronUp,
  Target,
  History,
  MountainIcon as Hiking,
  CloudRain,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface FormData {
  // Model Details
  purpose: string
  fullName: string
  location: string
  previousLocation: string
  work: string
  divorce: string
  pet: string
  kids: string
  weather: string
  parents: string
  plans: string
  ethnicity: string
  car: string

  // Client Details
  clientName: string
  clientLocation: string
  clientWork: string
  hobbies: string
  clientkid: string
  clientnickname: string
  clientweekend: string
  clientweather: string

  // Topics
  beforeCall: string
  afterCall: string
  kidLocation: string
  remarks: string
}

const initialFormData: FormData = {
  // Model Details
  purpose: "",
  fullName: "",
  location: "",
  previousLocation: "",
  work: "",
  divorce: "",
  pet: "",
  kids: "",
  weather: "",
  parents: "",
  plans: "",
  ethnicity: "",
  car: "",

  // Client Details
  clientName: "",
  clientLocation: "",
  clientWork: "",
  hobbies: "",
  clientkid: "",
  clientnickname: "",
  clientweekend: "",
  clientweather: "",

  // Topics
  beforeCall: "",
  afterCall: "",
  kidLocation: "",
  remarks: "",
}

const requiredFields = [
  "purpose",
  "fullName",
  "location",
  "work",
  "kids",
  "weather",
  "parents",
  "plans",
  "clientName",
  "clientLocation",
  "clientWork",
  "clientnickname",
  "clientweekend",
  "clientweather",
  "beforeCall",
  "afterCall",
  "kidLocation",
]

export default function VideoCallTemplate() {
  const [formData, setFormData] = useState<FormData>(() => {
    // Load from localStorage if available
    if (typeof window !== "undefined") {
      const savedData = localStorage.getItem("videoCallFormData")
      return savedData ? JSON.parse(savedData) : initialFormData
    }
    return initialFormData
  })

  const [activeSection, setActiveSection] = useState("model")
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    model: true,
    client: false,
    topics: false,
  })
  const [progress, setProgress] = useState(0)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const pdfRef = useRef<HTMLIFrameElement>(null)
  const confettiContainerRef = useRef<HTMLDivElement>(null)

  // Section definitions
  const sections = [
    {
      id: "model",
      title: "Model Details",
      icon: <User className="h-4 w-4" />,
      requiredFields: ["purpose", "fullName", "location", "work", "kids", "weather", "parents", "plans"],
      optionalFields: ["previousLocation", "divorce", "pet", "ethnicity", "car"],
    },
    {
      id: "client",
      title: "Client Details",
      icon: <UserIcon className="h-4 w-4" />,
      requiredFields: [
        "clientName",
        "clientLocation",
        "clientWork",
        "clientnickname",
        "clientweekend",
        "clientweather",
      ],
      optionalFields: ["hobbies", "clientkid"],
    },
    {
      id: "topics",
      title: "Topics to Discuss",
      icon: <FileText className="h-4 w-4" />,
      requiredFields: ["beforeCall", "afterCall", "kidLocation"],
      optionalFields: ["remarks"],
    },
  ]

  // Update progress when form data changes
  useEffect(() => {
    updateProgress()
    // Save to localStorage
    localStorage.setItem("videoCallFormData", JSON.stringify(formData))
  }, [formData])

  const updateProgress = () => {
    const totalFields = requiredFields.length
    const filledFields = requiredFields.filter((field) => formData[field as keyof FormData]?.trim() !== "").length
    setProgress(Math.round((filledFields / totalFields) * 100))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const isSectionComplete = (sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId)
    if (!section) return false
    return section.requiredFields.every((field) => formData[field as keyof FormData]?.trim() !== "")
  }

  const isFormValid = () => {
    return requiredFields.every((field) => formData[field as keyof FormData]?.trim() !== "")
  }

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }))
    setActiveSection(sectionId)
  }

  const handleGeneratePdf = () => {
    if (!isFormValid()) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields before generating the PDF.",
        variant: "destructive",
      })

      // Find the first section with incomplete fields and expand it
      for (const section of sections) {
        if (!isSectionComplete(section.id)) {
          setActiveSection(section.id)
          setExpandedSections((prev) => ({
            ...prev,
            [section.id]: true,
          }))
          break
        }
      }
      return
    }

    setIsLoading(true)
    setIsDialogOpen(true)

    // Simulate PDF generation delay
    setTimeout(() => {
      generatePDF()
      setIsLoading(false)
    }, 1000)
  }

  const truncateText = (text: string, maxLength: number) => {
    if (!text) return "N/A"
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text
  }

  const generatePDF = () => {
    // Force refresh values from form elements
    const formValues: Record<string, string> = {}
    Object.keys(formData).forEach((id) => {
      formValues[id] = formData[id as keyof FormData] || ""
    })

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })

    let yPosition = 15
    const pageWidth = doc.internal.pageSize.width
    const margin = 20
    const contentWidth = pageWidth - margin * 2

    // Set page properties - Dark theme
    doc.setFillColor(15, 15, 20)
    doc.rect(0, 0, pageWidth, doc.internal.pageSize.height, "F")

    // Title with gradient effect
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")

    // Background rectangle for title
    doc.setFillColor(25, 25, 30)
    doc.roundedRect(20, yPosition - 8, doc.internal.pageSize.width - 40, 16, 5, 5, "F")

    // Title text - TikTok colors
    doc.setTextColor(255, 0, 80)
    doc.text("TikTok Video Call Details", pageWidth / 2, yPosition, { align: "center" })
    yPosition += 10

    // Add date/time banner
    const now = new Date()
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
    const formattedDate = now.toLocaleDateString("en-US", options)

    // Date banner
    doc.setFillColor(25, 25, 30)
    doc.roundedRect(margin, yPosition, contentWidth, 10, 3, 3, "F")
    doc.setTextColor(180, 180, 180)
    doc.setFontSize(9)
    doc.text(`Generated on: ${formattedDate}`, pageWidth / 2, yPosition + 6, { align: "center" })
    yPosition += 18

    // Function to add a section with a modern look
    const addModernSection = (
      doc: jsPDF,
      title: string,
      data: { label: string; value: string }[],
      yPosition: number,
      margin: number,
      contentWidth: number,
    ) => {
      // Section title with modern styling
      doc.setFillColor(30, 30, 35)
      doc.roundedRect(margin, yPosition - 5, contentWidth, 12, 4, 4, "F")

      // Section title text
      doc.setFontSize(12)
      doc.setTextColor(255, 255, 255)
      doc.setFont("helvetica", "bold")
      doc.text(title, margin + 10, yPosition + 2)
      yPosition += 14

      // Modern card for content
      doc.setFillColor(22, 22, 28)
      doc.roundedRect(margin, yPosition - 5, contentWidth, 10 + data.length * 9, 4, 4, "F")
      yPosition += 5

      // Section content with modern styling - NO separator lines
      doc.setFont("helvetica", "normal")
      data.forEach((item, index) => {
        // Alternate row backgrounds without lines
        if (index % 2 === 0) {
          doc.setFillColor(25, 25, 32, 0.5)
          doc.roundedRect(margin + 5, yPosition - 3, contentWidth - 10, 10, 2, 2, "F")
        }

        // Label
        doc.setFontSize(8)
        doc.setTextColor(0, 242, 234)
        doc.setFont("helvetica", "bold")
        doc.text(item.label, margin + 10, yPosition)

        // Value
        doc.setFont("helvetica", "normal")
        doc.setFontSize(9)
        doc.setTextColor(255, 255, 255)

        const maxWidth = contentWidth - 55
        const textLines = doc.splitTextToSize(item.value, maxWidth)
        doc.text(textLines, margin + 55, yPosition)

        // Calculate space needed for wrapped text
        yPosition += 6 + (textLines.length - 1) * 4
      })

      // Add space after the section
      yPosition += 10

      return yPosition
    }

    // Process model data with optional fields
    const modelData = [
      { label: "Purpose of Call:", value: formValues["purpose"] || "N/A" },
      { label: "Full Name / Age:", value: formValues["fullName"] || "N/A" },
      { label: "Current Location:", value: formValues["location"] || "N/A" },
      { label: "Previous Location:", value: formValues["previousLocation"] || "N/A" },
      { label: "Occupation:", value: formValues["work"] || "N/A" },
      { label: "Relationship Status:", value: formValues["divorce"] || "N/A" },
      { label: "Pet Details:", value: formValues["pet"] || "N/A" },
      { label: "Children Details:", value: formValues["kids"] || "N/A" },
      { label: "Weather and Time:", value: formValues["weather"] || "N/A" },
      { label: "Parent Details:", value: formValues["parents"] || "N/A" },
      { label: "Weekend Plans:", value: formValues["plans"] || "N/A" },
      { label: "Ethnicity:", value: formValues["ethnicity"] || "N/A" },
      { label: "Vehicle Details:", value: formValues["car"] || "N/A" },
    ]

    // Add model section to PDF
    yPosition = addModernSection(doc, "MODEL DETAILS", modelData, yPosition, margin, contentWidth)

    // Process client data with optional fields
    const clientData = [
      { label: "Full Name / Age:", value: formValues["clientName"] || "N/A" },
      { label: "Location:", value: formValues["clientLocation"] || "N/A" },
      { label: "Occupation:", value: formValues["clientWork"] || "N/A" },
      { label: "Hobbies:", value: formValues["hobbies"] || "N/A" },
      { label: "Children Details:", value: formValues["clientkid"] || "N/A" },
      { label: "Nickname:", value: formValues["clientnickname"] || "N/A" },
      { label: "Weekend Plans:", value: formValues["clientweekend"] || "N/A" },
      { label: "Weather and Time:", value: formValues["clientweather"] || "N/A" },
    ]

    // Add client section to PDF
    yPosition = addModernSection(doc, "CLIENT DETAILS", clientData, yPosition, margin, contentWidth)

    // Process topics data with optional field
    const topicsData = [
      { label: "What you do before the call?:", value: formValues["beforeCall"] || "N/A" },
      { label: "What will you do after the call?:", value: formValues["afterCall"] || "N/A" },
      { label: "Where is your Child?:", value: formValues["kidLocation"] || "N/A" },
    ]

    // Add remarks if provided
    const remarks = formValues["remarks"]
    if (remarks.trim() !== "") {
      topicsData.push({ label: "Additional Topics:", value: remarks })
    }

    // Add topics section to PDF
    yPosition = addModernSection(doc, "TOPICS TO DISCUSS", topicsData, yPosition, margin, contentWidth)

    // Add footer with TikTok branding
    // Footer block
    doc.setFillColor(25, 25, 30)
    doc.roundedRect(margin, 275, contentWidth, 12, 3, 3, "F")

    // TikTok logo (simplified)
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(255, 0, 80)
    doc.text("TikTok", 25, 282)

    // Page info
    doc.setFont("helvetica", "normal")
    doc.setTextColor(150, 150, 150)
    doc.text("Video Call Information", pageWidth / 2, 282, { align: "center" })

    // Timestamp
    const timestamp = new Date().toISOString().replace(/T/, " ").replace(/\..+/, "")
    doc.setFontSize(6)
    doc.setTextColor(100, 100, 100)
    doc.text(`ID: TT-${timestamp.substring(0, 10)}`, pageWidth - 25, 282)

    // Convert to data URL for preview
    const pdfDataUrl = doc.output("datauristring")
    setPdfUrl(pdfDataUrl)
  }

  const handleDownloadPdf = () => {
    if (!pdfUrl) return

    // Create a link element
    const link = document.createElement("a")
    link.href = pdfUrl

    // Use client name for the filename if available, otherwise use a timestamp
    const timestamp = new Date().getTime()
    link.download = `TikTok_Video_Call_Details_${timestamp}.pdf`

    // Trigger download
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "PDF Downloaded",
      description: "Your video call information has been downloaded successfully.",
    })

    // Create confetti effect
    createConfetti()
  }

  const handleReset = () => {
    if (confirm("Are you sure you want to reset the form? All data will be lost.")) {
      setFormData(initialFormData)
      localStorage.removeItem("videoCallFormData")
      setPdfUrl(null)
      setActiveSection("model")
      setExpandedSections({
        model: true,
        client: false,
        topics: false,
      })
      toast({
        title: "Form Reset",
        description: "All form data has been cleared.",
      })
    }
  }

  const createConfetti = () => {
    if (!confettiContainerRef.current) return

    const container = confettiContainerRef.current
    container.innerHTML = ""

    const colors = ["#ff0050", "#00f2ea", "#ffffff", "#fffc00"]

    for (let i = 0; i < 100; i++) {
      const confetti = document.createElement("div")
      confetti.className = "confetti"
      confetti.style.position = "absolute"
      confetti.style.width = `${Math.random() * 10 + 5}px`
      confetti.style.height = `${Math.random() * 6 + 4}px`
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]
      confetti.style.left = `${Math.random() * 100}vw`
      confetti.style.opacity = `${Math.random() * 0.6 + 0.4}`
      confetti.style.animation = `confetti-fall ${Math.random() * 3 + 2}s linear forwards`

      container.appendChild(confetti)
    }

    // Remove confetti after animation completes
    setTimeout(() => {
      container.innerHTML = ""
    }, 5000)
  }

  const renderFormField = (
    name: keyof FormData,
    label: string,
    icon: React.ReactNode,
    required = false,
    placeholder = "",
    helpText = "",
    tooltip = "",
  ) => {
    const isCompleted = formData[name]?.trim() !== ""

    return (
      <div className="space-y-2">
        <div className="flex items-center">
          <label htmlFor={name} className="text-sm font-medium flex items-center gap-1">
            {label}
            {required && (
              <Badge
                variant="outline"
                className="text-[10px] py-0 border-[#FE2C55] text-[#FE2C55] dark:border-[#FE2C55] dark:text-[#FE2C55]"
              >
                Required
              </Badge>
            )}
            {tooltip && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help ml-1" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs bg-[#000000] text-white border-[#25F4EE]">
                    <p className="text-xs">{tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </label>
        </div>
        <div className="relative">
          <div
            className={`absolute left-3 top-1/2 -translate-y-1/2 ${isCompleted ? "text-[#25F4EE]" : "text-muted-foreground"}`}
          >
            {icon}
          </div>
          <Input
            id={name}
            name={name}
            value={formData[name]}
            onChange={handleInputChange}
            className={`pl-10 transition-all duration-200 ${
              isCompleted
                ? "border-[#25F4EE] ring-1 ring-[#25F4EE]/20 dark:ring-[#25F4EE]/30"
                : "focus:border-[#FE2C55] focus:ring-1 focus:ring-[#FE2C55]/20 dark:focus:ring-[#FE2C55]/30"
            }`}
            placeholder={placeholder}
            required={required}
          />
          {isCompleted && <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#25F4EE]" />}
        </div>
        {helpText && <p className="text-xs text-muted-foreground">{helpText}</p>}
      </div>
    )
  }

  // Get progress color based on completion percentage
  const getProgressColor = () => {
    if (progress < 33) return "from-[#FE2C55] to-[#FE2C55]"
    if (progress < 66) return "from-[#FE2C55] to-[#25F4EE]"
    if (progress < 100) return "from-[#25F4EE] to-[#25F4EE]"
    return "from-[#25F4EE] to-[#25F4EE]"
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <Card className="border shadow-lg overflow-hidden bg-white dark:bg-[#121212] dark:border-[#333333] relative">
        {/* TikTok-style decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#25F4EE]/20 to-[#FE2C55]/20 rounded-bl-full -z-10"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-[#25F4EE]/20 to-[#FE2C55]/20 rounded-tr-full -z-10"></div>

        <div className="pb-4 text-black dark:text-white bg-gradient-to-r from-white to-gray-100 dark:from-[#000000] dark:to-[#121212] border-b border-gray-200 dark:border-[#333333] p-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="relative">
              <Video className="h-6 w-6 text-[#25F4EE]" />
              <Music className="h-3 w-3 text-[#FE2C55] absolute -top-1 -right-1" />
            </div>
            <h1 className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-[#25F4EE] to-[#FE2C55]">
              Video Call Information
            </h1>
          </div>
          <p className="text-center text-gray-300 text-sm">For Team Hotel Use Only!</p>
          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-xs">
              <span className={`${progress >= 0 ? "font-medium text-[#25F4EE]" : "text-muted-foreground"}`}>Start</span>
              <span className={`${progress >= 33 ? "font-medium text-[#25F4EE]" : "text-muted-foreground"}`}>
                Model Details
              </span>
              <span className={`${progress >= 66 ? "font-medium text-[#25F4EE]" : "text-muted-foreground"}`}>
                Client Details
              </span>
              <span className={`${progress >= 100 ? "font-medium text-[#25F4EE]" : "text-muted-foreground"}`}>
                Complete
              </span>
            </div>
            <div className="h-2 w-full bg-gray-200 dark:bg-[#333333] rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${getProgressColor()} transition-all duration-500 ease-out`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              {progress === 100 ? (
                <span className="text-[#25F4EE] flex items-center justify-center gap-1">
                  <CheckCircle className="h-3 w-3" /> All fields completed!
                </span>
              ) : (
                `${progress}% complete`
              )}
            </p>
          </div>
        </div>

        <CardContent className="p-6 dark:bg-[#121212]">
          <div className="space-y-4">
            {/* Model Details Section */}
            <div
              className={cn(
                "bg-gray-50 dark:bg-[#1a1a1a] border-l-4 rounded-lg overflow-hidden transition-all duration-300",
                activeSection === "model" ? "border-l-[#25F4EE]" : "border-l-transparent hover:border-l-[#25F4EE]/30",
              )}
            >
              <div className="flex items-center p-4 cursor-pointer" onClick={() => toggleSection("model")}>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#25F4EE] to-[#FE2C55] flex items-center justify-center mr-3 shadow-lg">
                  <User className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-lg font-semibold flex-1">
                  Model Details
                  <span
                    className={cn(
                      "ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs",
                      isSectionComplete("model") ? "bg-[#25F4EE]/20 text-[#25F4EE]" : "bg-gray-800 text-gray-400",
                    )}
                  >
                    {isSectionComplete("model") ? <CheckCircle className="h-3 w-3" /> : "!"}
                  </span>
                </h2>
                <button className="h-8 w-8 rounded-full flex items-center justify-center bg-gray-200 dark:bg-[#252525] text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-[#333] hover:text-black dark:hover:text-white transition-colors">
                  {expandedSections.model ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>

              {expandedSections.model && (
                <div className="p-5 border-t border-gray-200 dark:border-[#333] animate-in fade-in-50 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderFormField(
                      "purpose",
                      "Purpose of Call",
                      <Target className="h-4 w-4" />,
                      true,
                      "E.g., Authenticity",
                    )}
                    {renderFormField(
                      "fullName",
                      "Full Name / Age",
                      <User className="h-4 w-4" />,
                      true,
                      "E.g., Jane Smith / 30",
                      "Format: Name / Age",
                    )}
                    {renderFormField(
                      "location",
                      "Current Location",
                      <MapPin className="h-4 w-4" />,
                      true,
                      "E.g., Makati (5 years)",
                      "",
                      "Include city/area and how many years you've lived there",
                    )}
                    {renderFormField(
                      "previousLocation",
                      "Previous Location",
                      <History className="h-4 w-4" />,
                      false,
                      "E.g., Manila",
                    )}
                    {renderFormField(
                      "work",
                      "Occupation",
                      <Briefcase className="h-4 w-4" />,
                      true,
                      "E.g., Executive Assistant",
                    )}
                    {renderFormField(
                      "divorce",
                      "Relationship Status",
                      <Heart className="h-4 w-4" />,
                      false,
                      "E.g., Separated since 2022 (2 years)",
                      "If applicable, include when and for how long",
                    )}
                    {renderFormField(
                      "pet",
                      "Pet Details",
                      <PawPrint className="h-4 w-4" />,
                      false,
                      "E.g., Dog / Max / 3 years old",
                      "Type, name, age (or 'None' if not applicable)",
                    )}
                    {renderFormField(
                      "kids",
                      "Children Details",
                      <BabyIcon className="h-4 w-4" />,
                      true,
                      "E.g., Sofia / 8 / ABC School / Grade 3",
                      "Names, ages, schools, grades (or 'NA' if not applicable)",
                    )}
                    {renderFormField(
                      "weather",
                      "Current Weather & Time",
                      <CloudSun className="h-4 w-4" />,
                      true,
                      "E.g., Sunny, 3:45 PM",
                    )}
                    {renderFormField(
                      "parents",
                      "Parent Details",
                      <Users className="h-4 w-4" />,
                      true,
                      "E.g., Mother (62, retired), Father (deceased)",
                      "Just put N/A if not mentioned",
                    )}
                    {renderFormField(
                      "plans",
                      "Weekend Plans",
                      <Calendar className="h-4 w-4" />,
                      true,
                      "E.g., Beach trip with friends",
                    )}
                    {renderFormField(
                      "ethnicity",
                      "Ethnicity",
                      <Globe className="h-4 w-4" />,
                      false,
                      "E.g., Filipina Taiwanese",
                    )}
                    {renderFormField(
                      "car",
                      "Vehicle Details",
                      <Car className="h-4 w-4" />,
                      false,
                      "E.g., Toyota Corolla 2020",
                      "Make, model, year (or 'None' if not applicable)",
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Client Details Section */}
            <div
              className={cn(
                "bg-gray-50 dark:bg-[#1a1a1a] border-l-4 rounded-lg overflow-hidden transition-all duration-300",
                activeSection === "client" ? "border-l-[#FE2C55]" : "border-l-transparent hover:border-l-[#FE2C55]/30",
              )}
            >
              <div className="flex items-center p-4 cursor-pointer" onClick={() => toggleSection("client")}>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FE2C55] to-[#25F4EE] flex items-center justify-center mr-3 shadow-lg">
                  <UserIcon className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-lg font-semibold flex-1">
                  Client Details
                  <span
                    className={cn(
                      "ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs",
                      isSectionComplete("client") ? "bg-[#FE2C55]/20 text-[#FE2C55]" : "bg-gray-800 text-gray-400",
                    )}
                  >
                    {isSectionComplete("client") ? <CheckCircle className="h-3 w-3" /> : "!"}
                  </span>
                </h2>
                <button className="h-8 w-8 rounded-full flex items-center justify-center bg-gray-200 dark:bg-[#252525] text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-[#333] hover:text-black dark:hover:text-white transition-colors">
                  {expandedSections.client ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>

              {expandedSections.client && (
                <div className="p-5 border-t border-gray-200 dark:border-[#333] animate-in fade-in-50 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderFormField(
                      "clientName",
                      "Full Name and Age",
                      <UserIcon className="h-4 w-4" />,
                      true,
                      "E.g., John Doe / 32",
                    )}
                    {renderFormField(
                      "clientLocation",
                      "Location",
                      <MapPin className="h-4 w-4" />,
                      true,
                      "E.g., New York",
                    )}
                    {renderFormField(
                      "clientWork",
                      "Occupation",
                      <Briefcase className="h-4 w-4" />,
                      true,
                      "E.g., Marketing Manager",
                    )}
                    {renderFormField(
                      "hobbies",
                      "Hobbies",
                      <Hiking className="h-4 w-4" />,
                      false,
                      "E.g., Hiking, Travel",
                      "Enter 'None' if not applicable",
                    )}
                    {renderFormField(
                      "clientkid",
                      "Children Details",
                      <BabyIcon className="h-4 w-4" />,
                      false,
                      "E.g., Lily / 3",
                      "Names and ages (or 'None' if not applicable)",
                    )}
                    {renderFormField(
                      "clientnickname",
                      "Nickname",
                      <Tag className="h-4 w-4" />,
                      true,
                      "E.g., Johnny",
                      "Enter 'None' if not applicable",
                    )}
                    {renderFormField(
                      "clientweekend",
                      "Weekend Plans",
                      <Calendar className="h-4 w-4" />,
                      true,
                      "E.g., Fishing trip",
                      "Enter 'None' if not applicable",
                    )}
                    {renderFormField(
                      "clientweather",
                      "Weather and Time",
                      <CloudRain className="h-4 w-4" />,
                      true,
                      "E.g., Rainy, 10:30 AM",
                      "Based on client's location",
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Topics Section */}
            <div
              className={cn(
                "bg-gray-50 dark:bg-[#1a1a1a] border-l-4 rounded-lg overflow-hidden transition-all duration-300",
                activeSection === "topics"
                  ? "border-l-gray-500 dark:border-l-white"
                  : "border-l-transparent hover:border-l-gray-500/30 dark:hover:border-l-white/30",
              )}
            >
              <div className="flex items-center p-4 cursor-pointer" onClick={() => toggleSection("topics")}>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white to-gray-500 flex items-center justify-center mr-3 shadow-lg">
                  <FileText className="h-5 w-5 text-[#121212]" />
                </div>
                <h2 className="text-lg font-semibold flex-1">
                  Topics to Discuss
                  <span
                    className={cn(
                      "ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs",
                      isSectionComplete("topics") ? "bg-white/20 text-white" : "bg-gray-800 text-gray-400",
                    )}
                  >
                    {isSectionComplete("topics") ? <CheckCircle className="h-3 w-3" /> : "!"}
                  </span>
                </h2>
                <button className="h-8 w-8 rounded-full flex items-center justify-center bg-gray-200 dark:bg-[#252525] text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-[#333] hover:text-black dark:hover:text-white transition-colors">
                  {expandedSections.topics ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>

              {expandedSections.topics && (
                <div className="p-5 border-t border-gray-200 dark:border-[#333] animate-in fade-in-50 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderFormField(
                      "beforeCall",
                      "What are you doing before Video Call?",
                      <Clock className="h-4 w-4" />,
                      true,
                      "E.g., Preparing lunch",
                      "",
                      "Activities you were doing just before the video call",
                    )}
                    {renderFormField(
                      "afterCall",
                      "What will you do after the Call?",
                      <Clock className="h-4 w-4" />,
                      true,
                      "E.g., Going to the mall",
                      "",
                      "What you plan to do after finishing the video call",
                    )}
                    {renderFormField(
                      "kidLocation",
                      "Where is your child right now, and what is she doing?",
                      <BabyIcon className="h-4 w-4" />,
                      true,
                      "E.g., At school",
                      "Asan ung Anak mo at ano ung Ginagawa nya?",
                    )}
                    <div className="space-y-2 md:col-span-2">
                      <label htmlFor="remarks" className="text-sm font-medium">
                        Additional Topics
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-3 text-muted-foreground">
                          <Edit className="h-4 w-4" />
                        </div>
                        <Textarea
                          id="remarks"
                          name="remarks"
                          value={formData.remarks}
                          onChange={handleInputChange}
                          className="pl-10 min-h-[100px] border-gray-300 dark:border-white/20 focus:border-gray-500 dark:focus:border-white focus:ring-1 focus:ring-gray-500/20 dark:focus:ring-white/20"
                          placeholder="Specific topics you'd like to discuss with your client..."
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Ilagay nyo dito ung gusto nyo I highlight sa Tawag.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-[#333333]">
            <Button
              variant="outline"
              onClick={handleReset}
              className="border-[#FE2C55] text-[#FE2C55] hover:bg-[#FE2C55]/10 dark:border-[#FE2C55] dark:text-[#FE2C55] dark:hover:bg-[#FE2C55]/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Reset Form
            </Button>
            <Button
              onClick={handleGeneratePdf}
              disabled={!isFormValid()}
              className="bg-gradient-to-r from-[#FE2C55] to-[#25F4EE] hover:opacity-90 text-white font-medium transition-all duration-200"
            >
              <FileText className="mr-2 h-4 w-4" /> Generate PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl bg-white dark:bg-[#121212] border-gray-200 dark:border-[#333333]">
          <DialogHeader className="bg-gray-50 dark:bg-[#000000] -mx-6 -mt-6 px-6 py-4 rounded-t-lg border-b border-gray-200 dark:border-[#333333]">
            <DialogTitle className="flex items-center text-[#25F4EE]">
              <FileText className="mr-2 h-5 w-5" /> Palitan ung Filename ng Name ng Client NYO! example Jose
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-300">
              Preview your generated PDF. Rename the file with the client's name when downloading.
            </DialogDescription>
          </DialogHeader>

          <div className="relative min-h-[60vh] bg-gray-50 dark:bg-[#000000] rounded-md overflow-hidden border-2 border-dashed border-gray-300 dark:border-[#333333]">
            {isLoading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/80 dark:bg-[#000000]/80 backdrop-blur-sm">
                <div className="h-12 w-12 rounded-full border-4 border-[#25F4EE] border-t-transparent animate-spin mb-4"></div>
                <p className="text-sm font-medium text-[#25F4EE]">Generating your document...</p>
              </div>
            ) : pdfUrl ? (
              <iframe ref={pdfRef} src={pdfUrl} className="w-full h-[60vh]" title="PDF Preview" frameBorder="0" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-muted-foreground">PDF preview will appear here</p>
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-between sm:justify-between bg-gray-50 dark:bg-[#000000] -mx-6 -mb-6 px-6 py-4 rounded-b-lg border-t border-gray-200 dark:border-[#333333]">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="border-[#25F4EE] text-[#25F4EE] hover:bg-[#25F4EE]/10 dark:border-[#25F4EE] dark:text-[#25F4EE] dark:hover:bg-[#25F4EE]/10"
            >
              <Edit className="mr-2 h-4 w-4" /> Edit Information
            </Button>
            <Button
              onClick={handleDownloadPdf}
              disabled={!pdfUrl || isLoading}
              className="bg-[#FE2C55] hover:bg-[#FE2C55]/80 text-white font-medium transition-all duration-200"
            >
              <Download className="mr-2 h-4 w-4" /> Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confetti container */}
      <div ref={confettiContainerRef} className="fixed top-0 left-0 w-full h-full pointer-events-none z-50"></div>

      <style jsx global>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-100px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
