import ReportsPage from "@/components/reports/reports-page"
import ProtectedRoute from "@/components/protected-route"

export default function Reports() {
  return (
    <ProtectedRoute allowedRoles={["admin", "viewer"]}>
      <ReportsPage />
    </ProtectedRoute>
  )
}
