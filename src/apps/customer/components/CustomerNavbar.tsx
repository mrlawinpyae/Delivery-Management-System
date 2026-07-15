import { Link, useLocation, useNavigate } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import {
  ShoppingBag,
  User,
  Compass,
  ChevronDown,
  Search,
  Clock,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useCartStore } from "../../../store/useCartStore"
import { useEffect, useRef } from "react"
import { useSearch } from "@/context/SearchContext"
import { useAuthStore } from "@/store/useAuthStore"

export const useNavItems = () => {
  const cartItems = useCartStore((state) => state.items)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  const totalItems = Object.values(cartItems).reduce(
    (sum, item) => sum + item.quantity,
    0
  )

  return [
    { path: "/customer", label: "Discover", icon: Compass },
    {
      path: "/customer/checkout",
      label: "Cart",
      icon: ShoppingBag,
      badge: totalItems > 0 ? totalItems : undefined,
    },
    {
      path: isAuthenticated ? "/customer/order-history" : "/customer/login",
      label: "Order",
      icon: Clock,
    },
  ]
}

export default function CustomerNavbar({ scaleX }: { scaleX: any }) {
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
    <header className="sticky top-0 z-40 hidden w-full border-b border-zinc-100 bg-white/70 px-4 backdrop-blur-xl transition-all md:block md:px-8">
      <div className="relative container mx-auto flex h-20 items-center justify-between">
        {/* Search Modal */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-24 right-0 left-0 z-50 flex justify-center px-4"
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
        <Link to="/customer" className="group flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 font-serif text-base font-bold tracking-tighter text-white transition-transform group-hover:rotate-6">
            D
          </div>

          <span className="font-serif text-lg font-semibold tracking-tight text-zinc-900">
            deliv
            <span className="font-sans font-light text-zinc-400">x</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 rounded-full border border-zinc-200/40 bg-zinc-100/60 p-1.5 md:flex">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex items-center gap-2 rounded-full px-5 py-2 text-xs font-medium tracking-wide transition-all ${isActive ? "font-semibold text-zinc-900" : "text-zinc-500 hover:text-zinc-900"}`}
              >
                <Icon size={15} strokeWidth={isActive ? 2.5 : 2} />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-900 text-[9px] font-bold text-white">
                    {item.badge}
                  </span>
                )}

                {isActive && (
                  <motion.div
                    layoutId="luxuryActivePill"
                    className="absolute inset-0 -z-10 rounded-full border border-zinc-200/50 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                  />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {/* Fixed Search Button */}
          <button
            onClick={toggleSearch}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200/60 bg-white text-zinc-600 transition-all hover:cursor-pointer hover:bg-zinc-50 hover:text-zinc-900"
          >
            <Search size={16} />
          </button>

          {/* ─── CONDITIONAL RENDERING ─── */}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-full border border-zinc-100 bg-zinc-50 p-1 pr-2 transition-all outline-none hover:cursor-pointer hover:bg-zinc-100">
                <Avatar className="h-7 w-7">
                  <AvatarImage
                    src={user?.image || "https://github.com/shadcn.png"}
                  />
                  <AvatarFallback>
                    {user?.name ? user.name.slice(0, 2).toUpperCase() : "US"}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown
                  size={14}
                  className="text-zinc-400 transition-transform duration-200"
                />
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="mt-2 w-48 rounded-2xl p-1.5 shadow-lg"
              >
                <DropdownMenuLabel className="text-xs text-zinc-400">
                  My Premium Account
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link to="/customer/profile">
                  <DropdownMenuItem className="cursor-pointer rounded-xl py-2 text-xs">
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
            <Link to="/customer/login">
              <button className="rounded-full bg-zinc-900 px-5 py-2 text-xs font-bold text-white transition-all hover:cursor-pointer hover:bg-zinc-800 hover:shadow-md active:scale-95">
                Sign In
              </button>
            </Link>
          )}
        </div>
      </div>

      <motion.div
        className="absolute right-0 bottom-0 left-0 h-[1.5px] origin-[0%] bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500"
        style={{ scaleX }}
      />
    </header>
  )
}
