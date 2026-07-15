import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import type { Variants } from "framer-motion"
import {
  User,
  Mail,
  Phone,
  Bike,
  ShieldCheck,
  Info,
  Loader2,
} from "lucide-react"
import { useThemeStore } from "@/store/useThemeStore"
import { useAuthStore } from "@/store/useAuthStore"
import axios from "axios"
import { toast } from "sonner"

// ─── Animation ───────────────────────────────────────────────────────────────
const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}
const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
}

interface UserProfileData {
  userId: string
  name: string
  image: string
  phone: string
  email: string
  role: string
}

export default function RiderProfile() {
  const theme = useThemeStore((s) => s.theme)
  const isDark = theme === "dark"
  const loggedInUser = useAuthStore((s) => s.user)

  const [profile, setProfile] = useState<UserProfileData | null>(null)
  const [loading, setLoading] = useState(true)

  // Use logged in user's ID, or fall back to mock rider ID
  const userId = loggedInUser?.userId || "usr_rider_001"

  useEffect(() => {
    let isMounted = true
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`/api/auth/user/${userId}`)
        if (isMounted && res.data && res.data.data) {
          setProfile(res.data.data)
        }
      } catch (error) {
        console.error("Error fetching user profile:", error)
        toast.error("Failed to load profile details")
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchProfile()
    return () => {
      isMounted = false
    }
  }, [userId])

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2
          className={`h-8 w-8 animate-spin ${isDark ? "text-cyan-500" : "text-zinc-600"}`}
        />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center">
        <p className={isDark ? "text-slate-400" : "text-slate-500"}>
          Profile not found
        </p>
      </div>
    )
  }

  const infoFields = [
    { icon: User, label: "Full Name", value: profile.name },
    { icon: Mail, label: "Email Address", value: profile.email },
    { icon: Phone, label: "Phone Number", value: profile.phone },
    { icon: Bike, label: "Role", value: profile.role },
  ]

  // Detect fallback placeholder image or custom photo
  const hasProfileImage =
    profile.image && profile.image !== "fdsf" && profile.image.trim() !== ""

  return (
    <motion.div
      className="mx-auto max-w-md space-y-5"
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      {/* ── Profile Hero Card ── */}
      <motion.div
        variants={fade}
        className={`relative overflow-hidden rounded-3xl border ${
          isDark
            ? "border-slate-800 bg-slate-900/40"
            : "border-slate-200/70 bg-white shadow-lg shadow-slate-200/50"
        }`}
      >
        {/* ── Banner ── */}
        <div
          className="relative h-32"
          style={{
            background: isDark
              ? "linear-gradient(135deg, #0f172a 0%, #164e63 40%, #1e1b4b 100%)"
              : "linear-gradient(135deg, #0f172a 0%, #1e3a5f 40%, #312e81 100%)",
          }}
        >
          {/* Decorative dots */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "radial-gradient(circle, white 1px, transparent 1px)",
              backgroundSize: "16px 16px",
            }}
          />

          {/* Ambient glow for dark mode */}
          {isDark && (
            <div className="absolute top-4 right-8 h-20 w-20 rounded-full bg-cyan-400/20 blur-2xl" />
          )}
        </div>

        {/* ── Avatar & Identity ── */}
        <div className="relative px-6 pb-6">
          {/* Avatar — pulled up over the banner */}
          <div className="-mt-12 mb-4 flex justify-center">
            <div className="relative">
              <div
                className={`flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 shadow-lg ${
                  isDark
                    ? "border-slate-900 bg-slate-800 shadow-black/30"
                    : "border-white bg-slate-100 shadow-slate-300/40"
                }`}
              >
                {hasProfileImage ? (
                  <img
                    src={profile.image}
                    alt={profile.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User
                    size={40}
                    strokeWidth={1.5}
                    className={isDark ? "text-slate-500" : "text-slate-400"}
                  />
                )}
              </div>
              {/* Online/Verified badge */}
              <span
                className={`absolute right-0.5 bottom-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 bg-emerald-500 shadow-sm ${
                  isDark ? "border-slate-900" : "border-white"
                }`}
              >
                <ShieldCheck
                  size={12}
                  className="text-white"
                  strokeWidth={2.5}
                />
              </span>
            </div>
          </div>

          {/* Name & role */}
          <div className="text-center">
            <h1
              className={`text-lg font-bold tracking-tight ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              {profile.name}
            </h1>
            <div className="mt-2 flex justify-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold tracking-wide uppercase ${
                  isDark
                    ? "bg-cyan-500/10 text-cyan-400"
                    : "bg-indigo-50 text-indigo-600"
                }`}
              >
                <Bike size={11} />
                {profile.role}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-semibold tracking-wide uppercase ${
                  isDark
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-emerald-50 text-emerald-600"
                }`}
              >
                <ShieldCheck size={11} />
                Verified
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Info Card ── */}
      <motion.div
        variants={fade}
        className={`overflow-hidden rounded-2xl border ${
          isDark
            ? "border-slate-800 bg-slate-900/30"
            : "border-slate-200/70 bg-white shadow-sm"
        }`}
      >
        <div
          className={`px-5 py-3 text-[10px] font-bold tracking-widest uppercase ${
            isDark
              ? "border-b border-slate-800 text-slate-500"
              : "border-b border-slate-100 text-slate-400"
          }`}
        >
          Personal Information
        </div>

        <div className="divide-y divide-slate-100">
          {infoFields.map((field, idx) => {
            const Icon = field.icon
            return (
              <div
                key={field.label}
                className={`flex items-center gap-4 px-5 py-4 transition-colors ${
                  idx < infoFields.length - 1
                    ? isDark
                      ? "border-b border-slate-800/50"
                      : ""
                    : ""
                } ${isDark ? "hover:bg-slate-800/20" : "hover:bg-slate-50/80"}`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    isDark
                      ? "bg-slate-800/60 text-slate-400"
                      : "bg-slate-50 text-slate-400"
                  }`}
                >
                  <Icon size={16} strokeWidth={1.8} />
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-[11px] font-medium ${
                      isDark ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    {field.label}
                  </p>
                  <p
                    className={`mt-0.5 truncate text-[13px] font-semibold ${
                      isDark ? "text-slate-100" : "text-slate-800"
                    }`}
                  >
                    {field.value}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* ── Read-only Notice ── */}
      <motion.div
        variants={fade}
        className={`flex items-center gap-2.5 rounded-xl px-4 py-3 ${
          isDark
            ? "bg-slate-900/20 text-slate-500"
            : "bg-slate-100/60 text-slate-400"
        }`}
      >
        <Info size={14} className="shrink-0" />
        <p className="text-[11px] leading-relaxed">
          Profile details are read-only. Contact support for changes.
        </p>
      </motion.div>
    </motion.div>
  )
}
