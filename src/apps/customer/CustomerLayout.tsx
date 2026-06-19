// src/apps/customer/CustomerLayout.tsx
import { Outlet, Link, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Home, ShoppingBag, User, Compass, ChevronDown } from "lucide-react"

// Shadcn UI Components
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function CustomerLayout() {
  const location = useLocation()

  // ရှင်းလင်းထားသော Core Navigation Items
  const navItems = [
    { path: "/customer", label: "Discover", icon: Compass },
    { path: "/customer/checkout", label: "Cart", icon: ShoppingBag, badge: 2 },
    { path: "/customer/login", label: "Account", icon: User },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-[#F9F9FB] font-sans text-zinc-900 antialiased">
      {/* ─── LUXURY FLOATING TOP NAVBAR ─── */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-100 bg-white/70 px-4 backdrop-blur-xl transition-all md:px-8">
        <div className="container mx-auto flex h-20 items-center justify-between">
          {/* Elite Elegant Logo */}
          <Link to="/customer" className="group flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 font-serif text-base font-bold tracking-tighter text-white transition-transform group-hover:rotate-6">
              D
            </div>
            <span className="font-serif text-lg font-semibold tracking-tight text-zinc-900">
              deliv<span className="font-sans font-light text-zinc-400">x</span>
            </span>
          </Link>

          {/* Center Nav Items (Desktop UX) */}
          <nav className="hidden items-center gap-1 rounded-full border border-zinc-200/40 bg-zinc-100/60 p-1.5 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative flex items-center gap-2 rounded-full px-5 py-2 text-xs font-medium tracking-wide transition-all ${
                    isActive
                      ? "font-semibold text-zinc-900"
                      : "text-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  <Icon size={15} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{item.label}</span>

                  {item.badge && (
                    <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-900 text-[9px] font-bold text-white">
                      {item.badge}
                    </span>
                  )}

                  {/* Elegant Capsule Background Pill */}
                  {isActive && (
                    <motion.div
                      layoutId="luxuryActivePill"
                      className="absolute inset-0 -z-10 rounded-full border border-zinc-200/50 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                      transition={{
                        type: "spring",
                        stiffness: 350,
                        damping: 28,
                      }}
                    />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Right Profile Utilities (Desktop) */}
          <div className="hidden items-center gap-4 md:flex">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-full border border-zinc-200/60 bg-white p-1.5 pr-3 shadow-sm transition-all hover:bg-zinc-50 focus:outline-none">
                <Avatar className="h-7 w-7 border border-zinc-100">
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback>TR</AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium text-zinc-700">Thiri</span>
                <ChevronDown size={14} className="text-zinc-400" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="mt-2 w-48 rounded-2xl border-zinc-100 p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.04)]"
              >
                <DropdownMenuLabel className="text-xs text-zinc-400">
                  My Premium Account
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer rounded-xl py-2 text-xs">
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer rounded-xl py-2 text-xs text-red-600">
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Profile Avatar Trigger */}
          <div className="flex items-center gap-3 md:hidden">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-zinc-900 text-xs text-white">
                TR
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* ─── MAIN CONTENT AREA ─── */}
      <main className="mx-auto w-full max-w-7xl flex-1 p-4 pb-24 md:p-8 md:pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ─── MOBILE BOTTOM BAR ─── */}
      <div className="fixed right-4 bottom-4 left-4 z-50 md:hidden">
        <div className="flex items-center justify-around rounded-3xl border border-zinc-200/60 bg-white/90 p-2 shadow-[0_8px_32px_rgba(0,0,0,0.05)] backdrop-blur-xl">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative flex flex-col items-center gap-1 rounded-2xl px-4 py-2.5 transition-all"
              >
                <Icon
                  size={18}
                  className={`transition-colors duration-200 ${
                    isActive ? "text-zinc-900" : "text-zinc-400"
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />

                {item.badge && (
                  <span className="absolute top-1.5 right-3 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-zinc-950 px-1 text-[8px] font-bold text-white">
                    {item.badge}
                  </span>
                )}

                {/* Mobile Under-dot indicator */}
                {isActive && (
                  <motion.div
                    layoutId="luxuryMobileDot"
                    className="absolute bottom-1 h-1 w-1 rounded-full bg-zinc-900"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
