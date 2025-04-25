import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { ClientProvider } from "@/context/client-context"
import { NotificationProvider } from "@/context/notification-context"
import { AuthProvider } from "@/context/auth-context"
import { TeamProvider } from "@/context/team-context"
import FloatingActionButton from "@/components/floating-action-button"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Client Management System",
  description: "A comprehensive client management system",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <ClientProvider>
              <TeamProvider>
                <NotificationProvider>
                  {children}
                  <FloatingActionButton />
                  <Toaster />
                </NotificationProvider>
              </TeamProvider>
            </ClientProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
