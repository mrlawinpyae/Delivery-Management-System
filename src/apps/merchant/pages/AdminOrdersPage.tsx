import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ShoppingBag,
  RefreshCw,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
  TrendingUp,
} from "lucide-react"
import { Bar, BarChart, XAxis, YAxis, Pie, PieChart, Cell, Label } from "recharts"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import axios from "@/lib/axios"
import { toast } from "sonner"
import type { AdminOrder, OrderStatus } from "@/types"

// ─── Status Color Theory Config ──────────────────────────────────────────────
const STATUS_CONFIG: Record<
  OrderStatus,
  {
    label: string
    icon: React.ElementType
    badgeClass: string
  }
> = {
  PENDING: {
    label: "Pending",
    icon: Clock,
    badgeClass: "bg-amber-50 text-amber-800 border border-amber-300 font-extrabold",
  },
  PREPARING: {
    label: "Preparing",
    icon: AlertCircle,
    badgeClass: "bg-sky-50 text-sky-800 border border-sky-300 font-extrabold",
  },
  OUT_FOR_DELIVERY: {
    label: "Out for Delivery",
    icon: Truck,
    badgeClass: "bg-indigo-50 text-indigo-800 border border-indigo-300 font-extrabold",
  },
  DELIVERED: {
    label: "Delivered",
    icon: CheckCircle2,
    badgeClass: "bg-emerald-50 text-emerald-800 border border-emerald-300 font-extrabold",
  },
}

// ─── Chart configs ────────────────────────────────────────────────────────────
const barChartConfig = {
  count: {
    label: "Orders",
  },
  PENDING: {
    label: "Pending",
    color: "oklch(0.769 0.188 70.08)",
  },
  PREPARING: {
    label: "Preparing",
    color: "oklch(0.714 0.203 196.91)",
  },
  OUT_FOR_DELIVERY: {
    label: "In Transit",
    color: "oklch(0.585 0.233 277)",
  },
  DELIVERED: {
    label: "Delivered",
    color: "oklch(0.765 0.177 163.22)",
  },
} satisfies ChartConfig

const pieChartConfig = {
  orders: {
    label: "Orders",
  },
  PENDING: {
    label: "Pending",
    color: "oklch(0.769 0.188 70.08)",
  },
  PREPARING: {
    label: "Preparing",
    color: "oklch(0.714 0.203 196.91)",
  },
  OUT_FOR_DELIVERY: {
    label: "In Transit",
    color: "oklch(0.585 0.233 277)",
  },
  DELIVERED: {
    label: "Delivered",
    color: "oklch(0.765 0.177 163.22)",
  },
} satisfies ChartConfig

