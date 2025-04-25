"use client"

import { useState } from "react"

export default function AddedClientsLayout({ children }) {
  const [activeTab, setActiveTab] = useState("addedclients")

  return <>{children}</>
}
