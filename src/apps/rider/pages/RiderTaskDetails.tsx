import { useState, useEffect, useRef } from "react"
import axios from "axios"
import { useParams, useNavigate } from "react-router-dom"
import {
  Phone,
  MapPin,
  Store,
  ShoppingBag,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Navigation,
  CheckCircle,
  Compass,
  LocateFixed,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { useThemeStore } from "@/store/useThemeStore"

// Leaflet imports for map integration
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

// Marker icon fix
import icon from "leaflet/dist/images/marker-icon.png"
import iconShadow from "leaflet/dist/images/marker-shadow.png"

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})
L.Marker.prototype.options.icon = DefaultIcon

// Custom amber SVG icon for pickup locations
const PickupIcon = L.divIcon({
  className: "",
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.35)"/>
    </filter>
    <path filter="url(#shadow)" d="M16 2C9.37 2 4 7.37 4 14c0 9 12 26 12 26S28 23 28 14C28 7.37 22.63 2 16 2z" fill="#f59e0b" stroke="#d97706" stroke-width="1.5"/>
    <circle cx="16" cy="14" r="5" fill="white"/>
    <path d="M16 11.5v5M13.5 14h5" stroke="#d97706" stroke-width="1.8" stroke-linecap="round"/>
  </svg>`,
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -44],
})

// Custom cyan pulsing dot icon for rider's current position
const RiderIcon = L.divIcon({
  className: "",
  html: `<div style="position:relative;width:24px;height:24px;">
    <div style="position:absolute;inset:0;border-radius:50%;background:rgba(6,182,212,0.25);animation:ping 1.4s cubic-bezier(0,0,0.2,1) infinite;"></div>
    <div style="position:absolute;inset:4px;border-radius:50%;background:#06b6d4;border:2.5px solid white;box-shadow:0 0 0 2px rgba(6,182,212,0.5);"></div>
    <style>@keyframes ping{75%,100%{transform:scale(2);opacity:0;}}</style>
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -14],
})

// Types matching API contract
interface Customer {
  _id: string
  name: string
  image: string
}

interface PickupLocation {
  _id: string
  name: string
  address: string
  coordinates: [number, number] // [lng, lat]
}

interface OrderItem {
  itemId: string
  name: string
  image: string
  quantity: number
  priceAtPurchase: number
}

interface Order {
  _id: string
  status: "PENDING" | "PREPARING" | "OUT_FOR_DELIVERY" | "DELIVERED"
  totalAmount: number
  deliveryLocation: {
    address: string
    latitude: number
    longitude: number
  }
  shipping_phone: string
  createdAt: string
  customer: Customer
  pickupLocations: PickupLocation[]
  items: OrderItem[]
}

// Magway area bounds — matches DeliveryInfoPage scope
const MAGWAY_BOUNDS: [[number, number], [number, number]] = [
  [20.085, 94.885], // Southwest corner
  [20.235, 95.04],  // Northeast corner
]
const MAGWAY_MIN_ZOOM = 13

function isWithinMagwayBounds(lat: number, lng: number) {
  const [[south, west], [north, east]] = MAGWAY_BOUNDS
  return lat >= south && lat <= north && lng >= west && lng <= east
}

// Auto-fits the map to show all markers (including rider) with padding
function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap()
  const fittedRef = useRef(false)
  useEffect(() => {
    if (fittedRef.current || points.length < 2) return
    fittedRef.current = true
    const bounds = L.latLngBounds(points)
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 })
  }, [map, points])
  return null
}

// Captures the map instance so flyTo() can be called imperatively
function MapRefSetter({ mapRef }: { mapRef: React.MutableRefObject<L.Map | null> }) {
  const map = useMap()
  mapRef.current = map
  return null
}

