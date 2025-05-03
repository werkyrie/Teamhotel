"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import TeamHeroDashboard from "@/components/team-performance/team-hero-dashboard"
import AgentTable from "@/components/team-performance/agent-table"
import PenaltiesTab from "@/components/team-performance/penalties-tab"
import RewardsTab from "@/components/team-performance/rewards-tab"
import AttendanceTab from "@/components/team-performance/attendance-tab"
import AgentWorkloadPreview from "@/components/team-performance/agent-workload-preview"
import { Users, AlertTriangle, Award, Calendar, BarChart } from "lucide-react"

// Add this CSS for the animations
const shimmerAnimation = {
  "@keyframes shimmer": {
    "0%": { transform: "translateX(-100%)" },
    "100%": { transform: "translateX(100%)" },
  },
  animation: "shimmer 2s infinite",
}

const pulseSlow = {
  "@keyframes pulseSlow": {
    "0%, 100%": { opacity: 1 },
    "50%": { opacity: 0.8 },
  },
  animation: "pulseSlow 3s ease-in-out infinite",
}

export default function TeamPerformancePage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [showWorkloadPreview, setShowWorkloadPreview] = useState(false)
  const { isViewer } = useAuth()

  return (
    <div className="space-y-8">
      {/* Enhanced header with more prominence */}
      <div className="border-b pb-4">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent dark:from-slate-100 dark:to-slate-300">
          Team Performance
        </h2>
        <p className="text-muted-foreground mt-1">
          Monitor team metrics, track agent performance, and manage your team effectively
        </p>
      </div>

      {/* Metrics dashboard with enhanced visual separation */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-800 rounded-xl opacity-50"></div>
        <div className="relative p-4 rounded-xl">
          <TeamHeroDashboard />
        </div>
      </div>

      {/* Enhanced card with improved visual hierarchy */}
      <Card className="shadow-md border-t-4 border-t-primary animate-fade-in overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-100 to-white dark:from-slate-900 dark:to-slate-800 rounded-t-lg">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Agent Performance Management
              </CardTitle>
              <CardDescription>Track and manage agent performance metrics across multiple dimensions</CardDescription>
            </div>
            <Button
              variant="outline"
              className="flex items-center gap-2 border-primary/50 bg-primary/5 text-primary hover:bg-primary/10 relative overflow-hidden shadow-[0_0_10px_rgba(59,130,246,0.5)] dark:shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-pulse-slow dark:border-primary/70 dark:text-white dark:bg-primary/20 dark:hover:bg-primary/30 transition-all duration-300 hover:scale-105"
              onClick={() => setShowWorkloadPreview(true)}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/30 to-primary/0 animate-shimmer"></span>
              <BarChart className="h-4 w-4" />
              Added Preview
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 p-3 bg-muted/20 rounded-none gap-2 mb-0 border-b">
              <TabsTrigger
                value="overview"
                className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all duration-200 flex items-center justify-center gap-2 hover:bg-muted/50 py-2"
              >
                <Users className="h-4 w-4" />
                Agent Overview
              </TabsTrigger>
              <TabsTrigger
                value="penalties"
                className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all duration-200 flex items-center justify-center gap-2 hover:bg-muted/50 py-2"
              >
                <AlertTriangle className="h-4 w-4" />
                Penalties
              </TabsTrigger>
              <TabsTrigger
                value="rewards"
                className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all duration-200 flex items-center justify-center gap-2 hover:bg-muted/50 py-2"
              >
                <Award className="h-4 w-4" />
                Rewards
              </TabsTrigger>
              <TabsTrigger
                value="attendance"
                className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all duration-200 flex items-center justify-center gap-2 hover:bg-muted/50 py-2"
              >
                <Calendar className="h-4 w-4" />
                Attendance
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="p-4 animate-in fade-in duration-300">
              <AgentTable />
            </TabsContent>

            <TabsContent value="penalties" className="p-4 animate-in fade-in duration-300">
              <PenaltiesTab />
            </TabsContent>

            <TabsContent value="rewards" className="p-4 animate-in fade-in duration-300">
              <RewardsTab />
            </TabsContent>

            <TabsContent value="attendance" className="p-4 animate-in fade-in duration-300">
              <AttendanceTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Agent Workload Preview Modal */}
      <AgentWorkloadPreview open={showWorkloadPreview} onOpenChange={setShowWorkloadPreview} />
    </div>
  )
}
