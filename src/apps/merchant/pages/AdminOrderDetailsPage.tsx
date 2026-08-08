import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "@/lib/axios"
import {
  ShoppingBag,
  RefreshCw,
  MapPin,
  Phone,
  User as UserIcon,
  Store,
  ArrowLeft,
  Info,
  CheckCircle2,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2 } from "lucide-react"

// Google Maps
import {
  GoogleMap,
  useLoadScript,
  OverlayView,
} from "@react-google-maps/api"

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string

// Magway area bounds
const MAGWAY_BOUNDS = {
  south: 20.085,
  west: 94.885,
  north: 20.235,
  east: 95.04,
}

const MAP_CONTAINER_STYLE = { width: "100%", height: "100%" }

const MAP_OPTIONS: google.maps.MapOptions = {
  restriction: {
    latLngBounds: MAGWAY_BOUNDS,
    strictBounds: true,
  },
  minZoom: 13,
  disableDefaultUI: true,
  zoomControl: true,
  gestureHandling: "greedy",
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
}

// Pulsing cyan dot overlay for the delivery marker
function PulsingDot() {
  return (
    <div style={{ position: "relative", width: 24, height: 24 }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: "rgba(6,182,212,0.25)",
          animation: "ping 1.4s cubic-bezier(0,0,0.2,1) infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 4,
          borderRadius: "50%",
          background: "#06b6d4",
          border: "2.5px solid white",
          boxShadow: "0 0 0 2px rgba(6,182,212,0.5)",
        }}
      />
      <style>{`@keyframes ping{75%,100%{transform:scale(2);opacity:0;}}`}</style>
    </div>
  )
}

