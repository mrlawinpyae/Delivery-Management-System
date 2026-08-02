import { useState } from "react"
import { AlertTriangle, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import axios from "@/lib/axios"
import { toast } from "sonner"
import type { RiderSummary } from "@/types"

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  rider: RiderSummary | null
  onDeleted: (riderId: string) => void
}

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────
export function DeleteRiderDialog({ open, onOpenChange, rider, onDeleted }: Props) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!rider) return
    setLoading(true)
    try {
      await axios.delete(`/rider/${rider.riderId}`)
      toast.success("Rider removed successfully")
      onDeleted(rider.riderId)
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete rider")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-white text-slate-900 border border-slate-200/80 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900">Delete Rider</DialogTitle>
          <DialogDescription className="text-sm font-medium text-slate-500">
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-3 rounded-xl bg-rose-50 border border-rose-200/80 p-3.5">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-rose-600" />
          <p className="text-sm text-slate-800">
            You are about to permanently delete{" "}
            <span className="font-bold text-slate-900">{rider?.name}</span>.
            All associated data will be removed.
          </p>
        </div>

        <DialogFooter className="pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
            className="bg-rose-600 text-white hover:bg-rose-700 font-semibold shadow-xs"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {loading ? "Deleting…" : "Delete Rider"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
