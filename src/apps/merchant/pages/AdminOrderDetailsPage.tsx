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
  CreditCard,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { getImageUrl } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import restLogo from "../../../imgs/resturant_logo.jpg"
// Google Maps
import { GoogleMap, useLoadScript, OverlayView } from "@react-google-maps/api"

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
        <p className="text-sm font-semibold text-slate-500">
          Loading order details...
        </p>
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

  const isFinalState =
    orderDetails.status === "CANCELLED" || orderDetails.status === "DELIVERED"

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
          className="h-10 w-10 shrink-0 cursor-pointer rounded-full border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900"
        >
          <ArrowLeft size={18} />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-black tracking-tight break-all text-slate-900 sm:text-2xl">
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
            <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <UserIcon size={18} className="text-indigo-500" />
              Customer Information
            </h3>
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5">
              <div className="flex flex-col justify-between gap-4 sm:flex-row">
                <div>
                  <p className="text-xs font-medium text-slate-500">Name</p>
                  <p className="text-sm font-bold text-slate-900">
                    {orderDetails.customer?.name || "Unknown Customer"}
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="text-xs font-medium text-slate-500">Phone</p>
                  <p className="flex items-center gap-1.5 text-sm font-bold text-slate-900 sm:justify-end">
                    <Phone size={14} className="text-slate-400" />
                    {orderDetails.customer?.phone || "N/A"}
                  </p>
                </div>
              </div>
              {(orderDetails.latitude || orderDetails.customer?.latitude) &&
              (orderDetails.longitude || orderDetails.customer?.longitude) ? (
                <div className="mt-5 border-t border-slate-200 pt-5">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <MapPin size={14} className="text-slate-400" /> Location Map
                  </p>
                  <div className="relative isolate z-0 h-64 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                    {!isLoaded ? (
                      <div className="flex h-full w-full items-center justify-center bg-zinc-50">
                        <Loader2
                          className="animate-spin text-zinc-400"
                          size={24}
                        />
                      </div>
                    ) : (
                      <GoogleMap
                        mapContainerStyle={MAP_CONTAINER_STYLE}
                        center={{
                          lat:
                            orderDetails.latitude ||
                            orderDetails.customer?.latitude,
                          lng:
                            orderDetails.longitude ||
                            orderDetails.customer?.longitude,
                        }}
                        zoom={16}
                        options={MAP_OPTIONS}
                      >
                        <OverlayView
                          position={{
                            lat:
                              orderDetails.latitude ||
                              orderDetails.customer?.latitude,
                            lng:
                              orderDetails.longitude ||
                              orderDetails.customer?.longitude,
                          }}
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
                <div className="mt-5 border-t border-slate-200 pt-5">
                  <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <MapPin size={14} className="text-slate-400" /> Delivery
                    Address
                  </p>
                  <p className="text-sm font-bold text-slate-900">
                    {orderDetails.deliveryAddress}
                  </p>
                </div>
              ) : null}
              {orderDetails.paymentImg && (
                <div className="mt-5 border-t border-slate-200 pt-5">
                  <p className="mb-3 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <CreditCard size={14} className="text-slate-400" /> KPay
                    Screenshot
                  </p>
                  <a
                    href={getImageUrl(orderDetails.paymentImg)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block"
                  >
                    <img
                      src={getImageUrl(orderDetails.paymentImg)}
                      alt="KPay Screenshot"
                      className="h-20 w-20 rounded-xl border border-slate-200 object-cover shadow-sm transition-opacity hover:opacity-90"
                    />
                  </a>
                </div>
              )}
            </div>
          </div>

          <Separator className="bg-slate-100" />

          {/* Order Items Section */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <ShoppingBag size={18} className="text-amber-500" />
              Order Items
            </h3>
            <div className="space-y-3">
              {(
                orderDetails.items || orderDetails.restaurants?.[0]?.items
              )?.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-3 shadow-xs transition-colors hover:border-slate-200"
                >
                  {item.image ? (
                    <img
                      src={getImageUrl(item.image)}
                      alt={item.name}
                      className="h-14 w-14 rounded-lg border border-slate-100 object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-slate-100 bg-slate-50">
                      <ShoppingBag size={18} className="text-slate-300" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900">
                      {item.name}
                    </p>
                    <p className="text-xs font-medium text-slate-500">
                      Qty: {item.quantity} × {item.price?.toLocaleString()} MMK
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">
                      {(
                        item.quantity * (item.priceAtPurchase || item.price)
                      ).toLocaleString()}{" "}
                      MMK
                    </p>
                  </div>
                </div>
              ))}
              {!orderDetails.items?.length &&
                !orderDetails.restaurants?.[0]?.items?.length && (
                <p className="text-sm font-medium text-slate-500 italic">
                  No items in this order
                </p>
              )}
            </div>
          </div>

          <Separator className="bg-slate-100" />

          {/* Restaurant Section */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Store size={18} className="text-emerald-500" />
              Restaurant Information
            </h3>
            <div className="space-y-3">
              {(
                orderDetails.restaurants ||
                (orderDetails.restaurant ? [orderDetails.restaurant] : [])
              ).map((restaurant: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:gap-5 sm:p-5"
                >
                  <img
                    src={restaurant.image ? getImageUrl(restaurant.image) : restLogo}
                    alt={restaurant.name}
                    className="h-12 w-12 shrink-0 rounded-full border-2 border-white object-cover shadow-sm sm:h-16 sm:w-16"
                  />

                  <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-bold text-slate-900">
                        {restaurant.name || "Unknown Restaurant"}
                      </p>
                    </div>
                    <div className="flex w-fit max-w-full shrink-0 items-center gap-1.5 rounded-lg border border-indigo-100 bg-indigo-50 px-2 py-1 sm:gap-2 sm:px-3 sm:py-1.5">
                      <Phone className="h-3 w-3 shrink-0 text-indigo-600 sm:h-[14px] sm:w-[14px]" />
                      <span className="text-[11px] font-bold tracking-wide whitespace-nowrap text-indigo-700 sm:text-sm">
                        {restaurant.phone || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {!orderDetails.restaurants && !orderDetails.restaurant && (
                <p className="px-2 text-sm text-slate-500 italic">
                  No restaurant information found.
                </p>
              )}
            </div>
          </div>

          {/* Footer Section */}
          <div className="mt-8 flex flex-col items-center gap-6 border-t border-slate-200 pt-8 text-center sm:flex-row sm:justify-between sm:text-left">
            <div>
              <p className="mb-1 text-sm font-bold tracking-wider text-slate-500 uppercase">
                Total Amount
              </p>
              <p className="text-3xl font-black text-indigo-700">
                {orderDetails.totalAmount?.toLocaleString()} Ks
              </p>
            </div>
            <div className="flex w-full flex-col items-center gap-2 sm:w-auto sm:items-end sm:gap-3">
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                {orderDetails.status === "PREPARING" ? (
                  <Button
                    size="lg"
                    className="w-full cursor-pointer rounded-full bg-indigo-600 px-8 font-bold text-white shadow-md hover:bg-indigo-700 sm:w-auto"
                    onClick={() => navigate(`/admin/orders/${id}/assign-rider`)}
                  >
                    Find nearest rider
                  </Button>
                ) : orderDetails.status === "OUT_FOR_DELIVERY" ||
                  orderDetails.status === "OUT FOR DELIVERY" ? (
                  <Button
                    size="lg"
                    className="w-full cursor-pointer rounded-full bg-indigo-600 px-8 font-bold text-white shadow-md hover:bg-indigo-700 sm:w-auto"
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
                      className="w-full cursor-pointer rounded-full border-red-200 px-8 font-bold text-red-600 hover:bg-red-50 hover:text-red-700 disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400 disabled:opacity-50 sm:w-auto"
                      onClick={() => setIsCancelDialogOpen(true)}
                    >
                      Cancel Order
                    </Button>
                    <Button
                      size="lg"
                      disabled={isFinalState}
                      className="w-full cursor-pointer rounded-full bg-indigo-600 px-8 font-bold text-white shadow-md hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-100 disabled:opacity-50 disabled:shadow-none sm:w-auto"
                      onClick={() => setIsConfirmDialogOpen(true)}
                    >
                      Confirm Order
                    </Button>
                  </>
                )}
              </div>
              {isFinalState && (
                <div className="mt-2 flex items-center justify-center gap-1.5 text-slate-400 sm:mt-1">
                  <Info size={12} strokeWidth={3} className="text-slate-300" />
                  <span className="text-[10px] font-bold tracking-widest uppercase">
                    This order is in a final state
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Cancel Confirmation Dialog ── */}
      <AnimatePresence>
        {isCancelDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 px-4 backdrop-blur-sm">
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
                <h3 className="mb-3 text-lg font-normal text-slate-800">
                  Verification
                </h3>
                <p className="mb-8 max-w-[220px] text-[10px] leading-relaxed font-bold tracking-widest text-slate-400 uppercase">
                  Confirming order as cancelled. This process cannot be
                  reversed.
                </p>
                <div className="flex w-full gap-3">
                  <Button
                    variant="outline"
                    className="h-11 flex-1 rounded-full border-slate-200 bg-white text-[11px] font-bold tracking-widest text-slate-900 hover:bg-slate-50"
                    onClick={() => setIsCancelDialogOpen(false)}
                    disabled={isCancelling}
                  >
                    DISMISS
                  </Button>
                  <Button
                    className="h-11 flex-1 rounded-full bg-[#e33535] text-[11px] font-bold tracking-widest text-white shadow-[0_8px_20px_-6px_rgba(227,53,53,0.5)] hover:bg-[#c92d2d]"
                    onClick={handleCancelOrder}
                    disabled={isCancelling}
                  >
                    {isCancelling ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "YES. APPLY"
                    )}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 px-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-[340px] overflow-hidden rounded-[2rem] bg-white p-8 shadow-2xl"
            >
              <div className="flex flex-col items-center text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
                  <CheckCircle2
                    className="h-7 w-7 text-green-500"
                    strokeWidth={2.5}
                  />
                </div>
                <h3 className="mb-3 text-lg font-normal text-slate-800">
                  Verification
                </h3>
                <p className="mb-8 max-w-[220px] text-[10px] leading-relaxed font-bold tracking-widest text-slate-400 uppercase">
                  Confirming order as completed. This process cannot be
                  reversed.
                </p>
                <div className="flex w-full gap-3">
                  <Button
                    variant="outline"
                    className="h-11 flex-1 rounded-full border-slate-200 bg-white text-[11px] font-bold tracking-widest text-slate-900 hover:bg-slate-50"
                    onClick={() => setIsConfirmDialogOpen(false)}
                    disabled={isConfirming}
                  >
                    DISMISS
                  </Button>
                  <Button
                    className="h-11 flex-1 rounded-full bg-black text-[11px] font-bold tracking-widest text-white shadow-[0_8px_20px_-6px_rgba(0,0,0,0.5)] hover:bg-zinc-800"
                    onClick={handleConfirmOrder}
                    disabled={isConfirming}
                  >
                    {isConfirming ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "YES. APPLY"
                    )}
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
