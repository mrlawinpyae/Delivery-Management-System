import { useState, useEffect } from "react"
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  ShoppingBag,
  Users,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  LayoutDashboard,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuthStore } from "@/store/useAuthStore"
import axios from "@/lib/axios"
import { toast } from "sonner"

// ─── Types ───────────────────────────────────────────────────────────────────
interface AdminProfile {
  userId: string
  name: string
  image: string
  phone: string
  email: string
  role: string
}

// ─── Nav config ──────────────────────────────────────────────────────────────
const NAV = [
  { path: "/admin", label: "Orders", icon: ShoppingBag, exact: true },
  { path: "/admin/riders", label: "Riders", icon: Users, exact: false },
]

// ─── Sidebar inner content ────────────────────────────────────────────────────
function SidebarContent({
  profile,
  onLogout,
  onNavClick,
}: {
  profile: AdminProfile | null
  onLogout: () => void
  onNavClick?: () => void
}) {
  const location = useLocation()

  const isActive = (path: string, exact: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path)

  const initials = profile?.name
    ? profile.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AD"

  return (
    <div className="flex h-full flex-col bg-white">
      {/* ── Brand Logo Header ── */}
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25">
          <LayoutDashboard size={18} />
        </div>
        <div>
          <p className="text-sm font-bold tracking-tight text-slate-900">
            Admin Portal
          </p>
          <p className="text-[10px] font-bold text-indigo-600 tracking-widest uppercase">
            delivx enterprise
          </p>
        </div>
      </div>

      <Separator className="bg-slate-200/80" />

      {/* ── Admin Profile Badge ── */}
      <div className="px-4 py-4">
        {profile ? (
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-3 shadow-2xs">
            <Avatar className="h-9 w-9 shrink-0 ring-2 ring-indigo-100">
              <AvatarImage src={profile.image} alt={profile.name} />
              <AvatarFallback className="bg-indigo-100 text-xs font-bold text-indigo-700">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-slate-900">
                {profile.name}
              </p>
              <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200">
                {profile.role}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3.5 py-3 border border-slate-200">
            <div className="h-9 w-9 animate-pulse rounded-full bg-slate-200" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-20 animate-pulse rounded-full bg-slate-200" />
              <div className="h-2 w-14 animate-pulse rounded-full bg-slate-100" />
            </div>
          </div>
        )}
      </div>

      {/* ── Navigation List ── */}
      <nav className="flex-1 space-y-1 px-3 pb-2">
        <p className="mb-2.5 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Management
        </p>
        {NAV.map((item) => {
          const Icon = item.icon
          const active = isActive(item.path, item.exact)
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavClick}
              className={`group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-200 ${
                active
                  ? "bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600 font-bold shadow-2xs"
                  : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
              }`}
            >
              <Icon
                size={16}
                className={active ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"}
                strokeWidth={active ? 2.5 : 2}
              />
              <span>{item.label}</span>
              <ChevronRight
                size={14}
                className={`ml-auto transition-opacity ${active ? "text-indigo-500 opacity-100" : "opacity-0 group-hover:opacity-40"}`}
              />
            </Link>
          )
        })}
      </nav>

      <Separator className="bg-slate-200/80" />

      {/* ── Logout Button ── */}
      <div className="px-3 py-3">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-600 transition-all hover:bg-rose-50 hover:text-rose-600 hover:border hover:border-rose-200"
        >
          <LogOut size={16} />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  )
}

// ─── Root Layout ─────────────────────────────────────────────────────────────
export default function MerchantLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [desktopOpen, setDesktopOpen] = useState(() => {
    const saved = localStorage.getItem("merchantDesktopOpen")
    return saved !== null ? JSON.parse(saved) : true
  })

  useEffect(() => {
    localStorage.setItem("merchantDesktopOpen", JSON.stringify(desktopOpen))
  }, [desktopOpen])

  // Close drawer on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  // Fetch admin profile
  useEffect(() => {
    if (!user?.userId) return
    let active = true
    axios
      .get(`/auth/user/${user.userId}`)
      .then((res) => {
        if (active && res.data?.data) setProfile(res.data.data)
      })
      .catch(() => toast.error("Could not load admin profile"))
    return () => {
      active = false
    }
  }, [user?.userId])

  const handleLogout = () => {
    logout()
    navigate("/customer/login")
  }

  const pageTitle =
    NAV.find((n) =>
      n.exact
        ? location.pathname === n.path
        : location.pathname.startsWith(n.path)
    )?.label ?? "Dashboard"

  return (
    // Solid opaque #f1f5f9 canvas background to ensure bright, high-contrast UI
    <div className="flex min-h-screen flex-col bg-[#f1f5f9] text-slate-900 md:flex-row font-sans">
      {/* ══ DESKTOP SIDEBAR ══ */}
      <aside
        className={`hidden relative z-40 shrink-0 transition-[width] duration-300 ease-in-out md:block ${
          desktopOpen ? "w-60" : "w-0"
        }`}
      >
        <div
          className={`absolute inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-slate-200 bg-white transition-transform duration-300 ease-in-out ${
            desktopOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <SidebarContent profile={profile} onLogout={handleLogout} />
        </div>

        <button
          onClick={() => setDesktopOpen((prev) => !prev)}
          className={`absolute top-6 z-40 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-all duration-300 ease-in-out hover:bg-slate-50 hover:text-slate-700 ${
            desktopOpen ? "left-60 -translate-x-1/2" : "left-5 translate-x-0"
          }`}
          aria-label={desktopOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {desktopOpen ? <ChevronLeft size={16} /> : <Menu size={14} />}
        </button>
      </aside>

      {/* ══ MOBILE TOP BAR ══ */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-2xs">
            <LayoutDashboard size={14} />
          </div>
          <span className="text-sm font-bold text-slate-900">
            Admin Portal
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500">{pageTitle}</span>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setMobileOpen(true)}
            className="border-slate-300 text-slate-700 hover:bg-slate-100"
          >
            <Menu size={16} />
          </Button>
        </div>
      </header>

      {/* ══ MOBILE DRAWER ══ */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs md:hidden"
            />
            <motion.div
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-200 bg-white md:hidden shadow-2xl"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={16} />
              </button>
              <SidebarContent
                profile={profile}
                onLogout={handleLogout}
                onNavClick={() => setMobileOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══ MAIN CONTENT ══ */}
      <main
        className={`flex-1 overflow-y-auto p-5 bg-[#f1f5f9] transition-all duration-300 ease-in-out ${
          desktopOpen ? "md:p-8" : "md:p-8 md:pl-16"
        }`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
