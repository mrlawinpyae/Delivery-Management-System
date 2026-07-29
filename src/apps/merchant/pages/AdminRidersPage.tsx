import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import axios from "@/lib/axios"
import { toast } from "sonner"
import type { RiderSummary } from "@/types"

import { CreateRiderDialog } from "./riders/CreateRiderDialog"
import { EditRiderDialog } from "./riders/EditRiderDialog"
import { DeleteRiderDialog } from "./riders/DeleteRiderDialog"
import { RiderStatusChart } from "./riders/RiderStatusChart"
import { RidersTable } from "./riders/RidersTable"
import type { ModalType } from "./riders/types"

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminRidersPage() {
  const [riders, setRiders] = useState<RiderSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [selectedRider, setSelectedRider] = useState<RiderSummary | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  // ── Data fetching ──────────────────────────────────────────────────────────
  const fetchRiders = useCallback(async () => {
    setLoading(true)
    try {
      const res = await axios.get("/rider")
      if (res.data?.data) setRiders(res.data.data)
    } catch {
      toast.error("Failed to load riders")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRiders()
  }, [fetchRiders])

  // ── Optimistic updates ─────────────────────────────────────────────────────
  const handleCreated = (rider: RiderSummary) =>
    setRiders((prev) => [rider, ...prev])

  const handleUpdated = (riderId: string, data: Partial<RiderSummary>) =>
    setRiders((prev) =>
      prev.map((r) => (r.riderId === riderId ? { ...r, ...data } : r))
    )

  const handleDeleted = (riderId: string) =>
    setRiders((prev) => prev.filter((r) => r.riderId !== riderId))

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const openModal = (type: ModalType, rider: RiderSummary) => {
    setSelectedRider(rider)
    setActiveModal(type)
  }
  const closeModal = () => {
    setActiveModal(null)
    setSelectedRider(null)
  }

  // ── Derived counts for chart ───────────────────────────────────────────────
  const available = riders.filter((r) => r.status === "AVAILABLE").length
  const busy      = riders.filter((r) => r.status === "BUSY").length
  const offline   = riders.filter((r) => r.status === "OFFLINE").length

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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Rider Management
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Create, update, and manage delivery riders
          </p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 font-semibold shadow-md shadow-indigo-500/20"
        >
          <Plus size={16} />
          Add Rider
        </Button>
      </motion.div>

      {/* ── Status chart ── */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
      >
        <RiderStatusChart
          totalRiders={riders.length}
          available={available}
          busy={busy}
          offline={offline}
        />
      </motion.div>

      {/* ── Riders table ── */}
      <RidersTable
        riders={riders}
        loading={loading}
        onOpenModal={openModal}
      />

      {/* ── Dialogs ── */}
      <CreateRiderDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreated={handleCreated}
      />
      <EditRiderDialog
        open={activeModal === "edit"}
        onOpenChange={(v) => !v && closeModal()}
        rider={selectedRider}
        onUpdated={handleUpdated}
      />
      <DeleteRiderDialog
        open={activeModal === "delete"}
        onOpenChange={(v) => !v && closeModal()}
        rider={selectedRider}
        onDeleted={handleDeleted}
      />
    </div>
  )
}
