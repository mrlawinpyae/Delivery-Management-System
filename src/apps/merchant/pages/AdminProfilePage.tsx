import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Mail, Save, Loader2, Lock, Eye, EyeOff } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import type { FieldErrors } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast, Toaster } from "sonner"
import axios from "@/lib/axios"
import { useAuthStore } from "@/store/useAuthStore"

// ─── VALIDATION SCHEMA ───
const adminProfileSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email format"),
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

type AdminProfileFormValues = z.infer<typeof adminProfileSchema>

export default function AdminProfilePage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const updateUser = useAuthStore((state) => state.updateUser)

  const [isLoadingData, setIsLoadingData] = useState(true)
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, isDirty, dirtyFields },
  } = useForm<AdminProfileFormValues>({
    resolver: zodResolver(adminProfileSchema),
    defaultValues: {
      email: "",
      oldPassword: "",
      newPassword: "",
    },
    mode: "onChange",
  })

  const userId =
    user?.userId ||
    (user as { id?: string })?.id ||
    (user as { _id?: string })?._id

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
          email: userData.email || "",
          oldPassword: "",
          newPassword: "",
        })
      } catch (error) {
        console.error("Error fetching admin data:", error)
        toast.error("Failed to load profile data")
      } finally {
        setIsLoadingData(false)
      }
    }

    fetchUserData()
  }, [userId, reset])

  const onSubmit = async (data: AdminProfileFormValues) => {
    const id =
      user?.userId ||
      (user as { id?: string })?.id ||
      (user as { _id?: string })?._id
    
    if (!id || !user) {
      toast.error("Admin ID not found.")
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


      let emailUpdated = false
      if (dirtyFields.email) {
        await axios.put(`/auth/user/${id}/email`, {
          newEmail: data.email,
        })
        emailUpdated = true
      }


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
        email: data.email,
      })

      reset({
        email: data.email,
        oldPassword: "",
        newPassword: "",
      })

      toast.success("Profile updated successfully!")
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

  const onFormError = (formErrors: FieldErrors<AdminProfileFormValues>) => {
    const firstError = Object.values(formErrors)[0]
    if (firstError?.message) {
      toast.error(firstError.message)
    }
  }

  return (
    <div className="mx-auto max-w-2xl w-full">
      <Toaster position="top-center" richColors />
      
      {/* ─── HEADER ─── */}
      <div className="mb-8 flex items-center gap-4">
        <h1 className="font-serif text-2xl font-bold text-slate-900">
          Admin Profile
        </h1>
      </div>

      {/* ─── SETTINGS CARD ─── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
      >
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900">
            Account Details
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage your admin email and password.
          </p>
        </div>

        {isLoadingData ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit, onFormError)}
            className="space-y-6"
          >

            {/* EMAIL FIELD */}
            <div className="relative">
              <label className="mb-2 block text-xs font-medium text-slate-500">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute top-3.5 left-4 h-5 w-5 text-slate-400" />
                <input
                  {...register("email")}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3.5 pr-4 pl-12 text-sm transition-all outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                />
              </div>
            </div>

            {/* OLD PASSWORD FIELD */}
            <div className="relative pt-4 border-t border-slate-100">
              <label className="mb-2 block text-xs font-medium text-slate-500">
                Old Password
              </label>
              <div className="relative">
                <Lock className="absolute top-3.5 left-4 h-5 w-5 text-slate-400" />
                <input
                  type={showOldPassword ? "text" : "password"}
                  {...register("oldPassword")}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3.5 pr-12 pl-12 text-sm transition-all outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                  placeholder="Enter current password to change it"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute top-3.5 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showOldPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* NEW PASSWORD FIELD */}
            <div className="relative">
              <label className="mb-2 block text-xs font-medium text-slate-500">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute top-3.5 left-4 h-5 w-5 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  {...register("newPassword")}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3.5 pr-12 pl-12 text-sm transition-all outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-3.5 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <div className="pt-4">
              <button
                disabled={!isDirty || isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md active:scale-[0.98] disabled:scale-100 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-white" />
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
  )
}
