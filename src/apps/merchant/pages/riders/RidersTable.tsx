import { motion, AnimatePresence } from "framer-motion"
import { Pencil, Trash2, Phone, InboxIcon } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import type { RiderSummary } from "@/types"
import type { ModalType } from "./types"
import { STATUS_STYLE } from "./types"
import { getImageUrl } from "@/lib/utils"

interface Props {
  riders: RiderSummary[]
  loading: boolean
  onOpenModal: (type: ModalType, rider: RiderSummary) => void
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b border-slate-100">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-slate-200" />
          <div className="h-4 w-24 rounded bg-slate-200" />
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 w-20 rounded bg-slate-200" />
      </td>
      <td className="px-6 py-4">
        <div className="h-6 w-16 rounded-full bg-slate-200" />
      </td>
      <td className="px-6 py-4 text-right">
        <div className="ml-auto h-7 w-24 rounded-lg bg-slate-200" />
      </td>
    </tr>
  )
}

// ─── Riders Table ─────────────────────────────────────────────────────────────
export function RidersTable({ riders, loading, onOpenModal }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_10px_-4px_rgba(15,23,42,0.04)]"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-slate-200/80 bg-white px-6 py-4">
        <h2 className="text-base font-bold text-slate-900">All Riders</h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 border border-slate-200/60">
          {riders.length} records
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/80">
              {["Rider", "Phone", "Status", "Actions"].map((h) => (
                <th
                  key={h}
                  className={`px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500 ${
                    h === "Actions" ? "text-right" : "text-left"
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
            ) : riders.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 border border-slate-200">
                      <InboxIcon size={24} className="text-slate-400" />
                    </div>
                    <p className="mt-4 text-base font-bold text-slate-800">No riders found</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Click "Add Rider" to register your first rider.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              <AnimatePresence initial={false}>
                {riders.map((rider, i) => (
                  <motion.tr
                    key={rider.riderId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="transition-colors hover:bg-slate-50/60"
                  >
                    {/* Name */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-50 border border-indigo-200/80 shadow-xs">
                          {rider.image && rider.image.trim() !== "" ? (
                            <img
                              src={getImageUrl(rider.image)}
                              alt={rider.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-bold text-indigo-700">
                              {rider.name ? rider.name.charAt(0).toUpperCase() : "R"}
                            </span>
                          )}
                        </div>
                        <span className="font-bold text-slate-900">{rider.name}</span>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Phone size={13} className="text-slate-400" />
                        <span className="text-xs font-semibold">
                          {rider.phone ?? (
                            <span className="italic text-slate-400 font-normal">N/A</span>
                          )}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs ${STATUS_STYLE[rider.status]}`}>
                        {rider.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          title="Edit rider info"
                          onClick={() => onOpenModal("edit", rider)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                        >
                          <Pencil size={14} />
                        </button>
                        <Separator orientation="vertical" className="h-4 bg-slate-200" />
                        <button
                          title="Delete rider"
                          onClick={() => onOpenModal("delete", rider)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}
