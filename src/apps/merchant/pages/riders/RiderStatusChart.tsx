import { motion } from "framer-motion"
import { Users } from "lucide-react"
import { Pie, PieChart, Cell, Label as PieLabel } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { riderChartConfig, RIDER_STATUS_FILLS, fadeUp } from "./types"

interface Props {
  totalRiders: number
  available: number
  busy: number
  offline: number
}

// ─── Rider Status Donut Chart ─────────────────────────────────────────────────
export function RiderStatusChart({ totalRiders, available, busy, offline }: Props) {
  const statusData = [
    { status: "AVAILABLE", count: available, fill: RIDER_STATUS_FILLS.AVAILABLE },
    { status: "BUSY",      count: busy,      fill: RIDER_STATUS_FILLS.BUSY      },
    { status: "OFFLINE",   count: offline,   fill: RIDER_STATUS_FILLS.OFFLINE   },
  ]

  const pieData = statusData.filter((d) => d.count > 0)

  return (
    <motion.div variants={fadeUp}>
      <Card className="border border-slate-200/80 bg-white shadow-[0_2px_10px_-4px_rgba(15,23,42,0.04)]">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Rider Overview
              </CardTitle>
              <CardDescription className="text-xs font-medium text-slate-500">
                Live status of your delivery fleet
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 px-3 py-1.5">
              <Users size={14} className="text-indigo-600" />
              <span className="text-sm font-black text-indigo-700">{totalRiders}</span>
              <span className="text-xs font-semibold text-indigo-500">riders</span>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-8">
            {/* Donut chart */}
            <ChartContainer
              config={riderChartConfig}
              className="aspect-square w-full max-w-[180px]"
            >
              <PieChart>
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={pieData}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={50}
                  outerRadius={75}
                  strokeWidth={3}
                  stroke="white"
                  paddingAngle={3}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.status} fill={entry.fill} />
                  ))}
                  <PieLabel
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
                              className="fill-slate-900 text-2xl font-extrabold"
                            >
                              {totalRiders}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 18}
                              className="fill-slate-500 text-[10px] font-semibold"
                            >
                              Total
                            </tspan>
                          </text>
                        )
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>

            {/* Status breakdown rows */}
            <div className="flex flex-1 flex-col gap-3 w-full">
              {statusData.map((item) => (
                <div
                  key={item.status}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 transition-colors hover:bg-slate-50"
                >
                  <div
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="flex-1 text-sm font-semibold text-slate-700">
                    {riderChartConfig[item.status as keyof typeof riderChartConfig]?.label ?? item.status}
                  </span>
                  <span className="text-lg font-black text-slate-900 tabular-nums">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