// ─── Animations ───────────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b border-slate-100">
      <td className="px-6 py-4">
        <div className="h-4 w-32 rounded bg-slate-200" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 w-20 rounded bg-slate-200" />
      </td>
      <td className="px-6 py-4">
        <div className="h-6 w-24 rounded-full bg-slate-200" />
      </td>
    </tr>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    try {
      const res = await axios.get("/orders")
      if (res.data?.data) setOrders(res.data.data)
    } catch {
      toast.error("Failed to load orders")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const total = orders.length
  const byStatus = (s: OrderStatus) => orders.filter((o) => o.status === s).length

  // Chart data
  const barData = [
    { status: "PENDING", count: byStatus("PENDING"), fill: "oklch(0.769 0.188 70.08)" },
    { status: "PREPARING", count: byStatus("PREPARING"), fill: "oklch(0.714 0.203 196.91)" },
    { status: "OUT_FOR_DELIVERY", count: byStatus("OUT_FOR_DELIVERY"), fill: "oklch(0.585 0.233 277)" },
    { status: "DELIVERED", count: byStatus("DELIVERED"), fill: "oklch(0.765 0.177 163.22)" },
  ]

  const pieData = barData.filter((d) => d.count > 0)

  return (
    <div className="space-y-7">
      {/* ── Page header ── */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Order Management
          </h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Live overview of all system orders
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchOrders(true)}
          disabled={refreshing}
          className="border-slate-300 bg-white font-bold text-slate-700 hover:bg-slate-50 shadow-2xs"
        >
          <RefreshCw
            size={14}
            className={refreshing ? "animate-spin" : ""}
          />
          Refresh
        </Button>
      </motion.div>

      {/* ── Charts section ── */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.1 } },
        }}
        className="grid grid-cols-1 gap-5 lg:grid-cols-2"
      >
        {/* Bar Chart — Order Distribution by Status */}
        <motion.div variants={fadeUp}>
          <Card className="border border-slate-200 bg-white shadow-xs">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    Order Breakdown
                  </CardTitle>
                  <CardDescription className="text-xs font-medium text-slate-500">
                    Distribution across all statuses
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 px-3 py-1.5">
                  <TrendingUp size={14} className="text-indigo-600" />
                  <span className="text-sm font-black text-indigo-700">{total}</span>
                  <span className="text-xs font-semibold text-indigo-500">total</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer config={barChartConfig} className="aspect-[2/1] w-full">
                <BarChart
                  accessibilityLayer
                  data={barData}
                  layout="vertical"
                  margin={{ left: 8, right: 16, top: 8, bottom: 8 }}
                >
                  <YAxis
                    dataKey="status"
                    type="category"
                    tickLine={false}
                    tickMargin={8}
                    axisLine={false}
                    tickFormatter={(value) =>
                      barChartConfig[value as keyof typeof barChartConfig]?.label ?? value
                    }
                    className="text-xs font-semibold"
                  />
                  <XAxis dataKey="count" type="number" hide />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Bar
                    dataKey="count"
                    layout="vertical"
                    radius={[4, 8, 8, 4]}
                    barSize={28}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pie Chart — Status Proportions */}
        <motion.div variants={fadeUp}>
          <Card className="border border-slate-200 bg-white shadow-xs">
            <CardHeader className="pb-2">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Status Overview
                </CardTitle>
                <CardDescription className="text-xs font-medium text-slate-500">
                  Proportion of orders per status
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer config={pieChartConfig} className="mx-auto aspect-square max-h-[220px]">
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={pieData}
                    dataKey="count"
                    nameKey="status"
                    innerRadius={55}
                    outerRadius={85}
                    strokeWidth={3}
                    stroke="white"
                    paddingAngle={3}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.status} fill={entry.fill} />
                    ))}
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={viewBox.cx}
                                y={viewBox.cy}
                                className="fill-slate-900 text-2xl font-black"
                              >
                                {total}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 20}
                                className="fill-slate-500 text-xs font-semibold"
                              >
                                Orders
                              </tspan>
                            </text>
                          )
                        }
                      }}
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>
              {/* Legend */}
              <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
                {barData.map((d) => (
                  <div key={d.status} className="flex items-center gap-1.5">
                    <div
                      className="h-2.5 w-2.5 rounded-sm"
                      style={{ backgroundColor: d.fill }}
                    />
                    <span className="text-xs font-semibold text-slate-600">
                      {barChartConfig[d.status as keyof typeof barChartConfig]?.label}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{d.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* ── Orders table card ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs"
      >
        {/* Table header bar */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <h2 className="text-base font-bold text-slate-900">
            All Orders
          </h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-700 border border-slate-200">
            {total} records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {["Order ID", "Amount", "Status"].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3.5 text-xs font-extrabold uppercase tracking-wider text-slate-600"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={3}>
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 border border-slate-200">
                        <ShoppingBag size={24} className="text-slate-400" />
                      </div>
                      <p className="mt-4 text-base font-bold text-slate-800">
                        No orders found
                      </p>
                      <p className="mt-1 text-xs text-slate-500 font-medium">
                        Orders will appear here once customers start placing them.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence initial={false}>
                  {orders.map((order, i) => {
                    const cfg = STATUS_CONFIG[order.status]
                    const Icon = cfg.icon
                    return (
                      <motion.tr
                        key={order.orderId}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="transition-colors hover:bg-slate-50/80"
                      >
                        {/* Order ID */}
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm font-bold text-slate-900">
                            {order.orderId}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="px-6 py-4">
                          <span className="text-sm font-black text-slate-900">
                            {order.totalAmount.toLocaleString()}
                            <span className="ml-1.5 text-xs font-bold text-indigo-600">
                              Ks
                            </span>
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs ${cfg.badgeClass}`}
                          >
                            <Icon size={12} strokeWidth={2.5} />
                            {cfg.label}
                          </span>
                        </td>
                      </motion.tr>
                    )
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
