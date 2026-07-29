import { useState, useEffect } from "react"
import { useForm, type FieldErrors } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion, AnimatePresence } from "framer-motion"
import { UserPlus, Pencil, Loader2, Camera, User } from "lucide-react"
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
import axios from "@/lib/axios"
import { toast } from "sonner"
import type { RiderSummary, CreateRiderPayload } from "@/types"
import { FormField } from "./FormField"
import {
  createRiderSchema,
  updateRiderSchema,
  VEHICLE_OPTIONS,
  type CreateRiderForm,
  type UpdateRiderForm,
} from "./types"
import {
  PhoneInput,
  defaultCountries,
  parseCountry,
} from "react-international-phone"
import "react-international-phone/style.css"

const myanmarCountry = defaultCountries.find(
  (c) => parseCountry(c).iso2 === "mm"
)

type CombinedRiderForm = CreateRiderForm & UpdateRiderForm

export interface RiderFormDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  rider?: RiderSummary | null
  onCreated?: (rider: RiderSummary) => void
  onUpdated?: (riderId: string, data: Partial<RiderSummary>) => void
  initialIsEdit?: boolean
}

export function RiderFormDialog({
  open,
  onOpenChange,
  rider,
  onCreated,
  onUpdated,
  initialIsEdit = false,
}: RiderFormDialogProps) {
  const [isEdit, setIsEdit] = useState(initialIsEdit)
  const [phone, setPhone] = useState("")
  const [avatarPreview, setAvatarPreview] = useState<string>("")
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  // React Hook Form setup with conditional Zod resolver
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { isSubmitting },
  } = useForm<CombinedRiderForm>({
    resolver: zodResolver(isEdit ? updateRiderSchema : createRiderSchema),
    mode: "onChange",
  })

  // Register phone field
  useEffect(() => {
    register("phone")
  }, [register])

  // Sync mode when initialIsEdit or open changes
  useEffect(() => {
    if (open) {
      setIsEdit(initialIsEdit)
    }
  }, [open, initialIsEdit])

  // Prefill form values when in edit mode or when rider changes
  useEffect(() => {
    if (open && isEdit && rider) {
      const initialPhone = rider.phone || ""
      setPhone(initialPhone)
      setAvatarPreview("")
      reset({
        name: rider.name,
        phone: initialPhone,
        email: "",
        password: "",
        vehicleType: "",
        licenceNumber: "",
        nrcNumber: "",
        image: "",
      })
    }
  }, [open, isEdit, rider, reset])

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file")
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB")
      return
    }

    setAvatarPreview(URL.createObjectURL(file))
    setIsUploadingImage(true)
    const toastId = toast.loading("Uploading image…")

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await axios.post("/images/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      const url: string =
        typeof res.data === "string"
          ? res.data
          : res.data?.url || res.data?.data?.url || res.data?.img || res.data?.image || ""

      if (url) {
        setValue("image", url, { shouldValidate: true })
        toast.success("Image uploaded!", { id: toastId })
      } else {
        toast.error("Failed to get uploaded image URL", { id: toastId })
      }
    } catch (err: any) {
      setAvatarPreview("")
      setValue("image", undefined)
      toast.error(err.response?.data?.error || "Image upload failed", { id: toastId })
    } finally {
      setIsUploadingImage(false)
      e.target.value = ""
    }
  }

  const handleClose = (v: boolean) => {
    if (!v) {
      reset()
      setPhone("")
      setAvatarPreview("")
      setIsUploadingImage(false)
      setIsEdit(initialIsEdit)
    }
    onOpenChange(v)
  }

  const toggleMode = () => {
    const newMode = !isEdit
    setIsEdit(newMode)
    if (newMode && rider) {
      const initialPhone = rider.phone || ""
      setPhone(initialPhone)
      reset({
        name: rider.name,
        phone: initialPhone,
        email: "",
        password: "",
        vehicleType: "",
        licenceNumber: "",
        nrcNumber: "",
        image: "",
      })
    } else {
      setPhone("")
      reset({})
    }
    setAvatarPreview("")
  }

  const onSubmit = async (data: CombinedRiderForm) => {
    if (isEdit) {
      if (!rider) {
        toast.error("No rider selected to update")
        return
      }
      try {
        await axios.put(`/rider/${rider.riderId}`, {
          name: data.name,
          ...(data.phone ? { phone: data.phone } : {}),
          ...(data.email ? { email: data.email } : {}),
          ...(data.password ? { password: data.password } : {}),
          ...(data.vehicleType ? { vehicleType: data.vehicleType } : {}),
          ...(data.licenceNumber ? { licenceNumber: data.licenceNumber } : {}),
          ...(data.nrcNumber ? { nrcNumber: data.nrcNumber } : {}),
          ...(data.image ? { image: data.image } : {}),
        })
        toast.success("Rider info updated!")
        onUpdated?.(rider.riderId, { name: data.name, phone: data.phone || rider.phone })
        handleClose(false)
      } catch (err: any) {
        toast.error(err.response?.data?.error || "Failed to update rider")
      }
    } else {
      try {
        const payload = data as CreateRiderPayload
        const res = await axios.post("/rider/save-rider", payload)
        const created = res.data?.data
        toast.success("Rider created successfully!")
        onCreated?.({
          riderId: created?.userId || created?.riderId || "rider_" + Date.now(),
          name: created?.name || data.name || "New Rider",
          phone: created?.phone || data.phone || "",
          status: "AVAILABLE",
        })
        handleClose(false)
      } catch (err: any) {
        toast.error(err.response?.data?.error || "Failed to create rider")
      }
    }
  }

  const onFormError = (formErrors: FieldErrors<CombinedRiderForm>) => {
    const firstError = Object.values(formErrors)[0]
    if (firstError?.message) {
      toast.error(firstError.message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-white text-slate-900 border border-slate-200/80 shadow-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={isEdit ? "edit" : "create"}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            <DialogHeader className="mb-4">
              <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                {isEdit ? <Pencil className="h-5 w-5 text-indigo-600" /> : <UserPlus className="h-5 w-5 text-indigo-600" />}
                {isEdit ? "Edit Rider Info" : "Create New Rider"}
              </DialogTitle>
              <DialogDescription className="text-sm font-medium text-slate-500">
                {isEdit
                  ? rider
                    ? `Editing: ${rider.name}`
                    : "Update details for delivery rider."
                  : "Fill in the details to register a new delivery rider."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit, onFormError)} className="space-y-4">
              {/* Profile Image Uploader (Shared layout) */}
              <div className="mb-2 flex flex-col items-center gap-3">
                <div className="group relative h-20 w-20 overflow-hidden rounded-full border-2 border-slate-200 shadow-sm transition-all hover:border-slate-400 hover:shadow-md">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Rider preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-50 text-slate-400">
                      <User size={32} />
                    </div>
                  )}

                  <label className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    {isUploadingImage ? (
                      <Loader2 size={18} className="animate-spin text-white" />
                    ) : (
                      <>
                        <Camera size={18} className="text-white" />
                        <span className="mt-1 text-[10px] font-medium text-white">
                          {avatarPreview ? "Change" : "Upload"}
                        </span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      disabled={isUploadingImage}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-xs text-slate-400">
                  {isUploadingImage
                    ? "Uploading…"
                    : avatarPreview
                    ? "Hover to change photo"
                    : "Click to upload a profile photo"}
                </p>
              </div>

              {/* Grid 1: Full Name & Phone */}
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Full Name">
                  <Input
                    {...register("name")}
                    placeholder="Aung Aung"
                    className="bg-white text-slate-900 border-slate-300 focus:ring-indigo-500"
                  />
                </FormField>
                <FormField label="Phone">
                  <PhoneInput
                    defaultCountry="mm"
                    countries={myanmarCountry ? [myanmarCountry] : undefined}
                    value={phone}
                    onChange={(val) => {
                      setPhone(val)
                      setValue("phone", val, { shouldValidate: true })
                    }}
                    className="flex h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-600/20"
                    inputClassName="!border-none !bg-transparent !outline-none !ring-0 !px-1 !text-sm !text-slate-900 h-full w-full"
                    countrySelectorStyleProps={{
                      buttonStyle: {
                        border: "none",
                        backgroundColor: "transparent",
                        paddingLeft: "0px",
                        paddingRight: "4px",
                      },
                    }}
                  />
                </FormField>
              </div>

              {/* Email */}
              <FormField label="Email">
                <Input
                  {...register("email")}
                  type="email"
                  readOnly={isEdit}
                  placeholder="rider@gmail.com"
                  className={
                    isEdit
                      ? "bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200"
                      : "bg-white text-slate-900 border-slate-300 focus:ring-indigo-500"
                  }
                />
              </FormField>

              {/* Password field */}
              <FormField label={isEdit ? "New Password" : "Password"}>
                <Input
                  {...register("password")}
                  type="password"
                  placeholder={isEdit ? "*********" : "••••••••"}
                  className="bg-white text-slate-900 border-slate-300 focus:ring-indigo-500"
                />
              </FormField>

              {/* Grid 2: Vehicle Type & Licence Number */}
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Vehicle Type">
                  <select
                    {...register("vehicleType")}
                    className="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm text-slate-900 shadow-xs outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                  >
                    <option value="">Select…</option>
                    {VEHICLE_OPTIONS.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Licence Number">
                  <Input
                    {...register("licenceNumber")}
                    placeholder="MDY-1234"
                    className="bg-white text-slate-900 border-slate-300 focus:ring-indigo-500"
                  />
                </FormField>
              </div>

              {/* Buttons */}
              <DialogFooter className="pt-2 flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleClose(false)}
                  className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || isUploadingImage}
                  className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 font-semibold shadow-md shadow-indigo-500/20"
                >
                  {isSubmitting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : isEdit ? (
                    <Pencil size={14} />
                  ) : (
                    <UserPlus size={14} />
                  )}
                  {isSubmitting
                    ? isEdit
                      ? "Saving…"
                      : "Creating…"
                    : isEdit
                    ? "Save Changes"
                    : "Create Rider"}
                </Button>
              </DialogFooter>
            </form>

       
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
