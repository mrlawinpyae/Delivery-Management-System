import { useState, useEffect } from "react"
import { useForm, type FieldErrors } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion, AnimatePresence } from "framer-motion"
import { UserPlus, Pencil, Loader2, Camera, User, Eye, EyeOff } from "lucide-react"
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
import { MyanmarNrcInput } from "@/components/ui/myanmar-nrc-input"


const myanmarCountry = defaultCountries.find(
  (c) => parseCountry(c).iso2 === "mm"
)

type CombinedRiderForm = CreateRiderForm & UpdateRiderForm & { nrcNumber?: string }

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
  const [nrcNumber, setNrcNumber] = useState("")
  const [avatarPreview, setAvatarPreview] = useState<string>("")
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // React Hook Form setup with conditional Zod resolver
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm<CombinedRiderForm>({
    resolver: zodResolver(isEdit ? updateRiderSchema : createRiderSchema),
    mode: "onChange",
  })

  // Register phone & nrcNumber fields
  useEffect(() => {
    register("phone")
    register("nrcNumber")
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
      let isSubscribed = true

      const applyRiderData = (r: RiderSummary | any) => {
        const initialPhone = r.phone || ""
        const initialNrc = r.nrcNumber || r.nrc || ""
        const initialEmail = r.email || ""
        const rawVehicle = r.vehicleType || r.vehicle?.type || r.type || ""
        const initialVehicle =
          VEHICLE_OPTIONS.find(
            (opt) => opt.toLowerCase() === rawVehicle.toLowerCase()
          ) || rawVehicle
        const initialLicence =
          r.licenceNumber ||
          r.licenseNumber ||
          r.vehicle?.licenceNumber ||
          r.vehicle?.licenseNumber ||
          ""
        const initialImage = r.image || ""

        setPhone(initialPhone)
        setNrcNumber(initialNrc)
        setAvatarPreview(initialImage)
        reset({
          name: r.name || "",
          phone: initialPhone,
          email: initialEmail,
          oldPassword: "",
          password: "",
          vehicleType: initialVehicle,
          licenceNumber: initialLicence,
          nrcNumber: initialNrc,
          image: initialImage,
        })
        setValue("vehicleType", initialVehicle, { shouldValidate: true })
        setValue("licenceNumber", initialLicence, { shouldValidate: true })
        setValue("phone", initialPhone, { shouldValidate: true })
        setValue("nrcNumber", initialNrc, { shouldValidate: true })
        setValue("email", initialEmail, { shouldValidate: true })
        if (initialImage) {
          setValue("image", initialImage, { shouldValidate: true })
        }
      }

      applyRiderData(rider)

      if (rider.riderId) {
        axios
          .get(`/rider/${rider.riderId}`)
          .then((res) => {
            if (isSubscribed && res.data) {
              const fetchedData = res.data.data || res.data
              const fullRider = { ...rider, ...fetchedData }
              applyRiderData(fullRider)
            }
          })
          .catch(() => {
            // Silently fallback to rider prop
          })
      }

      return () => {
        isSubscribed = false
      }
    }
  }, [open, isEdit, rider, reset, setValue])

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
      setNrcNumber("")
      setAvatarPreview("")
      setIsUploadingImage(false)
      setShowPassword(false)
      setIsEdit(initialIsEdit)
    }
    onOpenChange(v)
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

        if (data.oldPassword && data.password) {
          await axios.put(`/auth/user/${rider.riderId}/password`, {
            oldPassword: data.oldPassword,
            newPassword: data.password,
          }, {
            headers: {
              "X-Skip-401": "true"
            }
          })
        }

        toast.success("Rider info updated!")
        onUpdated?.(rider.riderId, {
          name: data.name,
          phone: data.phone || rider.phone,
          email: data.email || rider.email,
          vehicleType: data.vehicleType || rider.vehicleType,
          licenceNumber: data.licenceNumber || rider.licenceNumber,
          nrcNumber: data.nrcNumber || rider.nrcNumber,
          image: data.image || rider.image,
        })
        handleClose(false)
      } catch (err: any) {
        toast.error(err.response?.data?.error || "Failed to update rider")
      }
    } else {
      try {
        const payload: CreateRiderPayload = {
          ...(data as CreateRiderPayload),
          nrcNumber: data.nrcNumber || nrcNumber,
        }
        const res = await axios.post("/rider", payload)
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
      <DialogContent className="sm:max-w-md bg-white text-slate-900 border border-slate-200/80 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden p-0 gap-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={isEdit ? "edit" : "create"}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col flex-1 overflow-hidden min-h-0"
          >
            <DialogHeader className="px-6 pt-6 pb-4 shrink-0 shadow-xs z-10 bg-white">
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

            <form onSubmit={handleSubmit(onSubmit, onFormError)} className="flex flex-col flex-1 overflow-hidden min-h-0">
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
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

              {/* Password fields */}
              {isEdit ? (
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Old Password">
                    <Input
                      {...register("oldPassword")}
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="bg-white text-slate-900 border-slate-300 focus:ring-indigo-500"
                    />
                  </FormField>
                  <FormField label="New Password">
                    <div className="relative">
                      <Input
                        {...register("password")}
                        type={showPassword ? "text" : "password"}
                        placeholder="*********"
                        className="bg-white text-slate-900 border-slate-300 focus:ring-indigo-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </FormField>
                </div>
              ) : (
                <FormField label="Password">
                  <div className="relative">
                    <Input
                      {...register("password")}
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="bg-white text-slate-900 border-slate-300 focus:ring-indigo-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </FormField>
              )}

                {/* Myanmar NRC Number */}
                <FormField label="Myanmar NRC Number">
                  <MyanmarNrcInput
                    value={nrcNumber}
                    disabled={isEdit}
                    onChange={(val) => {
                      setNrcNumber(val)
                      setValue("nrcNumber", val, { shouldValidate: true })
                    }}
                  />
                </FormField>

              {/* Grid 2: Vehicle Type & Licence Number */}
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Vehicle Type">
                  <Select
                    value={watch("vehicleType") || ""}
                    onValueChange={(val) => setValue("vehicleType", val, { shouldValidate: true })}
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
                <FormField label="Licence Number">
                  <Input
                    {...register("licenceNumber")}
                    placeholder="MDY-1234"
                    className="bg-white text-slate-900 border-slate-300 focus:ring-indigo-500"
                  />
                </FormField>
              </div>
              </div>
              <DialogFooter className="px-6 py-4 shrink-0 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-2">
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
