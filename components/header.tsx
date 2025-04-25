"use client"

import { ModeToggle } from "./mode-toggle"
import { Button } from "./ui/button"
import { useClientContext } from "@/context/client-context"
import NotificationCenter from "./notification/notification-center"
import { useRouter } from "next/navigation"
import { Home, Users, ShoppingBag, Wallet, ArrowDownCircle, Settings } from "lucide-react"

export default function Header() {
  const router = useRouter()
  const { resetAllData } = useClientContext()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="link" className="font-bold p-0" onClick={() => router.push("/")}>
            Client Management System
          </Button>

          <nav className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push("/?tab=clients")}>
              <Users className="h-4 w-4 mr-2" />
              Clients
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push("/?tab=orders")}>
              <ShoppingBag className="h-4 w-4 mr-2" />
              Orders
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push("/?tab=deposits")}>
              <Wallet className="h-4 w-4 mr-2" />
              Deposits
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push("/?tab=withdrawals")}>
              <ArrowDownCircle className="h-4 w-4 mr-2" />
              Withdrawals
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push("/?tab=settings")}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <NotificationCenter />
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
