import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { User, Mail, Save, ArrowLeft, Loader2, Camera, Lock, Eye, EyeOff } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import type { FieldErrors } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast, Toaster } from "sonner"
import axios from "@/lib/axios"
import { useAuthStore } from "@/store/useAuthStore"
import { getImageUrl } from "@/lib/utils"
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
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Invalid email format"),
  phone: z.string().refine(
    (val) => {
      if (!val || val === "+95") return true
      return isValidPhoneNumber(val, "MM")
    },
    {
      message: "Please enter a valid Myanmar phone number.",
    }
  ),
  oldPassword: z.string().optional().or(z.literal("")),
  newPassword: z.string().optional().or(z.literal("")),
}).refine((data) => {
  if (data.newPassword && data.newPassword.length > 0) {
    return data.newPassword.length >= 6;
  }
  return true;
}, {
  message: "New password must be at least 6 characters",
  path: ["newPassword"],
}).refine((data) => {
  if (data.newPassword && data.newPassword.length > 0) {
    return !!data.oldPassword && data.oldPassword.length > 0;
  }
  return true;
}, {
  message: "Old password is required to set a new password",
  path: ["oldPassword"],
})

type ProfileFormValues = z.infer<typeof profileSchema>

export default function ProfileSettingsPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const login = useAuthStore((state) => state.login)
  const logout = useAuthStore((state) => state.logout)
  const updateUser = useAuthStore((state) => state.updateUser)

  // ─── LOADING STATE FOR FETCHING DATA ───
  const [isLoadingData, setIsLoadingData] = useState(true)

  // ─── AVATAR PREVIEW STATE ───
  const [avatarPreview, setAvatarPreview] = useState<string>("")

  // ─── IMAGE UPLOAD STATE ───
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  // ─── PASSWORD VISIBILITY STATE ───
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isSubmitting, isDirty, errors, dirtyFields },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      oldPassword: "",
      newPassword: "",
    },
    mode: "onChange",
  })

  useEffect(() => {
    register("phone")
  }, [register])
  const formPhone = watch("phone") || ""
  const userId =
    user?.userId ||
    (user as { id?: string })?.id ||
    (user as { _id?: string })?._id

  // ─── FETCH USER DATA (AXIOS) ───
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) {
        setIsLoadingData(false)
        return
      }

      try {
        const response = await axios.get(`/auth/user/${userId}`)

        const userData = response.data?.data || response.data || {}

        reset({
          name: userData.name || "",
          email: userData.email || "",
          phone: userData.phone || "",
          oldPassword: "",
          newPassword: "",
        })

        // Local user image has precedence, then API image, then default fallback
        const currentImg =
          user?.img ||
          user?.image ||
          userData.img ||
          userData.image ||
          "https://github.com/shadcn.png"
        setAvatarPreview(currentImg)
      } catch (error) {
        console.error("Error fetching user data:", error)
        toast.error("Failed to load profile data")
      } finally {
        setIsLoadingData(false)
      }
    }

    fetchUserData()
  }, [userId, reset])

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

      const uploadedUrl =
        typeof response.data === "string"
          ? response.data
          : response.data?.url ||
            response.data?.data?.url ||
            response.data?.img ||
            response.data?.image ||
            ""

      if (uploadedUrl) {
        setAvatarPreview(uploadedUrl)
        updateUser({ img: uploadedUrl, image: uploadedUrl })
      }
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

  const isImageChanged = avatarPreview !== (user?.img || user?.image || "")


  // ─── SUBMIT HANDLER (UPDATE PROFILE) ───
  const onSubmit = async (data: ProfileFormValues) => {
    let finalPhone = data.phone
    if (!finalPhone || finalPhone === "+95") {
      finalPhone = ""
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
      let passwordUpdated = false
      if (data.newPassword && data.oldPassword) {
        try {
          const passRes = await axios.put(`/auth/user/${id}/password`, {
            oldPassword: data.oldPassword,
            newPassword: data.newPassword,
          }, {
            headers: {
              "X-Skip-401": "true"
            }
          })
          
          // Strict check for error in 200 response
          if (passRes.status >= 200 && passRes.status < 300 && !passRes.data?.error && passRes.data?.status !== "error") {
            passwordUpdated = true
          } else {
            toast.error(passRes.data?.error || passRes.data?.message || "Failed to update password")
            return
          }
        } catch (err: unknown) {
          const passErr = err as {
            response?: { data?: { error?: string, message?: string } }
            message?: string
          }
          const errorMessage =
            passErr.response?.data?.error ||
            passErr.response?.data?.message ||
            passErr.message ||
            "Failed to update password"
          toast.error(errorMessage)
          return
        }
      }

      // Axios PUT request to update profile
      const response = await axios.put(`/auth/user/${id}`, {
        name: data.name,
        image: avatarPreview,
        img: avatarPreview,
        phone: finalPhone,
      })

      let emailUpdated = false
      if (dirtyFields.email) {
        await axios.put(`/auth/user/${id}/email`, {
          newEmail: data.email,
        })
        emailUpdated = true
      }

      const updatedUser = response.data?.data || response.data || {}
      const newImg = updatedUser.img || updatedUser.image || avatarPreview

      if (emailUpdated) {
        toast.success("Email updated successfully. Please log in again.")
        setTimeout(() => {
          logout()
          navigate("/customer/login")
        }, 3000)
        return
      }

      if (passwordUpdated) {
        toast.success("Password updated successfully. Please log in again.")
        setTimeout(() => {
          logout()
          navigate("/customer/login")
        }, 3000)
        return
      }

      updateUser({
        name: updatedUser.name || data.name,
        image: newImg,
        img: newImg,
        phone: updatedUser.phone ?? finalPhone,
        email: data.email,
      })

      // Reset RHF internal state with the new values so isDirty resets correctly
      reset({
        name: updatedUser.name || data.name,
        email: data.email,
        phone: updatedUser.phone ?? finalPhone,
        oldPassword: "",
        newPassword: "",
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
                      src={getImageUrl(avatarPreview)}
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
                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/50 py-3.5 pr-4 pl-12 text-sm transition-all outline-none focus:border-zinc-400 focus:bg-white focus:ring-4 focus:ring-zinc-100"
                  />
                </div>
              </div>

              {/* OLD PASSWORD FIELD */}
              <div className="relative pt-4 border-t border-zinc-100">
                <label className="mb-2 block text-xs font-medium text-zinc-500">
                  Old Password
                </label>
                <div className="relative">
                  <Lock className="absolute top-3.5 left-4 h-5 w-5 text-zinc-400" />
                  <input
                    type={showOldPassword ? "text" : "password"}
                    {...register("oldPassword")}
                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/50 py-3.5 pr-12 pl-12 text-sm transition-all outline-none focus:border-zinc-400 focus:bg-white focus:ring-4 focus:ring-zinc-100"
                    placeholder="Enter current password to change it"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute top-3.5 right-4 text-zinc-400 hover:text-zinc-600 transition-colors"
                  >
                    {showOldPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* NEW PASSWORD FIELD */}
              <div className="relative">
                <label className="mb-2 block text-xs font-medium text-zinc-500">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute top-3.5 left-4 h-5 w-5 text-zinc-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register("newPassword")}
                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/50 py-3.5 pr-12 pl-12 text-sm transition-all outline-none focus:border-zinc-400 focus:bg-white focus:ring-4 focus:ring-zinc-100"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-3.5 right-4 text-zinc-400 hover:text-zinc-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* PHONE FIELD — PhoneInput (mirrors DeliveryInfoPage) */}
              <div className="pt-4 border-t border-zinc-100">
                <label className="mb-2 block text-xs font-medium text-zinc-500">
                  Phone Number
                </label>
                <PhoneInput
                  defaultCountry="mm"
                  countries={myanmarCountry ? [myanmarCountry] : undefined}
                  value={formPhone}
                  onChange={(val) => {
                    setValue("phone", val, {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }}
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
                    (!isDirty && !isImageChanged) ||
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
