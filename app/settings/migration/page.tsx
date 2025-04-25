import type { Metadata } from "next"
import MigrateToFirebase from "@/components/migration/migrate-to-firebase"
import ProtectedRoute from "@/components/protected-route"

export const metadata: Metadata = {
  title: "Data Migration | Client Management System",
  description: "Migrate your data to Firebase",
}

export default function MigrationPage() {
  return (
    <ProtectedRoute adminOnly>
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold mb-6">Data Migration</h1>
        <MigrateToFirebase />
      </div>
    </ProtectedRoute>
  )
}
