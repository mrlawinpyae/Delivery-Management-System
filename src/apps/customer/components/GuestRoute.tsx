import { Navigate, Outlet } from "react-router-dom"
import { useAuthStore } from "@/store/useAuthStore"
import { roleHomePath } from "@/components/RoleGuard"
import type { UserRole } from "@/types"

export default function GuestRoute() {
  const { isAuthenticated, user } = useAuthStore()

  if (isAuthenticated) {
    // Redirect to the portal that matches the user's role
    const home = user
      ? roleHomePath[user.role as UserRole] ?? "/customer"
      : "/customer"
    return <Navigate to={home} replace />
  }

  return <Outlet />
}
