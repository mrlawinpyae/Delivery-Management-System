import { useState, useEffect } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  MapPin,
  ShoppingBag,
  Compass,
} from "lucide-react"
import { toast } from "sonner"
import { useThemeStore } from "@/store/useThemeStore"

// Types matching API contract
interface Customer {
  _id: string
  name: string
  image: string
}

interface PickupLocation {
  _id: string
  name: string
  address: string
  coordinates: [number, number] // [lng, lat]
}

interface OrderItem {
  itemId: string
  name: string
  image: string
  quantity: number
  priceAtPurchase: number
}

interface Order {
  _id: string
  status: "PENDING" | "PREPARING" | "OUT_FOR_DELIVERY" | "DELIVERED"
  totalAmount: number
  deliveryLocation: {
    address: string
    latitude: number
    longitude: number
  }
  shipping_phone: string
  createdAt: string
  customer: Customer
  pickupLocations: PickupLocation[]
  items: OrderItem[]
}

export default function RiderTasks() {
  const theme = useThemeStore((s) => s.theme)
  const isDark = theme === "dark"

  const navigate = useNavigate()

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active")

  useEffect(() => {
    let active = true
    const loadAssignedOrders = async () => {
      try {
        const res = await axios.get("/api/orders/ord_1003/getAssignedOrders")
        if (!active) return
        if (res.data && res.data.data) {
          const fetchedOrders = res.data.data
          setOrders(fetchedOrders)
        }
      } catch (error) {
        console.error(error)
        toast.error("Failed to load assigned tasks")
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadAssignedOrders()
    return () => {
      active = false
    }
  }, [])

  // Filter orders by active/completed tabs
  const activeOrders = orders.filter((o) => o.status !== "DELIVERED")
  const completedOrders = orders.filter((o) => o.status === "DELIVERED")
  const displayedOrders = activeTab === "active" ? activeOrders : completedOrders

  const statusColors = {
    PENDING: isDark ? "text-amber-400 bg-amber-400/10 border-amber-400/20" : "text-amber-700 bg-amber-50 border-amber-200",
    PREPARING: isDark ? "text-sky-400 bg-sky-400/10 border-sky-400/20" : "text-sky-700 bg-sky-50 border-sky-200",
    OUT_FOR_DELIVERY: isDark ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" : "text-emerald-700 bg-emerald-50 border-emerald-200",
    DELIVERED: isDark ? "text-slate-400 bg-slate-400/10 border-slate-400/20" : "text-slate-600 bg-slate-50 border-slate-200",
  }

  return (
    <div className="space-y-6">
      {/* ─── Hero Overview Card ─── */}
      <div
        className={`relative overflow-hidden rounded-3xl border p-6 transition-all ${
          isDark
            ? "border-cyan-500/10 bg-slate-950/40 text-slate-100 shadow-2xl shadow-cyan-950/10"
            : "border-slate-200 bg-white text-slate-800 shadow-md"
        }`}
      >
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight md:text-2xl">
              Welcome back, Rider! 🛵
            </h2>
            <p className={`mt-1 text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Here are your assigned orders and deliveries for today.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-6">
            <div className={`rounded-2xl p-4 text-center ${isDark ? "bg-slate-900/60" : "bg-slate-50"}`}>
              <p className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? "text-cyan-400" : "text-sky-600"}`}>
                Active
              </p>
              <p className="mt-1 text-xl font-bold">{activeOrders.length}</p>
            </div>
            <div className={`rounded-2xl p-4 text-center ${isDark ? "bg-slate-900/60" : "bg-slate-50"}`}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500">
                Completed
              </p>
              <p className="mt-1 text-xl font-bold">{completedOrders.length}</p>
            </div>
          </div>
        </div>

        {/* Backdrop highlights */}
        {isDark && (
          <>
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />
            <div className="absolute -left-16 -bottom-16 h-40 w-40 rounded-full bg-violet-600/10 blur-3xl" />
          </>
        )}
      </div>

      {/* ─── Navigation Tabs ─── */}
      <div className="flex border-b border-slate-700/20">
        <button
          onClick={() => setActiveTab("active")}
          className={`relative px-6 py-3 text-sm font-semibold transition-all ${
            activeTab === "active"
              ? isDark
                ? "text-cyan-400"
                : "text-sky-600"
              : isDark
              ? "text-slate-400 hover:text-slate-200"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Active Tasks ({activeOrders.length})
          {activeTab === "active" && (
            <motion.div
              layoutId="riderActiveLine"
              className={`absolute bottom-0 inset-x-0 h-0.5 ${isDark ? "bg-cyan-400" : "bg-sky-600"}`}
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          className={`relative px-6 py-3 text-sm font-semibold transition-all ${
            activeTab === "completed"
              ? isDark
                ? "text-cyan-400"
                : "text-sky-600"
              : isDark
              ? "text-slate-400 hover:text-slate-200"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Completed Tasks ({completedOrders.length})
          {activeTab === "completed" && (
            <motion.div
              layoutId="riderActiveLine"
              className={`absolute bottom-0 inset-x-0 h-0.5 ${isDark ? "bg-cyan-400" : "bg-sky-600"}`}
            />
          )}
        </button>
      </div>

      {/* ─── Tasks List ─── */}
      <div>
        {loading ? (
          // Skeleton Loader
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className={`animate-pulse rounded-2xl border p-5 ${
                  isDark ? "border-slate-800 bg-slate-900/40" : "border-slate-200 bg-white"
                }`}
              >
                <div className="h-6 w-1/3 rounded bg-slate-700/30" />
                <div className="mt-4 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-slate-700/30" />
                  <div className="h-4 w-1/2 rounded bg-slate-700/30" />
                </div>
              </div>
            ))}
          </div>
        ) : displayedOrders.length === 0 ? (
          <div
            className={`flex flex-col items-center justify-center rounded-3xl border p-12 text-center ${
              isDark ? "border-slate-800/80 bg-slate-950/20" : "border-slate-200 bg-slate-50/50"
            }`}
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl mb-4 ${
                isDark ? "bg-slate-900 text-slate-500" : "bg-white text-slate-400 shadow-sm"
              }`}
            >
              <Compass className="h-6 w-6 animate-spin" />
            </div>
            <h3 className="font-semibold">No assigned orders</h3>
            <p className={`mt-1 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              {activeTab === "active"
                ? "Everything is delivered! Check back soon for new route coordinates."
                : "Complete your first delivery job to see it listed here."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            <AnimatePresence mode="popLayout">
              {displayedOrders.map((order) => {

                return (
                  <motion.div
                    key={order._id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => navigate(`/rider/${order._id}`)}
                    className={`relative flex flex-col cursor-pointer overflow-hidden rounded-2xl border p-5 transition-all duration-300 ${
                      isDark
                        ? "border-slate-800 bg-slate-900/30 hover:border-slate-700/60 hover:bg-slate-900/55"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                    }`}
                  >
                    {/* Order Title Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                          ID:
                        </span>
                        <span className="text-sm font-bold tracking-tight">
                          #{order._id.slice(-6).toUpperCase()}
                        </span>
                      </div>
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${statusColors[order.status]}`}>
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </div>

                    {/* Summary Path Details */}
                    <div className="mt-4 flex-1 grid grid-cols-1 gap-3 content-start">

                      {/* Delivery Location */}
                      <div className="flex gap-2">
                        <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-cyan-500/10 text-cyan-500`}>
                          <MapPin className="h-3 w-3" />
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                            Deliver To
                          </p>
                          <p className="text-xs font-bold leading-tight mt-0.5 line-clamp-1">
                            {order.deliveryLocation.address}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Cust: {order.customer.name}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Items Drawer / Snapshot */}
                    <div className="mt-4 border-t border-slate-700/10 pt-4">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-slate-400">
                          <ShoppingBag className="h-3.5 w-3.5" />
                          <span>{order.items.reduce((sum, item) => sum + item.quantity, 0)} Items</span>
                        </div>
                        <span className={`font-bold ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                          {order.totalAmount.toLocaleString()} Ks
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
