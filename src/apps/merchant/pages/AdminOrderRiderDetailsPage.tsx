import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "@/lib/axios"
import { motion } from "framer-motion"
import type { Variants } from "framer-motion"
import {
  User,
  Mail,
  Phone,
  Bike,
  ShieldCheck,
  Loader2,
  ArrowLeft,
  Info,
  IdCard
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { MyanmarNrcInput, formatNrcDisplay } from "@/components/ui/myanmar-nrc-input"
import { getImageUrl } from "@/lib/utils"

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}
const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
}

interface RiderProfileData {
  riderId?: string
  name: string
  image?: string
  phone: string
  email?: string
  status?: string
  nrc?: string
  nrcNumber?: string
}

export default function AdminOrderRiderDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [rider, setRider] = useState<RiderProfileData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    const fetchOrderDetails = async () => {
      try {
        setLoading(true)
        const response = await axios.get(`/orders/admin/order-details/${id}`)
        if (isMounted && response.data && response.data.data) {
          const orderDetails = response.data.data
          // Some backends nest it under `rider`, others under `riderId` and fetch separately.
          // Assuming `rider` object is included in orderDetails.
          if (orderDetails.rider) {
            setRider(orderDetails.rider)
          } else {
            toast.error("Rider information not found in this order.")
          }
        }
      } catch (error) {
        console.error("Error fetching order details:", error)
        toast.error("Failed to load rider details")
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    
    if (id) {
      fetchOrderDetails()
    }
    
    return () => {
      isMounted = false
    }
  }, [id])

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  if (!rider) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4 text-center">
        <p className="text-sm font-semibold text-slate-500">
          Rider information not found for this order.
        </p>
        <Button onClick={() => navigate(`/admin/orders/${id}`)}>Back to Order Details</Button>
      </div>
    )
  }

  const infoFields = [
    { icon: User, label: "Full Name", value: rider.name || "N/A" },
    { icon: Phone, label: "Phone Number", value: rider.phone || "N/A" },
    ...(rider.email ? [{ icon: Mail, label: "Email Address", value: rider.email }] : []),
    { 
      icon: IdCard, 
      label: "NRC", 
      value: rider.nrc || rider.nrcNumber ? formatNrcDisplay(rider.nrc || rider.nrcNumber || "") : "N/A"
    },
  ]

  const hasProfileImage = rider.image && rider.image !== "fdsf" && rider.image.trim() !== ""

  return (
    <div className="mx-auto max-w-xl space-y-7 pb-12">
      {/* ── Page Header ── */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(`/admin/orders/${id}`)}
          className="h-10 w-10 shrink-0 rounded-full border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-sm cursor-pointer"
        >
          <ArrowLeft size={18} />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 break-all">
            Assigned Rider Info
          </h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            For Order #{id?.slice(0, 8)}
          </p>
        </div>
      </div>

      <motion.div
        className="mx-auto max-w-md space-y-5"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {/* ── Profile Hero Card ── */}
        <motion.div
          variants={fade}
          className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-lg shadow-slate-200/50"
        >
          {/* ── Banner ── */}
          <div
            className="relative h-32"
            style={{
              background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 40%, #312e81 100%)",
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
          </div>

          {/* ── Avatar & Identity ── */}
          <div className="relative px-6 pb-6">
            {/* Avatar — pulled up over the banner */}
            <div className="-mt-12 mb-4 flex justify-center">
              <div className="relative">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-lg shadow-slate-300/40">
                  {hasProfileImage ? (
                    <img
                      src={getImageUrl(rider.image)}
                      alt={rider.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User
                      size={40}
                      strokeWidth={1.5}
                      className="text-slate-400"
                    />
                  )}
                </div>
                {/* Verified badge */}
                <span className="absolute right-0.5 bottom-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-emerald-500 shadow-sm">
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
              <h1 className="text-lg font-bold tracking-tight text-slate-900">
                {rider.name}
              </h1>
              <div className="mt-2 flex justify-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-semibold tracking-wide text-indigo-600 uppercase">
                  <Bike size={11} />
                  Rider
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-semibold tracking-wide text-emerald-600 uppercase">
                  <ShieldCheck size={11} />
                  Verified
                </span>
                {rider.status && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-[10px] font-semibold tracking-wide text-amber-600 uppercase">
                    <Info size={11} />
                    {rider.status}
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Info Card ── */}
        <motion.div
          variants={fade}
          className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm"
        >
          <div className="border-b border-slate-100 px-5 py-3 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            Rider Information
          </div>

          <div className="divide-y divide-slate-100">
            {infoFields.map((field, idx) => {
              const Icon = field.icon
              return (
                <div
                  key={field.label}
                  className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-slate-50/80"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                    <Icon size={16} strokeWidth={1.8} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium text-slate-400">
                      {field.label}
                    </p>
                    <div className="mt-0.5 truncate text-[13px] font-semibold text-slate-800">
                      {field.value}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
