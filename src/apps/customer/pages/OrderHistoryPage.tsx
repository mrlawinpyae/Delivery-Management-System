import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card" // shadcn card
import { Badge } from "@/components/ui/badge" // shadcn badge
import { Package, Clock, ChevronRight, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    // API ကနေ Data ဆွဲထုတ်ခြင်း
    fetch("/api/orders/getUserOrders/usr_cust_001")
      .then((res) => res.json())
      .then((res) => {
        setOrders(res.data)
        setLoading(false)
      })
      .catch(() => {
        toast.error("Failed to load history")
        setLoading(false)
      })
  }, [])

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin" />
      </div>
    )

  return (
    <div className="mx-auto max-w-lg px-6 py-10">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 text-2xl font-bold"
      >
        Order History
      </motion.h1>

      <div className="space-y-4">
        <AnimatePresence>
          {orders.map((order, index) => (
            <motion.div
              key={order.orderId}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className="flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-zinc-50"
                onClick={() => navigate(`/order-details/${order.orderId}`)}
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-zinc-100 p-3">
                    <Package size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{order.restaurantName}</h3>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock size={12} />{" "}
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      order.status === "PREPARING" ? "secondary" : "default"
                    }
                  >
                    {order.status}
                  </Badge>
                  <ChevronRight size={18} className="text-muted-foreground" />
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
