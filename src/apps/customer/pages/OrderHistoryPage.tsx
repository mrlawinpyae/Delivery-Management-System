import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import { motion } from "framer-motion"
import { Loader2, CheckCircle2, Clock, Package, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import type { Order } from "@/types/index.ts"

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  }
  const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-zinc-100 text-zinc-700"
      case "PREPARING":
        return "bg-blue-50 text-blue-700"
      case "OUT_FOR_DELIVERY":
        return "bg-amber-50 text-amber-700"
      case "DELIVERED":
        return "bg-emerald-50 text-emerald-700"
      default:
        return "bg-zinc-50 text-zinc-600"
    }
  }

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get("/api/orders/getUserOrders/:userId")
        setOrders(response.data.data)
      } catch (error) {
        toast.error("Failed to load history.")
      } finally {
        setIsLoading(false)
      }
    }
    fetchOrders()
  }, [])

  if (isLoading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-900" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-10 text-2xl font-bold text-zinc-900">Order History</h1>

      {orders.length === 0 ? (
        <div className="py-20 text-center text-zinc-400">
          <Package className="mx-auto mb-4 h-12 w-12 text-zinc-200" />
          <p>No orders found.</p>
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {orders.map((order) => (
            <motion.div
              key={order.orderId}
              variants={item}
              className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:border-zinc-300"
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-zinc-900">
                      Order #{order.orderId?.slice(-5)}
                    </h3>
                    <p className="mt-1 text-xs text-zinc-500">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"}
                    </p>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase ${getStatusStyles(order.status)}`}
                  >
                    {order.status === "DELIVERED" ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <Clock className="h-3 w-3" />
                    )}
                    {order.status}
                  </div>
                </div>

                <p className="line-clamp-1 text-sm text-zinc-600">
                  {order.deliveryAddress}
                </p>

                <div className="flex items-center justify-between border-t border-zinc-100 pt-3">
                  <span className="font-bold text-zinc-900">
                    {order.totalAmount.toLocaleString()} MMK
                  </span>
                  <Link
                    to={`/customer/order/${order.orderId}`}
                    className="flex items-center gap-1 text-xs font-bold text-zinc-500 transition-colors hover:text-zinc-900"
                  >
                    View Details <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
