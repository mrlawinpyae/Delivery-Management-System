import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { User, Mail, Save, ArrowLeft, Loader2, Camera } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import type { FieldErrors } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast, Toaster } from "sonner"
import axios from "@/lib/axios"
import { useAuthStore } from "@/store/useAuthStore"
import { isValidPhoneNumber } from "libphonenumber-js"
import {
  PhoneInput,
  defaultCountries,
  parseCountry,
} from "react-international-phone"
import "react-international-phone/style.css"

// Lock the phone picker to Myanmar only (mirrors DeliveryInfoPage)
const myanmarCountry = defaultCountries.find(
  (c) => parseCountry(c).iso2 === "mm"
)

// ─── VALIDATION SCHEMA ───
// Phone is validated separately (controlled state + libphonenumber-js),
// matching the same pattern used on DeliveryInfoPage.
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Invalid email format"),
})

type ProfileFormValues = z.infer<typeof profileSchema>

export default function ProfileSettingsPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const login = useAuthStore((state) => state.login)

  // ─── LOADING STATE FOR FETCHING DATA ───
  const [isLoadingData, setIsLoadingData] = useState(true)

  // ─── AVATAR PREVIEW STATE ───
  const [avatarPreview, setAvatarPreview] = useState<string>("")

  // ─── PHONE STATE (controlled outside RHF, same as DeliveryInfoPage) ───
  const [phone, setPhone] = useState("")

  // ─── IMAGE UPLOAD STATE ───
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  // ─── REACT HOOK FORM SETUP ───
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  })

  // ─── FETCH USER DATA (AXIOS) ───
  useEffect(() => {
    const fetchUserData = async () => {
      const id =
        user?.userId ||
        (user as { id?: string })?.id ||
        (user as { _id?: string })?._id
      if (!id) {
        setIsLoadingData(false)
        return
      }

      try {
        const response = await axios.get(`/auth/user/${id}`)

        const userData = response.data?.data || response.data || {}

        reset({
          name: userData.name || "",
          email: userData.email || "",
        })

        // Seed the phone state from the API (or persisted user)
        setPhone(userData.phone || "")

        // Local user image has precedence, then API image, then default fallback
        setAvatarPreview(
          user?.image || userData.image || "https://github.com/shadcn.png"
        )
      } catch (error) {
        console.error("Error fetching user data:", error)
        toast.error("Failed to load profile data")
      } finally {
        setIsLoadingData(false)
      }
    }

    fetchUserData()
  }, [user, reset])

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate that the file is an image
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file")
      return
    }

    // Limit file size to 2MB
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB")
      return
    }

    const formData = new FormData()
    formData.append("file", file)

    setIsUploadingImage(true)
    const toastId = toast.loading("Uploading image...")

    try {
      const response = await axios.post("/images/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      setAvatarPreview(response.data)
      toast.dismiss(toastId)
    } catch (error) {
      console.error("Error uploading image:", error)
      toast.error("Failed to upload image", { id: toastId })
    } finally {
      setIsUploadingImage(false)
      // Reset the file input so the same file can be selected again if needed
      e.target.value = ""
    }
  }

  const isImageChanged = avatarPreview !== (user?.image || "")
  const isPhoneChanged = phone !== (user?.phone || "")

  // ─── SUBMIT HANDLER (UPDATE PROFILE) ───
  const onSubmit = async (data: ProfileFormValues) => {
    // Validate phone number if provided
    let finalPhone = phone
    if (!phone || phone === "+95") {
      finalPhone = ""
    } else if (!isValidPhoneNumber(phone, "MM")) {
      toast.error("Please enter a valid Myanmar phone number.")
      return
    }

    const id =
      user?.userId ||
      (user as { id?: string })?.id ||
      (user as { _id?: string })?._id
    if (!id || !user) {
      toast.error("User ID not found.")
      return
    }

    try {
      // Axios PUT request to update profile
      const response = await axios.put(`/auth/user/${id}`, {
        name: data.name,
        image: avatarPreview,
        phone: finalPhone,
      })

      const updatedUser = response.data?.data || response.data || {}

      login(
        {
          ...user,
          name: updatedUser.name,
          image: updatedUser.image,
          phone: updatedUser.phone,
        },
        useAuthStore.getState().token!
      )

      // Reset RHF internal state with the new values so isDirty resets correctly
      reset({
        name: updatedUser.name,
        email: data.email,
      })

      toast.success("Profile updated successfully!")
      
      // setTimeout(() => {
      //   navigate("/customer")
      // }, 1000)
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { error?: string } }
        message?: string
      }
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to update profile"
      toast.error(errorMessage)
    }
  }

  // Show Zod validation errors as toasts
  const onFormError = (formErrors: FieldErrors<ProfileFormValues>) => {
    const firstError = Object.values(formErrors)[0]
    if (firstError?.message) {
      toast.error(firstError.message)
    }
  }

  return (
    <div className="min-h-screen bg-[#F9F9FB] p-4 pt-10 md:p-10">
      <Toaster position="top-center" richColors />
      <div className="mx-auto max-w-2xl">
        {/* ─── HEADER ─── */}
        <div className="mb-8 flex items-center gap-4">
          <Link
            to="/customer"
            className="group flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-sm transition-all hover:scale-105 hover:border-zinc-300 hover:shadow-md"
          >
            <ArrowLeft
              size={18}
              className="text-zinc-600 transition-colors group-hover:text-zinc-900"
            />
          </Link>
          <h1 className="font-serif text-2xl font-bold text-zinc-900">
            Profile Settings
          </h1>
        </div>

        {/* ─── SETTINGS CARD ─── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border border-zinc-100 bg-white p-8 shadow-[0_20px_40px_rgba(0,0,0,0.04)]"
        >
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-zinc-900">
              Personal Information
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Update your details and how we can reach you.
            </p>
          </div>

                    {isLoadingData ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
          ) : (
            <form
              onSubmit={handleSubmit(onSubmit, onFormError)}
              className="space-y-6"
            >
              {/* PROFILE IMAGE UPDATE & PREVIEW */}
              <div className="mb-6 flex flex-col items-center gap-4 border-b border-zinc-100 pb-6">
                <div className="group relative h-24 w-24 overflow-hidden rounded-full border-2 border-zinc-200 shadow-sm transition-all hover:border-zinc-400 hover:shadow-md">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Profile Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-zinc-50 text-zinc-400">
                      <User size={36} />
                    </div>
                  )}
                  <label className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <Camera size={18} className="text-white" />
                    <span className="mt-1 text-[10px] font-medium text-white">
                      Change
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-semibold text-zinc-900">
                    {user?.name || "User Name"}
                  </h3>
                  <p className="text-xs tracking-wider text-zinc-500 uppercase">
                    {user?.role || "CUSTOMER"}
                  </p>
                </div>
              </div>

              {/* NAME FIELD */}
              <div className="relative">
                <label className="mb-2 block text-xs font-medium text-zinc-500">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute top-3.5 left-4 h-5 w-5 text-zinc-400" />
                  <input
                    {...register("name")}
                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/50 py-3.5 pr-4 pl-12 text-sm transition-all outline-none focus:border-zinc-400 focus:bg-white focus:ring-4 focus:ring-zinc-100"
                  />
                </div>
              </div>

              {/* EMAIL FIELD */}
              <div className="relative">
                <label className="mb-2 block text-xs font-medium text-zinc-500">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute top-3.5 left-4 h-5 w-5 text-zinc-400" />
                  <input
                    {...register("email")}
                    readOnly
                    className="w-full cursor-not-allowed rounded-2xl border border-zinc-200 bg-zinc-100 py-3.5 pr-4 pl-12 text-sm text-zinc-500 outline-none"
                  />
                </div>
              </div>

              {/* PHONE FIELD — PhoneInput (mirrors DeliveryInfoPage) */}
              <div>
                <label className="mb-2 block text-xs font-medium text-zinc-500">
                  Phone Number
                </label>
                <PhoneInput
                  defaultCountry="mm"
                  countries={myanmarCountry ? [myanmarCountry] : undefined}
                  value={phone}
                  onChange={(value) => setPhone(value)}
                  className="flex h-[50px] w-full rounded-2xl border border-zinc-200 bg-zinc-50/50 px-3 text-sm transition-all focus-within:border-zinc-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-zinc-100"
                  inputClassName="!border-none !bg-transparent !outline-none !ring-0 !px-2 !text-sm !text-zinc-900 h-full"
                  countrySelectorStyleProps={{
                    buttonStyle: {
                      border: "none",
                      backgroundColor: "transparent",
                    },
                  }}
                />
              </div>

              {/* SUBMIT BUTTON */}
              <div className="pt-4">
                <button
                  disabled={
                    (!isDirty && !isImageChanged && !isPhoneChanged) ||
                    isSubmitting ||
                    isUploadingImage
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-zinc-900 py-4 text-sm font-bold text-white shadow-lg transition-all hover:bg-zinc-800 hover:shadow-xl active:scale-[0.98] disabled:scale-100 disabled:opacity-50"
                >
                  {isSubmitting || isUploadingImage ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-500 border-t-white" />
                  ) : (
                    <>
                      <Save size={18} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  )
}
