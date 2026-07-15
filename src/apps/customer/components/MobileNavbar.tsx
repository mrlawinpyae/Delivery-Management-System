import { useEffect, useRef } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { useNavItems } from "./CustomerNavbar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChevronDown, Search, UserPlus } from "lucide-react"
import { useSearch } from "@/context/SearchContext"
import { useAuthStore } from "@/store/useAuthStore"

export default function MobileNavbar({ scaleX }: { scaleX?: any }) {
  const location = useLocation()
  const navItems = useNavItems()
  const { isSearchOpen, toggleSearch, searchTerm, setSearchTerm } = useSearch()
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        if (isSearchOpen) toggleSearch()
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isSearchOpen, toggleSearch])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      toggleSearch()
    }
  }
  const navigate = useNavigate()

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const logout = useAuthStore((state) => state.logout)
  const user = useAuthStore((state) => state.user)

  const handleLogout = () => {
    logout()
    navigate("/customer/login", { replace: true })
  }
  return (
    <>
      {/* 1. Top Header: Logo + Profile */}
      <header className="fixed top-0 right-0 left-0 z-50 flex h-16 items-center justify-between border-b border-zinc-100 bg-white/80 px-6 backdrop-blur-md md:hidden">
        <Link to="/customer" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 font-serif font-bold text-white">
            D
          </div>
          <span className="font-serif text-lg font-semibold">
            deliv<span className="font-light text-zinc-400">x</span>
          </span>
        </Link>

        {/* Right Section: Search & Profile */}
        <div className="flex items-center gap-3">
          {/* Mobile Search Button */}
          <button
            onClick={toggleSearch}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-100 bg-zinc-50 text-zinc-600 transition-all hover:bg-zinc-100 active:scale-95"
          >
            <Search size={16} />
          </button>

          {/* Profile Dropdown / Sign Up Button */}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-full border border-zinc-100 bg-zinc-50 p-1 pr-2 transition-all outline-none hover:cursor-pointer hover:bg-zinc-100">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={user?.image || "https://github.com/shadcn.png"} />
                  <AvatarFallback>{user?.name ? user.name.slice(0, 2).toUpperCase() : "US"}</AvatarFallback>
                </Avatar>
                <ChevronDown size={12} className="text-zinc-400" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="mt-2 w-40 rounded-2xl p-2"
              >
                <DropdownMenuLabel className="text-[10px] text-zinc-400 uppercase">
                  Account
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link to="/customer/profile">
                  <DropdownMenuItem className="cursor-pointer py-2 text-xs">
                    Profile Settings
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer rounded-xl py-2 text-xs text-red-600 focus:bg-red-50 focus:text-red-700"
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              to="/customer/login?signup=true"
              className="rounded-full bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-zinc-800 active:scale-95"
            >
              <UserPlus size={16} />
            </Link>
          )}
        </div>

        {/* Search Modal */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-20 right-0 left-0 z-50 flex justify-center px-4"
            >
              <div
                ref={searchRef}
                className="w-full max-w-lg rounded-2xl border border-zinc-100 bg-white p-2 shadow-2xl"
              >
                <input
                  autoFocus
                  className="w-full p-3 text-sm outline-none"
                  placeholder="Search restaurants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Custom scroll bar progress bar */}
        {scaleX && (
          <motion.div
            className="absolute right-0 bottom-0 left-0 h-[1.5px] origin-[0%] bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500"
            style={{ scaleX }}
          />
        )}
      </header>

      {/* 2. Bottom Navigation */}
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
                  className={`transition-colors duration-200 ${isActive ? "text-zinc-900" : "text-zinc-400"}`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute top-1.5 right-3 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-zinc-950 px-1 text-[8px] font-bold text-white">
                    {item.badge}
                  </span>
                )}
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
    </>
  )
}
