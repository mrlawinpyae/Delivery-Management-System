import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuthStore } from "@/store/useAuthStore"
import type { UserRole } from "@/types"

/** Maps each role to its portal root. */
export const roleHomePath: Record<UserRole, string> = {
  CUSTOMER: "/customer",
  ADMIN: "/admin",
  RIDER: "/rider",
}

// ─────────────────────────────────────────────────────────────────────────────
// RoleGuard — requires authentication + one of the listed roles
// ─────────────────────────────────────────────────────────────────────────────

interface RoleGuardProps {
  /** One or more roles that are allowed to access the wrapped routes. */
  allowedRoles: UserRole[]
  /**
   * Where to redirect unauthenticated users.
   * @default "/customer/login"
   */
  loginPath?: string
}

/**
 * A layout-route component that enforces both authentication and role-based
 * access control.
 *
 * - **Not logged in** → redirects to `loginPath` (preserving the intended
 *   destination via `location.state.from`).
 * - **Logged in but wrong role** → redirects to that role's home path.
 * - **Logged in with an allowed role** → renders `<Outlet />`.
 */
export default function RoleGuard({
  allowedRoles,
  loginPath = "/customer/login",
}: RoleGuardProps) {
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()

  // ── Not authenticated ─────────────────────────────────────────────────────
  if (!isAuthenticated || !user) {
    return <Navigate to={loginPath} state={{ from: location }} replace />
  }

  // ── Authenticated but role is not permitted ───────────────────────────────
  const userRole = user.role as UserRole
  if (!allowedRoles.includes(userRole)) {
    return <Navigate to={roleHomePath[userRole] ?? "/customer"} replace />
  }

  // ── Authorised ────────────────────────────────────────────────────────────
  return <Outlet />
}

// ─────────────────────────────────────────────────────────────────────────────
// RoleRedirect — allows guests, but redirects wrong-role authenticated users
// ─────────────────────────────────────────────────────────────────────────────

interface RoleRedirectProps {
  /** Roles allowed to access the wrapped routes. Unauthenticated users always pass through. */
  allowedRoles: UserRole[]
}

/**
 * Like `RoleGuard`, but **guests (unauthenticated users) are allowed through**.
 *
 * Use this for sections that should be publicly accessible (e.g. browsing
 * restaurants) while still preventing a logged-in rider/admin from wandering
 * into the wrong portal.
 */
export function RoleRedirect({ allowedRoles }: RoleRedirectProps) {
  const { isAuthenticated, user } = useAuthStore()

  if (isAuthenticated && user) {
    const userRole = user.role as UserRole
    if (!allowedRoles.includes(userRole)) {
      return <Navigate to={roleHomePath[userRole] ?? "/customer"} replace />
    }
  }

  return <Outlet />
}
