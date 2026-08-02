import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Car, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import axios from "@/lib/axios"
import { toast } from "sonner"
import type { RiderSummary, UpdateVehiclePayload } from "@/types"
import { FormField } from "./FormField"
import { updateVehicleSchema, VEHICLE_OPTIONS, type UpdateVehicleForm } from "./types"

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  rider: RiderSummary | null
}

// ─── Edit Vehicle Dialog ──────────────────────────────────────────────────────
export function EditVehicleDialog({ open, onOpenChange, rider }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UpdateVehicleForm>({ resolver: zodResolver(updateVehicleSchema) })

  useEffect(() => {
    if (open) reset({ type: "", licenceNumber: "" })
  }, [open, reset])

  const onSubmit = async (data: UpdateVehiclePayload) => {
    if (!rider) return
    try {
      await axios.put(`/rider/${rider.riderId}/vehicle`, data)
      toast.success("Vehicle updated!")
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update vehicle")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-white text-slate-900 border border-slate-200/80 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900">Update Vehicle</DialogTitle>
          {rider && (
            <DialogDescription className="text-sm font-medium text-slate-500">
              Rider: {rider.name}
            </DialogDescription>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Vehicle Type" error={errors.type?.message}>
            <Select
              value={watch("type") || ""}
              onValueChange={(val) => setValue("type", val, { shouldValidate: true })}
            >
              <SelectTrigger className="h-9 w-full rounded-md border-slate-300 bg-white text-sm text-slate-900 data-[placeholder]:text-slate-400">
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent className="z-50 border-slate-200 bg-white text-slate-900 shadow-md">
                {VEHICLE_OPTIONS.map((v) => (
                  <SelectItem
                    key={v}
                    value={v}
                    className="cursor-pointer text-slate-900 focus:bg-slate-100 focus:text-slate-900"
                  >
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Licence Number" error={errors.licenceNumber?.message}>
            <Input {...register("licenceNumber")} placeholder="YGN-7777" className="bg-white text-slate-900 border-slate-300" />
          </FormField>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 font-semibold shadow-md shadow-indigo-500/20"
            >
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Car size={14} />}
              {isSubmitting ? "Updating…" : "Update Vehicle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
