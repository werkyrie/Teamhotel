"use client"
import VideoCallTemplate from "@/components/videocall/video-call-template"

export default function VideoCallPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Video Call Template</h1>
        <p className="text-muted-foreground mt-2">Generate information sheets for your video calls with clients</p>
      </div>

      <VideoCallTemplate />
    </div>
  )
}
