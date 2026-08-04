import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  ShoppingBag,
  RefreshCw,
  MapPin,
  Phone,
  User as UserIcon,
  Store,
  ArrowLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { motion } from "framer-motion"
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

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    language: "my",
    region: "MM",
  })

  useEffect(() => {
    // Simulate API call with fake data since backend isn't ready
    setLoading(true)
    const loadFakeData = () => {
      setTimeout(() => {
        setOrderDetails({
          orderId: id,
          status: "PENDING",
          totalAmount: 35000,
          latitude: 20.1489,
          longitude: 94.9211,
          deliveryAddress: "No 123, Bogyoke Road, Magway",
          customer: {
            name: "John Doe",
            phone: "+95 9 123 456 789"
          },
          restaurant: {
            name: "Spicy House",
            phone: "+95 9 987 654 321",
            image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&q=80"
          },
          items: [
            {
              name: "Spicy Chicken Noodle",
              quantity: 2,
              priceAtPurchase: 15000,
              image: "https://images.unsplash.com/photo-1552611052-33e04de081de?w=500&q=80"
            },
            {
              name: "Thai Milk Tea",
              quantity: 1,
              priceAtPurchase: 5000,
              image: "https://images.unsplash.com/photo-1556881286-fc6915169721?w=500&q=80"
            }
          ]
        })
        setLoading(false)
      }, 600)
    }
    
    loadFakeData()
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
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
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
              {orderDetails.latitude && orderDetails.longitude ? (
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
                        center={{ lat: orderDetails.latitude, lng: orderDetails.longitude }}
                        zoom={16}
                        options={MAP_OPTIONS}
                      >
                        <OverlayView
                          position={{ lat: orderDetails.latitude, lng: orderDetails.longitude }}
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
              {orderDetails.items?.map((item: any, idx: number) => (
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
              {(!orderDetails.items || orderDetails.items.length === 0) && (
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
            <div className="flex items-center gap-5 rounded-xl border border-slate-200 bg-slate-50/50 p-5">
                {orderDetails.restaurant?.image ? (
                  <img src={orderDetails.restaurant.image} alt={orderDetails.restaurant.name} className="h-16 w-16 rounded-full object-cover border-2 border-white shadow-sm" />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                    <Store size={24} className="text-slate-300" />
                  </div>
                )}
                <div>
                  <p className="text-base font-bold text-slate-900">{orderDetails.restaurant?.name || "Unknown Restaurant"}</p>
                  <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5 mt-1">
                    <Phone size={14} className="text-slate-400" />
                    {orderDetails.restaurant?.phone || "N/A"}
                  </p>
                </div>
            </div>
          </div>

          {/* Footer Section */}
          <div className="pt-8 mt-8 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Total Amount</p>
              <p className="text-3xl font-black text-indigo-700">{orderDetails.totalAmount?.toLocaleString()} Ks</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button 
                variant="outline" 
                size="lg"
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold px-6"
                onClick={() => {
                  toast.success("Order cancelled successfully");
                  navigate("/admin");
                }}
              >
                Cancel Order
              </Button>
              <Button 
                size="lg"
                className="bg-indigo-600 text-white hover:bg-indigo-700 shadow-md font-bold px-6"
                onClick={() => {
                  toast.success("Order confirmed successfully");
                  navigate("/admin");
                }}
              >
                Confirm Order
              </Button>
            </div>
          </div>
          
        </div>
      </motion.div>
    </div>
  )
}