export default function RiderTaskDetails() {
  const theme = useThemeStore((s) => s.theme)
  const isDark = theme === "dark"

  const { id } = useParams()
  const navigate = useNavigate()

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [riderPosition, setRiderPosition] = useState<[number, number] | null>(null)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [selectedPickupIdx, setSelectedPickupIdx] = useState<number | null>(null)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    let active = true
    const loadAssignedOrders = async () => {
      try {
        const res = await axios.get("/api/orders/ord_1003/getAssignedOrders")
        if (!active) return
        if (res.data && res.data.data) {
          const fetchedOrders = res.data.data as Order[]
          const targetOrder = fetchedOrders.find((o) => o._id === id) || null
          setOrder(targetOrder)
        }
      } catch (error) {
        console.error(error)
        toast.error("Failed to load task details")
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadAssignedOrders()
    return () => {
      active = false
    }
  }, [id])

  // Obtain rider's current geolocation — mirrors DeliveryInfoPage pattern
  const handleUseCurrentLocation = () => {
    setLocationError(null)
    if (!("geolocation" in navigator)) {
      setLocationError("Location services are not available on this device/browser.")
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setLocating(false)
        if (!isWithinMagwayBounds(latitude, longitude)) {
          setLocationError("Your current location is outside the delivery area (Magway). The map will still show order locations.")
          return
        }
        const coords: [number, number] = [latitude, longitude]
        setRiderPosition(coords)
        mapRef.current?.flyTo(coords, Math.max(mapRef.current.getZoom(), 15), { duration: 1 })
      },
      (err) => {
        setLocating(false)
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError("Location access was denied. Enable location permission in your browser settings.")
        } else {
          setLocationError("Couldn't determine your current location. Please try again.")
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  // Auto-request location on page load
  useEffect(() => {
    handleUseCurrentLocation()
  }, [])

  // Update order status
  const handleUpdateStatus = async (currentStatus: string) => {
    if (!order) return
    let nextStatus: "OUT_FOR_DELIVERY" | "DELIVERED"
    if (currentStatus === "PREPARING") {
      nextStatus = "OUT_FOR_DELIVERY"
    } else if (currentStatus === "OUT_FOR_DELIVERY") {
      nextStatus = "DELIVERED"
    } else {
      return
    }

    try {
      setUpdating(order._id)
      const res = await axios.put(`/api/orders/${order._id}/status`, { status: nextStatus })
      if (res.data) {
        const readableStatus = nextStatus === "OUT_FOR_DELIVERY" ? "Picked Up" : "Delivered"
        toast.success(`Order #${order._id.slice(-4)} marked as ${readableStatus}!`, {
          icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
        })
        
        setOrder({ ...order, status: nextStatus })

        if (nextStatus === "DELIVERED") {
             setTimeout(() => navigate("/rider"), 1500)
        }
      }
    } catch (error) {
      console.error(error)
      toast.error("Failed to update delivery status")
    } finally {
      setUpdating(null)
    }
  }

  if (loading) {
      return (
          <div className="flex justify-center items-center h-64">
             <Compass className="h-8 w-8 text-slate-500 animate-spin" />
          </div>
      )
  }

  if (!order) {
      return (
          <div className="flex flex-col items-center justify-center h-64 cursor-pointer">
             <Compass className="h-8 w-8 text-slate-500 mb-2" />
             <p className="text-slate-500">Order not found.</p>
             <button onClick={() => navigate("/rider")} className="mt-4 text-sky-500 underline ">Back to Tasks</button>
          </div>
      )
  }

  // Derive coordinates for the map — supports multiple pickup locations
  const getMapData = (o: Order) => {
    const dest: [number, number] = [
      o.deliveryLocation.latitude,
      o.deliveryLocation.longitude,
    ]

    // GeoJSON is [lng, lat], convert each to Leaflet's [lat, lng]
    const pickups: { name: string; position: [number, number] }[] = o.pickupLocations.map((p) => ({
      name: p.name,
      position: [p.coordinates[1], p.coordinates[0]] as [number, number],
    }))

    // Fallback if no pickup locations are provided
    if (pickups.length === 0) {
      pickups.push({ name: "Merchant", position: [20.1510, 94.9330] })
    }

    // All points for fitting bounds (rider position added later if available)
    const allPoints: [number, number][] = [...pickups.map((p) => p.position), dest]

    return { pickups, dest, allPoints }
  }

  const mapData = getMapData(order)
  // Center as midpoint of all points
  const mapCenter: [number, number] = [
    mapData.allPoints.reduce((sum, p) => sum + p[0], 0) / mapData.allPoints.length,
    mapData.allPoints.reduce((sum, p) => sum + p[1], 0) / mapData.allPoints.length,
  ]

  const statusColors = {
    PENDING: isDark ? "text-amber-400 bg-amber-400/10 border-amber-400/20" : "text-amber-700 bg-amber-50 border-amber-200",
    PREPARING: isDark ? "text-sky-400 bg-sky-400/10 border-sky-400/20" : "text-sky-700 bg-sky-50 border-sky-200",
    OUT_FOR_DELIVERY: isDark ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" : "text-emerald-700 bg-emerald-50 border-emerald-200",
    DELIVERED: isDark ? "text-slate-400 bg-slate-400/10 border-slate-400/20" : "text-slate-600 bg-slate-50 border-slate-200",
  }

  return (
    <div className="space-y-6">
        <div className="space-y-4">
          <button
            onClick={() => navigate("/rider")}
            className={`flex items-center gap-2 text-sm font-semibold transition-colors cursor-pointer ${
              isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tasks
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Route Visualization */}
            <div className="space-y-4">
              <div
                className={`overflow-hidden rounded-3xl border transition-all h-[500px] flex flex-col ${
                  isDark ? "border-slate-800 bg-slate-950/40" : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-700/10 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Navigation className={`h-5 w-5 ${isDark ? "text-cyan-400" : "text-sky-600"}`} />
                    <span className="text-sm font-bold uppercase tracking-wider">
                      Route Visualization
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Use Current Location — same pattern as DeliveryInfoPage */}
                    <button
                      onClick={handleUseCurrentLocation}
                      disabled={locating}
                      title="Use Current Location"
                      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-all active:scale-95 disabled:opacity-60 disabled:pointer-events-none ${
                        isDark
                          ? "border-slate-700 bg-slate-800 text-cyan-400 hover:bg-slate-700"
                          : "border-slate-200 bg-slate-50 text-sky-600 hover:bg-slate-100"
                      }`}
                    >
                      {locating
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <LocateFixed className="h-3.5 w-3.5" />}
                      {locating ? "Locating..." : "My Location"}
                    </button>
                    {order.status !== "PREPARING" && (
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${statusColors[order.status]}`}>
                        {order.status.replace(/_/g, " ")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="relative flex-1 w-full z-10 isolate">
                  <MapContainer
                    center={mapCenter}
                    zoom={14}
                    scrollWheelZoom={true}
                    className="h-full w-full"
                    maxBounds={MAGWAY_BOUNDS}
                    maxBoundsViscosity={1.0}
                    minZoom={MAGWAY_MIN_ZOOM}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <MapRefSetter mapRef={mapRef} />

                    {/* Fit all visible points including rider on first render */}
                    <FitBounds
                      points={riderPosition ? [...mapData.allPoints, riderPosition] : mapData.allPoints}
                    />

                    {/* Pickup Shop Markers — amber icon; click to toggle pickup→delivery route */}
                    {mapData.pickups.map((pickup, idx) => (
                      <Marker
                        key={`pickup-${idx}`}
                        position={pickup.position}
                        icon={PickupIcon}
                        eventHandlers={{
                          click: () => setSelectedPickupIdx((prev) => (prev === idx ? null : idx)),
                        }}
                      >
                        <Popup>
                          <div className="text-xs">
                            <strong className="text-amber-500">Pickup {mapData.pickups.length > 1 ? `#${idx + 1}` : ""}:</strong> {pickup.name}
                          </div>
                        </Popup>
                      </Marker>
                    ))}

                    {/* Customer Destination Marker — click to show rider→delivery blue path */}
                    <Marker
                      position={mapData.dest}
                      eventHandlers={{
                        click: () => setSelectedPickupIdx(null),
                      }}
                    >
                      <Popup>
                        <div className="text-xs">
                          <strong className="text-cyan-500">Deliver to:</strong> {order.customer.name}
                        </div>
                      </Popup>
                    </Marker>

                    {/* Rider current position marker */}
                    {riderPosition && (
                      <Marker position={riderPosition} icon={RiderIcon}>
                        <Popup>
                          <div className="text-xs font-semibold text-cyan-600">📍 You are here</div>
                        </Popup>
                      </Marker>
                    )}

                    {/* Rider → Delivery blue dashed route (hidden when a pickup is selected) */}
                    {riderPosition && selectedPickupIdx === null && (
                      <>
                        <Polyline
                          positions={[riderPosition, mapData.dest]}
                          color={isDark ? "#38bdf8" : "#3b82f6"}
                          weight={10}
                          dashArray="1, 0"
                          opacity={0.18}
                        />
                        <Polyline
                          positions={[riderPosition, mapData.dest]}
                          color={isDark ? "#38bdf8" : "#2563eb"}
                          weight={3.5}
                          dashArray="10, 8"
                          opacity={1}
                        />
                      </>
                    )}

                    {/* Rider → Pickup yellow dashed route (shown when a pickup marker is clicked) */}
                    {selectedPickupIdx !== null && riderPosition && (() => {
                      const pickup = mapData.pickups[selectedPickupIdx]
                      return pickup ? (
                        <>
                          {/* Glow layer */}
                          <Polyline
                            positions={[riderPosition, pickup.position]}
                            color="#eab308"
                            weight={10}
                            dashArray="1, 0"
                            opacity={0.2}
                          />
                          {/* Crisp dashed line */}
                          <Polyline
                            positions={[riderPosition, pickup.position]}
                            color="#ca8a04"
                            weight={3.5}
                            dashArray="10, 8"
                            opacity={1}
                          />
                        </>
                      ) : null
                    })()}
                  </MapContainer>

                </div>
              </div>
              {locationError && (
                <p className="text-sm font-medium text-red-500 px-1">{locationError}</p>
              )}
            </div>

            {/* Right Column: Job Specifications */}
            <div className="space-y-4">
              <div
                className={`rounded-3xl border p-6 transition-all ${
                  isDark ? "border-slate-800 bg-slate-950/40" : "border-slate-200 bg-white"
                }`}
              >
                <div className="mb-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                      Job Specifications
                    </h4>
                    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${statusColors[order.status]}`}>
                      {order.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className={`mt-1 text-[11px] font-mono ${isDark ? "text-slate-600" : "text-slate-400"}`}>
                    #{order._id.slice(-6).toUpperCase()}
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Locations */}
                  <div className="space-y-4">
                    {/* Pickup Addresses */}
                    {order.pickupLocations.map((pickup, idx) => (
                      <div key={pickup._id} className="flex gap-3">
                        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500`}>
                          <Store className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                            Pickup Location{order.pickupLocations.length > 1 ? ` #${idx + 1}` : ""}
                          </p>
                          <p className="text-sm font-bold leading-tight mt-0.5">
                            {pickup.name}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {pickup.address}
                          </p>
                        </div>
                      </div>
                    ))
                    }

                    {/* Delivery Location */}
                    <div className="flex gap-3">
                      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-500`}>
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                          Delivery Destination
                        </p>
                        <p className="text-sm font-bold leading-tight mt-0.5">
                          {order.deliveryLocation.address}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Customer Card snippet */}
                  <div className={`flex items-center justify-between rounded-2xl p-4 ${isDark ? "bg-slate-900/50" : "bg-slate-50"}`}>
                    <div className="flex items-center gap-3">
                      <img
                        src={order.customer.image}
                        alt={order.customer.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80"
                        }}
                        className="h-12 w-12 rounded-xl object-cover"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                          Recipient
                        </p>
                        <p className="text-base font-bold mt-0.5">{order.customer.name}</p>
                      </div>
                    </div>
                    <a
                      href={`tel:${order.shipping_phone}`}
                      className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                        isDark
                          ? "bg-slate-800 text-cyan-400 hover:bg-slate-700/80"
                          : "bg-sky-100 text-sky-600 hover:bg-sky-200"
                      }`}
                      title="Call Customer"
                    >
                      <Phone className="h-5 w-5" />
                    </a>
                  </div>

                  {/* Itemized breakdown */}
                  <div>
                    <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Receipt Summary
                    </h5>
                    <div className={`rounded-2xl p-4 space-y-3 ${isDark ? "bg-slate-900/50" : "bg-slate-50"}`}>
                      {order.items.map((item) => (
                        <div key={item.itemId} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-3">
                            <span className={`flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold ${
                              isDark ? "bg-slate-800 text-cyan-400" : "bg-slate-200 text-slate-700"
                            }`}>
                              {item.quantity}x
                            </span>
                            <span className="font-medium">{item.name}</span>
                          </div>
                          <span className="font-semibold">
                            {(item.priceAtPurchase * item.quantity).toLocaleString()} Ks
                          </span>
                        </div>
                      ))}
                      <div className="border-t border-slate-700/10 pt-3 mt-1 flex items-center justify-between text-sm font-bold">
                        <span>Total Cash Collect</span>
                        <span className={`text-base font-bold ${isDark ? "text-cyan-400" : "text-sky-600"}`}>
                          {order.totalAmount.toLocaleString()} Ks
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Controls */}
                  {order.status !== "DELIVERED" && (
                    <div className="pt-4">
                      <button
                        onClick={() => handleUpdateStatus(order.status)}
                        disabled={updating === order._id}
                        className={`w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold text-white transition-all shadow-md active:scale-95 ${
                          order.status === "PREPARING"
                            ? "bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 shadow-indigo-500/15"
                            : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/15"
                        } disabled:opacity-50 disabled:pointer-events-none`}
                      >
                        {updating === order._id ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Updating...
                          </>
                        ) : order.status === "PREPARING" ? (
                          <>
                            Mark Picked Up
                            <ArrowRight className="h-4 w-4" />
                          </>
                        ) : (
                          <>
                            Complete Delivery
                            <CheckCircle className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  )
}
