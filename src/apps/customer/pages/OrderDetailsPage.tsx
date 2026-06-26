import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import axios from "axios"
import { motion } from "framer-motion"
import { Loader2, ArrowLeft, Package, MapPin, CreditCard } from "lucide-react"
import { toast } from "sonner"
import type { Order } from "@/types/index.ts"

export default function OrderDetailsPage() {
  const { id } = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await axios.get(`/api/orders/getOrderDetails/${id}`)
        // console.log("API Response Data:", response.data.data.deliveryAddress) // Debugging log
        setOrder(response.data.data)
      } catch (error) {
        toast.error("Failed to load order details.")
      } finally {
        setIsLoading(false)
      }
    }
    fetchOrder()
  }, [id])

  if (isLoading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-900" />
      </div>
    )
  }

  if (!order) return <div className="py-20 text-center">Order not found.</div>
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-2xl px-6 py-12"
    >
      <Link
        to="/customer/order-history"
        className="mb-8 flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-zinc-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back to History
      </Link>

      <div className="space-y-8">
        {/* Header Section */}
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Order Details</h1>
          <p className="text-zinc-500">#{(order as any).orderId}</p>
        </div>

        {/* Order Items */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-sm font-bold tracking-wider text-zinc-400 uppercase">
            Items
          </h2>
          <div className="space-y-4">
            {order.items.map((item: any) => (
              <div
                key={item.itemId}
                className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-200">
                    <Package className="h-8 w-8 text-zinc-500" />
                  </div>

                  <div className="flex flex-1 flex-col items-center sm:items-start">
                    <h3 className="text-center text-base font-semibold text-zinc-900 sm:text-left">
                      {item.name}
                    </h3>

                    <span className="mt-1 text-sm text-zinc-500">
                      Qty × {item.quantity}
                    </span>

                    <span className="mt-2 text-lg font-bold text-emerald-600">
                      {(item.priceAtPurchase ?? 0).toLocaleString()} MMK
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-between border-t border-zinc-100 pt-6 text-lg font-bold">
            <span>Total</span>
            <span>{order.totalAmount.toLocaleString()} MMK</span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-6">
            <div className="mb-2 flex items-center gap-2 text-zinc-400">
              <MapPin className="h-4 w-4" />{" "}
              <span className="text-xs font-bold uppercase">Delivery</span>
            </div>
            <p className="text-sm text-zinc-700">{order.deliveryAddress}</p>
          </div>
          <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-6">
            <div className="mb-2 flex items-center gap-2 text-zinc-400">
              <CreditCard className="h-4 w-4" />{" "}
              <span className="text-xs font-bold uppercase">Status</span>
            </div>
            <p className="text-sm font-semibold text-zinc-900">
              {order.status}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