export default function AdminOrderDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [orderDetails, setOrderDetails] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)

  const handleCancelOrder = async () => {
    setIsCancelling(true)
    try {
      await axios.put(`/orders/${id}/admin-reject`)
      setOrderDetails((prev: any) => ({ ...prev, status: "CANCELLED" }))
      toast.success("Order cancelled successfully")
      setIsCancelDialogOpen(false)
    } catch (error) {
      console.error("Error cancelling order:", error)
      toast.error("Failed to cancel order")
    } finally {
      setIsCancelling(false)
    }
  }

  const handleConfirmOrder = async () => {
    setIsConfirming(true)
    try {
      await axios.put(`/orders/${id}/admin-accept`)
      setOrderDetails((prev: any) => ({ ...prev, status: "PREPARING" }))
      toast.success("Order status changed to PREPARING")
      setIsConfirmDialogOpen(false)
      navigate(`/admin/orders/${id}/assign-rider`)
    } catch (error) {
      console.error("Error confirming order:", error)
      toast.error("Failed to confirm order")
    } finally {
      setIsConfirming(false)
    }
  }

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    language: "my",
    region: "MM",
  })

  useEffect(() => {
    const fetchOrderDetails = async () => {
      setLoading(true)
      try {
        const response = await axios.get(`/orders/admin/order-details/${id}`)
        setOrderDetails(response.data.data || null)
      } catch (error) {
        console.error("Error fetching order details:", error)
        toast.error("Failed to fetch order details")
        setOrderDetails(null)
      } finally {
        setLoading(false)
      }
    }
    
    if (id) {
      fetchOrderDetails()
    }
  }, [id])

  if (loading) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center space-y-4">
        <RefreshCw className="h-10 w-10 animate-spin text-indigo-500" />
        <p className="text-sm font-semibold text-slate-500">Loading order details...</p>
      </div>
    )
  }

  if (!orderDetails) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center space-y-4">
        <p className="text-sm font-semibold text-slate-500">Order not found.</p>
        <Button onClick={() => navigate("/admin")}>Back to Orders</Button>
      </div>
    )
  }

  const isFinalState = orderDetails.status === "CANCELLED" || orderDetails.status === "DELIVERED"

  return (
    <div className="mx-auto max-w-4xl space-y-7 pb-12">
      {/* ── Page Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex items-center gap-4"
      >
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/admin")}
          className="h-10 w-10 shrink-0 rounded-full border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-sm cursor-pointer"
        >
          <ArrowLeft size={18} />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 break-all">
            Order #{orderDetails.orderId}
          </h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Detailed information and actions for this order
          </p>
        </div>
      </motion.div>

      {/* ── Details Content ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8"
      >
        <div className="space-y-8">
          
          {/* Customer Info Section */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserIcon size={18} className="text-indigo-500" />
              Customer Information
            </h3>
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-500 font-medium">Name</p>
                  <p className="text-sm font-bold text-slate-900">{orderDetails.customer?.name || "Unknown Customer"}</p>
                </div>
                <div className="sm:text-right">
                  <p className="text-xs text-slate-500 font-medium">Phone</p>
                  <p className="text-sm font-bold text-slate-900 flex items-center sm:justify-end gap-1.5">
                    <Phone size={14} className="text-slate-400" />
                    {orderDetails.customer?.phone || "N/A"}
                  </p>
                </div>
              </div>
              {(orderDetails.latitude || orderDetails.customer?.latitude) && (orderDetails.longitude || orderDetails.customer?.longitude) ? (
                <div className="mt-5 pt-5 border-t border-slate-200">
                  <p className="text-xs text-slate-500 font-medium mb-2 flex items-center gap-1.5">
                    <MapPin size={14} className="text-slate-400" /> Location Map
                  </p>
                  <div className="relative isolate z-0 h-64 w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                    {!isLoaded ? (
                      <div className="flex h-full w-full items-center justify-center bg-zinc-50">
                        <Loader2 className="animate-spin text-zinc-400" size={24} />
                      </div>
                    ) : (
                      <GoogleMap
                        mapContainerStyle={MAP_CONTAINER_STYLE}
                        center={{ lat: orderDetails.latitude || orderDetails.customer?.latitude, lng: orderDetails.longitude || orderDetails.customer?.longitude }}
                        zoom={16}
                        options={MAP_OPTIONS}
                      >
                        <OverlayView
                          position={{ lat: orderDetails.latitude || orderDetails.customer?.latitude, lng: orderDetails.longitude || orderDetails.customer?.longitude }}
                          mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                          getPixelPositionOffset={(width, height) => ({
                            x: -(width / 2),
                            y: -(height / 2),
                          })}
                        >
                          <PulsingDot />
                        </OverlayView>
                      </GoogleMap>
                    )}
                  </div>
                </div>
              ) : orderDetails.deliveryAddress ? (
                <div className="mt-5 pt-5 border-t border-slate-200">
                  <p className="text-xs text-slate-500 font-medium mb-1 flex items-center gap-1.5">
                    <MapPin size={14} className="text-slate-400" /> Delivery Address
                  </p>
                  <p className="text-sm font-bold text-slate-900">{orderDetails.deliveryAddress}</p>
                </div>
              ) : null}
            </div>
          </div>

          <Separator className="bg-slate-100" />

          {/* Order Items Section */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShoppingBag size={18} className="text-amber-500" />
              Order Items
            </h3>
            <div className="space-y-3">
              {(orderDetails.items || orderDetails.restaurants?.[0]?.items)?.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 bg-white shadow-xs hover:border-slate-200 transition-colors">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="h-14 w-14 rounded-lg object-cover border border-slate-100" />
                  ) : (
                    <div className="h-14 w-14 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
                      <ShoppingBag size={18} className="text-slate-300" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900">{item.name}</p>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-black text-slate-900">
                      {item.priceAtPurchase?.toLocaleString() || (item.price * item.quantity)?.toLocaleString()} Ks
                    </p>
                  </div>
                </div>
              ))}
              {(!(orderDetails.items || orderDetails.restaurants?.[0]?.items) || (orderDetails.items || orderDetails.restaurants?.[0]?.items).length === 0) && (
                <p className="text-sm text-slate-500 italic px-2">No items found.</p>
              )}
            </div>
          </div>

          <Separator className="bg-slate-100" />

          {/* Restaurant Section */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Store size={18} className="text-emerald-500" />
              Restaurant Information
            </h3>
            <div className="flex items-center gap-3 sm:gap-5 rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5">
                {(orderDetails.restaurant?.image || orderDetails.restaurants?.[0]?.image) ? (
                  <img src={orderDetails.restaurant?.image || orderDetails.restaurants?.[0]?.image} alt={orderDetails.restaurant?.name || orderDetails.restaurants?.[0]?.name} className="h-12 w-12 sm:h-16 sm:w-16 shrink-0 rounded-full object-cover border-2 border-white shadow-sm" />
                ) : (
                  <div className="h-12 w-12 sm:h-16 sm:w-16 shrink-0 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                    <Store className="h-5 w-5 sm:h-6 sm:w-6 text-slate-300" />
                  </div>
                )}
                <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
                  <div className="min-w-0">
                    <p className="text-base font-bold text-slate-900 truncate">{orderDetails.restaurant?.name || orderDetails.restaurants?.[0]?.name || "Unknown Restaurant"}</p>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 bg-indigo-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-indigo-100 shrink-0 w-fit max-w-full">
                    <Phone className="h-3 w-3 sm:h-[14px] sm:w-[14px] text-indigo-600 shrink-0" />
                    <span className="text-[11px] sm:text-sm font-bold text-indigo-700 tracking-wide whitespace-nowrap">
                      {orderDetails.restaurant?.phone || orderDetails.restaurants?.[0]?.phone || "N/A"}
                    </span>
                  </div>
                </div>
            </div>
          </div>

          {/* Footer Section */}
          <div className="pt-8 mt-8 border-t border-slate-200 flex flex-col items-center sm:flex-row sm:justify-between gap-6 text-center sm:text-left">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Total Amount</p>
              <p className="text-3xl font-black text-indigo-700">{orderDetails.totalAmount?.toLocaleString()} Ks</p>
            </div>
            <div className="flex flex-col items-center sm:items-end w-full sm:w-auto gap-2 sm:gap-3">
              <div className="flex flex-col w-full sm:flex-row sm:w-auto gap-3">
                {orderDetails.status === "PREPARING" ? (
                  <Button 
                    size="lg"
                    className="w-full sm:w-auto rounded-full bg-indigo-600 text-white hover:bg-indigo-700 shadow-md font-bold px-8 cursor-pointer"
                    onClick={() => navigate(`/admin/orders/${id}/assign-rider`)}
                  >
                    Find nearest rider
                  </Button>
                ) : orderDetails.status === "OUT_FOR_DELIVERY" || orderDetails.status === "OUT FOR DELIVERY" ? (
                  <Button 
                    size="lg"
                    className="w-full sm:w-auto rounded-full bg-indigo-600 text-white hover:bg-indigo-700 shadow-md font-bold px-8 cursor-pointer"
                    onClick={() => navigate(`/admin/orders/${id}/rider-info`)}
                  >
                    View Rider Info
                  </Button>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      size="lg"
                      disabled={isFinalState}
                      className="w-full sm:w-auto rounded-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold px-8 disabled:opacity-50 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-200 cursor-pointer"
                      onClick={() => setIsCancelDialogOpen(true)}
                    >
                      Cancel Order
                    </Button>
                    <Button 
                      size="lg"
                      disabled={isFinalState}
                      className="w-full sm:w-auto rounded-full bg-indigo-600 text-white hover:bg-indigo-700 shadow-md font-bold px-8 disabled:opacity-50 disabled:bg-slate-300 disabled:text-slate-100 disabled:shadow-none cursor-pointer"
                      onClick={() => setIsConfirmDialogOpen(true)}
                    >
                      Confirm Order
                    </Button>
                  </>
                )}
              </div>
              {isFinalState && (
                <div className="flex items-center justify-center gap-1.5 mt-2 sm:mt-1 text-slate-400">
                  <Info size={12} strokeWidth={3} className="text-slate-300" />
                  <span className="text-[10px] font-bold tracking-widest uppercase">This order is in a final state</span>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </motion.div>

      {/* ── Cancel Confirmation Dialog ── */}
      <AnimatePresence>
        {isCancelDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-[340px] overflow-hidden rounded-[2rem] bg-white p-8 shadow-2xl"
            >
              <div className="flex flex-col items-center text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                  <X className="h-7 w-7 text-red-600" strokeWidth={2.5} />
                </div>
                <h3 className="mb-3 text-lg font-normal text-slate-800">Verification</h3>
                <p className="mb-8 text-[10px] font-bold leading-relaxed tracking-widest text-slate-400 uppercase max-w-[220px]">
                  Confirming order as cancelled. This process cannot be reversed.
                </p>
                <div className="flex w-full gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-full border-slate-200 bg-white text-[11px] font-bold tracking-widest text-slate-900 hover:bg-slate-50 h-11"
                    onClick={() => setIsCancelDialogOpen(false)}
                    disabled={isCancelling}
                  >
                    DISMISS
                  </Button>
                  <Button
                    className="flex-1 rounded-full bg-[#e33535] text-[11px] font-bold tracking-widest text-white hover:bg-[#c92d2d] shadow-[0_8px_20px_-6px_rgba(227,53,53,0.5)] h-11"
                    onClick={handleCancelOrder}
                    disabled={isCancelling}
                  >
                    {isCancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : "YES. APPLY"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Confirm Order Dialog ── */}
      <AnimatePresence>
        {isConfirmDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-[340px] overflow-hidden rounded-[2rem] bg-white p-8 shadow-2xl"
            >
              <div className="flex flex-col items-center text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
                  <CheckCircle2 className="h-7 w-7 text-green-500" strokeWidth={2.5} />
                </div>
                <h3 className="mb-3 text-lg font-normal text-slate-800">Verification</h3>
                <p className="mb-8 text-[10px] font-bold leading-relaxed tracking-widest text-slate-400 uppercase max-w-[220px]">
                  Confirming order as completed. This process cannot be reversed.
                </p>
                <div className="flex w-full gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-full border-slate-200 bg-white text-[11px] font-bold tracking-widest text-slate-900 hover:bg-slate-50 h-11"
                    onClick={() => setIsConfirmDialogOpen(false)}
                    disabled={isConfirming}
                  >
                    DISMISS
                  </Button>
                  <Button
                    className="flex-1 rounded-full bg-black text-[11px] font-bold tracking-widest text-white hover:bg-zinc-800 shadow-[0_8px_20px_-6px_rgba(0,0,0,0.5)] h-11"
                    onClick={handleConfirmOrder}
                    disabled={isConfirming}
                  >
                    {isConfirming ? <Loader2 className="h-4 w-4 animate-spin" /> : "YES. APPLY"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
