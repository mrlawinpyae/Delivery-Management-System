import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "@/lib/axios"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowLeft, User as UserIcon, Phone, CheckCircle2, X } from "lucide-react"
import { toast } from "sonner"

export default function AdminAssignRiderPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [rider, setRider] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isAssigning, setIsAssigning] = useState(false)

  const handleAssignRider = async () => {
    if (!rider) return
    setIsAssigning(true)
    try {
      await axios.put(`/orders/${id}/assign/${rider.riderId || rider.id}`)
      toast.success("Rider assigned! Order is now OUT FOR DELIVERY.")
      navigate("/admin")
    } catch (err) {
      console.error("Error assigning rider:", err)
      toast.error("Failed to assign rider to the order.")
    } finally {
      setIsAssigning(false)
    }
  }

  useEffect(() => {
    const findNearestRider = async () => {
      try {
        setLoading(true)
        const response = await axios.get(`/orders/${id}/nearest-rider`)
        setRider(response.data.data)
      } catch (err) {
        console.error("Error finding rider:", err)
        setError("Failed to find nearest rider.")
      } finally {
        setLoading(false)
      }
    }
    findNearestRider()
  }, [id])

  return (
    <div className="mx-auto max-w-4xl space-y-7 pb-12">
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
            Assign Rider for Order #{id?.slice(0, 8)}
          </h1>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-12 min-h-[500px] flex flex-col items-center justify-center">
        {loading ? (
          <div className="flex flex-col items-center text-center space-y-10">
            <div className="relative flex items-center justify-center h-48 w-48">
              {/* Radar waves effect */}
              <motion.div
                animate={{ scale: [1, 2, 3], opacity: [0.8, 0.4, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0 }}
                className="absolute inset-0 rounded-full border-2 border-indigo-500"
              />
              <motion.div
                animate={{ scale: [1, 2, 3], opacity: [0.8, 0.4, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.6 }}
                className="absolute inset-0 rounded-full border-2 border-indigo-500"
              />
              <motion.div
                animate={{ scale: [1, 2, 3], opacity: [0.8, 0.4, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 1.2 }}
                className="absolute inset-0 rounded-full border-2 border-indigo-500"
              />
              
              {/* Center icon */}
              <motion.div 
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-600 shadow-[0_0_20px_rgba(79,70,229,0.5)]"
              >
                <UserIcon className="h-10 w-10 text-white" />
              </motion.div>
            </div>
            
            <div className="space-y-3 max-w-sm">
              <motion.h2 
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="text-2xl font-black tracking-tight text-slate-900"
              >
                Searching for the nearest rider...
              </motion.h2>
              <p className="text-sm font-medium text-slate-500">
                Please wait while we locate the best match in your area.
              </p>
            </div>
          </div>
        ) : error ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center space-y-4 max-w-sm"
          >
            <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center mb-2">
              <X className="h-10 w-10 text-red-600 stroke-[3px]" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">Search Failed</h2>
            <p className="text-slate-500 font-medium text-sm">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4 rounded-full px-8 h-12 font-bold shadow-md hover:shadow-lg transition-all">Try Again</Button>
          </motion.div>
        ) : rider ? (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="flex flex-col items-center text-center w-full max-w-md"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring" }}
              className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100 ring-8 ring-green-50"
            >
              <CheckCircle2 className="h-12 w-12 text-green-600 stroke-[2.5px]" />
            </motion.div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 mb-2">Nearest Rider Found!</h2>
            <p className="text-sm font-medium text-slate-500">We've located the closest available rider.</p>
            
            <div className="w-full mt-8 rounded-2xl border border-slate-200 bg-slate-50/50 p-6 text-left space-y-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
                  <UserIcon className="h-6 w-6 text-slate-700" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">Rider Name</p>
                  <p className="text-lg font-black text-slate-900 truncate">{rider.name}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
                  <Phone className="h-6 w-6 text-slate-700" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">Contact</p>
                  <p className="text-lg font-black text-slate-900 truncate">{rider.phone}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-5 mt-2 border-t border-slate-200">
                <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">Current Status</span>
                <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-black tracking-wide text-green-800 uppercase shadow-sm">
                  {rider.status}
                </span>
              </div>
            </div>

            <Button 
              className="w-full mt-8 rounded-full h-14 text-base font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-lg hover:shadow-xl transition-all"
              onClick={handleAssignRider}
              disabled={isAssigning}
            >
              {isAssigning ? "Assigning..." : "Assign to Order"}
            </Button>
          </motion.div>
        ) : null}
      </div>
    </div>
  )
}
