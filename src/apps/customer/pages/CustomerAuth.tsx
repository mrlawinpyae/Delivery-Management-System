import { useState, useRef } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowLeft,
  AlertCircle,
} from "lucide-react"

// ─── ZOD & REACT HOOK FORM ───
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast, Toaster } from "sonner"
import axios from "@/lib/axios"
import { useAuthStore } from "@/store/useAuthStore"

// ─── VALIDATION SCHEMAS ───
const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
})

const signUpSchema = loginSchema.extend({
  name: z.string().min(2, "Name must be at least 2 characters"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number")
    .regex(/[^a-zA-Z0-9]/, "Must contain at least one special character"),
})

// Infer Types
type LoginFormValues = z.infer<typeof loginSchema>
type SignUpFormValues = z.infer<typeof signUpSchema>
// Combined type for the form
type AuthFormValues = LoginFormValues & Partial<SignUpFormValues>

export default function CustomerAuth() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const signupParam = searchParams.get("signup") === "true"
  const [isLogin, setIsLogin] = useState(!signupParam)

  const lastSignupParamRef = useRef(signupParam)
  if (lastSignupParamRef.current !== signupParam) {
    lastSignupParamRef.current = signupParam
    setIsLogin(!signupParam)
  }

  const [showPassword, setShowPassword] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const login = useAuthStore((state) => state.login)
  // ─── REACT HOOK FORM SETUP ───
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormValues>({
    resolver: zodResolver(isLogin ? loginSchema : signUpSchema),
    mode: "onChange",
  })

  const onSubmit = async (data: AuthFormValues) => {
    const endpoint = isLogin ? "/auth/login" : "/auth/sign-up"

    const payload = isLogin
      ? { email: data.email, password: data.password }
      : { name: data.name, email: data.email, password: data.password }

    try {
      const response = await axios.post(endpoint, payload)

      // 💡 1. Success Message ကို အရင်ပြမည်
      toast.success(response.data.message || "Success!")

      if (isLogin) {
        const { token, ...userData } = response.data.data
        login(userData, token)

        // Login ဝင်တာ အောင်မြင်ရင်လည်း Message ဖတ်လို့ရအောင် ၁ စက္ကန့် စောင့်ပေးမည်
        await new Promise((resolve) => setTimeout(resolve, 1000))
        navigate("/customer")
      } else {
        // 💡 2. Sign Up အောင်မြင်ပါက Message ဖတ်ချိန်ရအောင် ၁.၅ စက္ကန့် စောင့်မည် (Loading လည်နေပါမည်)
        await new Promise((resolve) => setTimeout(resolve, 1500))

        // 💡 3. အချိန်ပြည့်မှသာ Login မျက်နှာပြင်သို့ ပြောင်းပေးမည်
        setIsLogin(true)
        reset()
        navigate(window.location.pathname, { replace: true })
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error || err.message || "Authentication failed"

      toast.error("Authentication Error", {
        description: errorMessage,
      })
      setApiError(errorMessage)
    }
  }

  const toggleAuthMode = () => {
    setIsLogin(!isLogin)
    setApiError(null)
    reset()
  }

  // Helper component for error messages
  const ErrorText = ({ message }: { message?: string }) => {
    if (!message) return null
    return (
      <span className="absolute -bottom-5 left-4 text-[10px] font-medium text-red-500">
        {message}
      </span>
    )
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#F9F9FB] p-4 font-sans text-zinc-900">
      <Toaster position="top-center" richColors />
      {/* ─── BACK BUTTON ─── */}
      <div className="absolute top-6 left-6 z-10 md:top-10 md:left-10">
        <Link
          to="/customer"
          className="group flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-sm transition-all hover:scale-105 hover:border-zinc-300 hover:shadow-md active:scale-95"
        >
          <ArrowLeft
            size={18}
            className="text-zinc-600 transition-colors group-hover:text-zinc-900"
          />
        </Link>
      </div>

      <div className="w-full max-w-md">
        {/* ─── LOGO ─── */}
        <div className="mb-8 flex justify-center">
          <div className="group flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 font-serif text-xl font-bold tracking-tighter text-white shadow-lg shadow-zinc-900/20">
              D
            </div>
            <span className="font-serif text-2xl font-semibold tracking-tight text-zinc-900">
              deliv<span className="font-sans font-light text-zinc-400">x</span>
            </span>
          </div>
        </div>

        {/* ─── AUTH CARD ─── */}
        <div className="rounded-[2rem] border border-zinc-100 bg-white p-8 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={isLogin ? "login" : "signup"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-8 text-center">
                <h1 className="font-serif text-2xl font-bold text-zinc-900">
                  {isLogin ? "Welcome Back" : "Create an Account"}
                </h1>
                <p className="mt-2 text-sm font-light text-zinc-500">
                  {isLogin
                    ? "Enter your details to access your premium account."
                    : "Join us to discover curated premium kitchens."}
                </p>
              </div>

              {/* ─── API ERROR MESSAGE ─── */}
              {apiError && (
                <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">
                  <AlertCircle size={16} />
                  <span>{apiError}</span>
                </div>
              )}

              {/* ─── REACT HOOK FORM ─── */}
              <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                {/* SIGN UP ONLY FIELDS */}
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-6 overflow-hidden"
                  >
                    <div className="relative">
                      <User className="absolute top-3.5 left-4 h-5 w-5 text-zinc-400" />
                      <input
                        {...register("name")}
                        placeholder="Full Name"
                        className={`w-full rounded-2xl border bg-zinc-50/50 py-3.5 pr-4 pl-12 text-sm transition-all outline-none focus:bg-white focus:ring-4 ${errors.name ? "border-red-400 focus:border-red-400 focus:ring-red-100" : "border-zinc-200 focus:border-zinc-400 focus:ring-zinc-100"}`}
                      />
                      <ErrorText message={errors.name?.message} />
                    </div>
                  </motion.div>
                )}

                {/* EMAIL */}
                <div className="relative">
                  <Mail className="absolute top-3.5 left-4 h-5 w-5 text-zinc-400" />
                  <input
                    {...register("email")}
                    placeholder="Email Address"
                    className={`w-full rounded-2xl border bg-zinc-50/50 py-3.5 pr-4 pl-12 text-sm transition-all outline-none focus:bg-white focus:ring-4 ${errors.email ? "border-red-400 focus:border-red-400 focus:ring-red-100" : "border-zinc-200 focus:border-zinc-400 focus:ring-zinc-100"}`}
                  />
                  <ErrorText message={errors.email?.message} />
                </div>

                {/* PASSWORD */}
                <div className="relative">
                  <Lock className="absolute top-3.5 left-4 h-5 w-5 text-zinc-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    placeholder="Password"
                    className={`w-full rounded-2xl border bg-zinc-50/50 py-3.5 pr-12 pl-12 text-sm transition-all outline-none focus:bg-white focus:ring-4 ${errors.password ? "border-red-400 focus:border-red-400 focus:ring-red-100" : "border-zinc-200 focus:border-zinc-400 focus:ring-zinc-100"}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-3.5 right-4 text-zinc-400 transition-colors hover:text-zinc-600 focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                  <ErrorText message={errors.password?.message} />
                </div>

                {/* {isLogin && (
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      className="text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )} */}

                {/* ─── SUBMIT BUTTON ─── */}
                <button
                  disabled={isSubmitting}
                  className="mt-4 flex w-full items-center justify-center rounded-full bg-zinc-900 py-4 text-sm font-bold text-white shadow-lg transition-all hover:bg-zinc-800 hover:shadow-xl active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100"
                >
                  {isSubmitting ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-500 border-t-white" />
                  ) : isLogin ? (
                    "Sign In"
                  ) : (
                    "Create Account"
                  )}
                </button>
              </form>

              {/* ─── TOGGLE ─── */}
              <div className="mt-8 text-center text-sm text-zinc-500">
                {isLogin
                  ? "Don't have an account? "
                  : "Already have an account? "}
                <button
                  onClick={toggleAuthMode}
                  className="font-bold text-zinc-900 hover:underline focus:outline-none"
                >
                  {isLogin ? "Sign Up" : "Sign In"}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
