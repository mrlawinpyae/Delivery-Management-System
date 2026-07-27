import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import axios from "@/lib/axios"
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

// Google Maps
import {
  GoogleMap,
  useLoadScript,
  OverlayView,
  Polyline,
} from "@react-google-maps/api"

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string

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
const MAGWAY_BOUNDS = {
  south: 20.085,
  west: 94.885,
  north: 20.235,
  east: 95.04,
}
const MAGWAY_CENTER = { lat: 20.1489, lng: 94.9211 }

const MAP_CONTAINER_STYLE = { width: "100%", height: "100%" }

function isWithinMagwayBounds(lat: number, lng: number) {
  return (
    lat >= MAGWAY_BOUNDS.south &&
    lat <= MAGWAY_BOUNDS.north &&
    lng >= MAGWAY_BOUNDS.west &&
    lng <= MAGWAY_BOUNDS.east
  )
}

// Pulsing cyan dot for rider's current position
function RiderDot() {
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

// Amber pickup pin SVG
function PickupPin({ label }: { label?: string }) {
  return (
    <div style={{ position: "relative", width: 32, height: 42 }}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="42"
        viewBox="0 0 32 42"
      >
        <filter id="shadow-pickup" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="2"
            stdDeviation="2"
            floodColor="rgba(0,0,0,0.35)"
          />
        </filter>
        <path
          filter="url(#shadow-pickup)"
          d="M16 2C9.37 2 4 7.37 4 14c0 9 12 26 12 26S28 23 28 14C28 7.37 22.63 2 16 2z"
          fill="#f59e0b"
          stroke="#b45309"
          strokeWidth="1.5"
        />
        <circle cx="16" cy="14" r="5" fill="white" />
        <path
          d="M16 11.5v5M13.5 14h5"
          stroke="#b45309"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
      {label && (
        <div
          style={{
            position: "absolute",
            top: -18,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#f59e0b",
            color: "white",
            fontSize: 10,
            fontWeight: 700,
            borderRadius: 4,
            padding: "1px 5px",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </div>
      )}
    </div>
  )
}

// Destination (customer) pin
function DestinationPin() {
  return (
    <div style={{ position: "relative", width: 32, height: 42 }}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="42"
        viewBox="0 0 32 42"
      >
        <filter id="shadow-dest" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="2"
            stdDeviation="2"
            floodColor="rgba(0,0,0,0.35)"
          />
        </filter>
        <path
          filter="url(#shadow-dest)"
          d="M16 2C9.37 2 4 7.37 4 14c0 9 12 26 12 26S28 23 28 14C28 7.37 22.63 2 16 2z"
          fill="#06b6d4"
          stroke="#0891b2"
          strokeWidth="1.5"
        />
        <circle cx="16" cy="14" r="5" fill="white" />
        <circle cx="16" cy="14" r="2.5" fill="#06b6d4" />
      </svg>
    </div>
  )
}

// Helper: fetch road route from OSRM and return decoded latLng path.
// Uses native fetch() — the custom axios instance has a /api baseURL that
// would corrupt the full OSRM URL and cause every request to fail silently.
async function fetchRoute(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number }
): Promise<{ lat: number; lng: number }[]> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`OSRM error: ${res.status}`)
    const data = await res.json()
    if (data.routes && data.routes.length > 0) {
      const coords = data.routes[0].geometry.coordinates as [number, number][]
      return coords.map(([lng, lat]) => ({ lat, lng }))
    }
  } catch (err) {
    console.error("OSRM routing failed, falling back to straight line:", err)
  }
  return [start, end]
}

export default function RiderTaskDetails() {
  const theme = useThemeStore((s) => s.theme)
  const isDark = theme === "dark"

  const { id } = useParams()
  const navigate = useNavigate()

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [riderPosition, setRiderPosition] = useState<{
    lat: number
    lng: number
  } | null>(null)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [selectedPickupIdx, setSelectedPickupIdx] = useState<number | null>(
    null
  )
  const [hoveredPickupIdx, setHoveredPickupIdx] = useState<number | null>(null)
  const mapRef = useRef<google.maps.Map | null>(null)

  // Route path state
  const [routePath, setRoutePath] = useState<{ lat: number; lng: number }[]>(
    []
  )

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    language: "my", // Display map labels in Myanmar script
  })

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map
  }, [])

  useEffect(() => {
    let active = true
    const loadAssignedOrders = async () => {
      try {
        const res = await axios.get("/orders/ord_1003/getAssignedOrders")
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
      setLocationError(
        "Location services are not available on this device/browser."
      )
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setLocating(false)
        if (!isWithinMagwayBounds(latitude, longitude)) {
          setLocationError(
            "Your current location is outside the delivery area (Magway). The map will still show order locations."
          )
          return
        }
        const coords = { lat: latitude, lng: longitude }
        setRiderPosition(coords)
        mapRef.current?.panTo(coords)
        mapRef.current?.setZoom(Math.max(mapRef.current.getZoom() ?? 15, 15))
      },
      (err) => {
        setLocating(false)
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError(
            "Location access was denied. Enable location permission in your browser settings."
          )
        } else {
          setLocationError(
            "Couldn't determine your current location. Please try again."
          )
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  // Auto-request location on page load
  useEffect(() => {
    handleUseCurrentLocation()
  }, [])

  // Recompute route whenever rider position or selected pickup changes
  useEffect(() => {
    if (!order || !riderPosition) {
      setRoutePath([])
      return
    }

    const dest = {
      lat: order.deliveryLocation.latitude,
      lng: order.deliveryLocation.longitude,
    }

    // GeoJSON is [lng, lat]
    const pickups = order.pickupLocations.map((p) => ({
      lat: p.coordinates[1],
      lng: p.coordinates[0],
    }))
    if (pickups.length === 0) {
      pickups.push({ lat: 20.151, lng: 94.933 })
    }

    let active = true
    const computeRoute = async () => {
      const end =
        selectedPickupIdx !== null ? pickups[selectedPickupIdx] : dest
      if (!end) return
      const path = await fetchRoute(riderPosition, end)
      if (active) setRoutePath(path)
    }
    computeRoute()
    return () => {
      active = false
    }
  }, [riderPosition, selectedPickupIdx, order])

  // Fit map bounds to all visible points — runs only once on initial load.
  // fittedRef prevents re-firing when riderPosition updates (which would
  // snap the map back and discard any pan/zoom the user has made).
  const fittedRef = useRef(false)
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !order || fittedRef.current) return
    fittedRef.current = true

    const dest = {
      lat: order.deliveryLocation.latitude,
      lng: order.deliveryLocation.longitude,
    }
    const pickups = order.pickupLocations.map((p) => ({
      lat: p.coordinates[1],
      lng: p.coordinates[0],
    }))
    if (pickups.length === 0) pickups.push({ lat: 20.151, lng: 94.933 })

    const allPoints = [...pickups, dest]
    if (riderPosition) allPoints.push(riderPosition)

    const bounds = new window.google.maps.LatLngBounds()
    allPoints.forEach((pt) => bounds.extend(pt))
    mapRef.current.fitBounds(bounds, 50)
  }, [isLoaded, order, riderPosition])

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
      const res = await axios.put(`/api/orders/${order._id}/status`, {
        status: nextStatus,
      })
      if (res.data) {
        const readableStatus =
          nextStatus === "OUT_FOR_DELIVERY" ? "Picked Up" : "Delivered"
        toast.success(
          `Order #${order._id.slice(-4)} marked as ${readableStatus}!`,
          {
            icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
          }
        )

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

  // --- Hooks must be called unconditionally (before any early returns) ---

  // Memoize map center so the map doesn't re-center on every React re-render
  const mapCenter = useMemo(() => {
    if (!order) return MAGWAY_CENTER
    const dest = {
      lat: order.deliveryLocation.latitude,
      lng: order.deliveryLocation.longitude,
    }
    const pickups = order.pickupLocations.map((p) => ({
      lat: p.coordinates[1],
      lng: p.coordinates[0],
    }))
    if (pickups.length === 0) pickups.push({ lat: 20.151, lng: 94.933 })
    const pts = [...pickups, dest]
    return {
      lat: pts.reduce((s, p) => s + p.lat, 0) / pts.length,
      lng: pts.reduce((s, p) => s + p.lng, 0) / pts.length,
    }
  }, [order])

  // Memoize so a new options reference doesn't trigger map.setOptions() on every render
  const mapOptions: google.maps.MapOptions = useMemo(() => ({
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
    styles: isDark
      ? [
          { elementType: "geometry", stylers: [{ color: "#1e293b" }] },
          { elementType: "labels.text.stroke", stylers: [{ color: "#1e293b" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
          {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#334155" }],
          },
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#0f172a" }],
          },
          {
            featureType: "poi",
            elementType: "geometry",
            stylers: [{ color: "#263145" }],
          },
        ]
      : [],
  }), [isDark])

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
        <button
          onClick={() => navigate("/rider")}
          className="mt-4 text-sky-500 underline "
        >
          Back to Tasks
        </button>
      </div>
    )
  }

  // Derive coordinates for the map — supports multiple pickup locations
  const getMapData = (o: Order) => {
    const dest = {
      lat: o.deliveryLocation.latitude,
      lng: o.deliveryLocation.longitude,
    }

    // GeoJSON is [lng, lat], convert each to { lat, lng }
    const pickups: { name: string; position: { lat: number; lng: number } }[] =
      o.pickupLocations.map((p) => ({
        name: p.name,
        position: { lat: p.coordinates[1], lng: p.coordinates[0] },
      }))

    // Fallback if no pickup locations are provided
    if (pickups.length === 0) {
      pickups.push({ name: "Merchant", position: { lat: 20.151, lng: 94.933 } })
    }

    const allPoints = [...pickups.map((p) => p.position), dest]

    return { pickups, dest, allPoints }
  }

  const mapData = getMapData(order)

  // Route line colors
  const routeColor =
    selectedPickupIdx !== null
      ? isDark
        ? "#f59e0b"
        : "#ea580c"
      : isDark
        ? "#38bdf8"
        : "#2563eb"

  const statusColors = {
    PENDING: isDark
      ? "text-amber-400 bg-amber-400/10 border-amber-400/20"
      : "text-amber-700 bg-amber-50 border-amber-200",
    PREPARING: isDark
      ? "text-sky-400 bg-sky-400/10 border-sky-400/20"
      : "text-sky-700 bg-sky-50 border-sky-200",
    OUT_FOR_DELIVERY: isDark
      ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
      : "text-emerald-700 bg-emerald-50 border-emerald-200",
    DELIVERED: isDark
      ? "text-slate-400 bg-slate-400/10 border-slate-400/20"
      : "text-slate-600 bg-slate-50 border-slate-200",
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <button
          onClick={() => navigate("/rider")}
          className={`flex items-center gap-2 text-sm font-semibold transition-colors cursor-pointer ${
            isDark
              ? "text-slate-400 hover:text-white"
              : "text-slate-500 hover:text-slate-800"
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
                isDark
                  ? "border-slate-800 bg-slate-950/40"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-700/10 px-5 py-4">
                <div className="flex items-center gap-2">
                  <Navigation
                    className={`h-5 w-5 ${isDark ? "text-cyan-400" : "text-sky-600"}`}
                  />
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
                    {locating ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <LocateFixed className="h-3.5 w-3.5" />
                    )}
                    {locating ? "Locating..." : "My Location"}
                  </button>
                  {order.status !== "PREPARING" && (
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${statusColors[order.status]}`}
                    >
                      {order.status.replace(/_/g, " ")}
                    </span>
                  )}
                </div>
              </div>

              <div className="relative flex-1 w-full z-10 isolate">
                {!isLoaded ? (
                  <div className="flex h-full w-full items-center justify-center bg-slate-50 dark:bg-slate-900">
                    <Loader2 className="animate-spin text-slate-400" size={24} />
                  </div>
                ) : (
                  <GoogleMap
                    mapContainerStyle={MAP_CONTAINER_STYLE}
                    center={mapCenter}
                    zoom={14}
                    options={mapOptions}
                    onLoad={onMapLoad}
                  >
                    {/* Pickup Shop Markers — amber icon; click to toggle pickup→delivery route */}
                    {mapData.pickups.map((pickup, idx) => (
                      <OverlayView
                        key={`pickup-${idx}`}
                        position={pickup.position}
                        mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                        getPixelPositionOffset={() => ({ x: -16, y: -42 })}
                      >
                        <div
                          onClick={() =>
                            setSelectedPickupIdx((prev) =>
                              prev === idx ? null : idx
                            )
                          }
                          onMouseEnter={() => setHoveredPickupIdx(idx)}
                          onMouseLeave={() => setHoveredPickupIdx(null)}
                          style={{ cursor: "pointer", position: "relative" }}
                        >
                          <PickupPin
                            label={
                              mapData.pickups.length > 1
                                ? `#${idx + 1}`
                                : undefined
                            }
                          />

                          {/* Modern hover tooltip — floats above the pin */}
                          <div
                            style={{
                              position: "absolute",
                              bottom: "calc(100% + 10px)",
                              left: "50%",
                              transform: "translateX(-50%)",
                              pointerEvents: "none",
                              opacity: hoveredPickupIdx === idx ? 1 : 0,
                              transition: "opacity 0.18s ease, transform 0.18s ease",
                              transformOrigin: "bottom center",
                              zIndex: 10,
                            }}
                          >
                            <div
                              style={{
                                background: isDark
                                  ? "rgba(15,23,42,0.92)"
                                  : "rgba(255,255,255,0.96)",
                                backdropFilter: "blur(12px)",
                                WebkitBackdropFilter: "blur(12px)",
                                border: isDark
                                  ? "1px solid rgba(251,191,36,0.25)"
                                  : "1px solid rgba(245,158,11,0.3)",
                                borderRadius: 12,
                                padding: "8px 12px",
                                boxShadow: isDark
                                  ? "0 8px 24px rgba(0,0,0,0.5)"
                                  : "0 8px 24px rgba(0,0,0,0.12)",
                                whiteSpace: "nowrap",
                                minWidth: 140,
                              }}
                            >
                              {/* Header row */}
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                  marginBottom: 4,
                                }}
                              >
                                <div
                                  style={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: 6,
                                    background: "rgba(245,158,11,0.15)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                  }}
                                >
                                  <svg
                                    width="11"
                                    height="11"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="#f59e0b"
                                    strokeWidth="2.2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                    <polyline points="9 22 9 12 15 12 15 22" />
                                  </svg>
                                </div>
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    letterSpacing: "0.06em",
                                    textTransform: "uppercase",
                                    color: "#f59e0b",
                                  }}
                                >
                                  Pickup
                                  {mapData.pickups.length > 1
                                    ? ` #${idx + 1}`
                                    : ""}
                                </span>
                              </div>

                              {/* Pickup name */}
                              <p
                                style={{
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: isDark ? "#f1f5f9" : "#0f172a",
                                  margin: 0,
                                  lineHeight: 1.4,
                                }}
                              >
                                {pickup.name}
                              </p>

                              {/* Click hint */}
                              <p
                                style={{
                                  fontSize: 10,
                                  color: isDark ? "#64748b" : "#94a3b8",
                                  margin: "4px 0 0",
                                }}
                              >
                                {selectedPickupIdx === idx
                                  ? "✓ Route active — click to clear"
                                  : "Click to show route"}
                              </p>
                            </div>

                            {/* Tail / arrow pointing down */}
                            <div
                              style={{
                                width: 0,
                                height: 0,
                                borderLeft: "6px solid transparent",
                                borderRight: "6px solid transparent",
                                borderTop: isDark
                                  ? "6px solid rgba(15,23,42,0.92)"
                                  : "6px solid rgba(255,255,255,0.96)",
                                margin: "0 auto",
                              }}
                            />
                          </div>
                        </div>
                      </OverlayView>
                    ))}

                    {/* Customer Destination Marker */}
                    <OverlayView
                      position={mapData.dest}
                      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                      getPixelPositionOffset={() => ({ x: -16, y: -42 })}
                    >
                      <div
                        onClick={() => setSelectedPickupIdx(null)}
                        style={{ cursor: "pointer" }}
                        title={`Deliver to: ${order.customer.name}`}
                      >
                        <DestinationPin />
                      </div>
                    </OverlayView>

                    {/* Rider current position marker */}
                    {riderPosition && (
                      <OverlayView
                        position={riderPosition}
                        mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                        getPixelPositionOffset={(width, height) => ({
                          x: -(width / 2),
                          y: -(height / 2),
                        })}
                      >
                        <RiderDot />
                      </OverlayView>
                    )}

                    {/* Route polyline — road-following dashed line */}
                    {riderPosition && routePath.length > 1 && (
                      <>
                        {/* Soft glow halo beneath the dashes */}
                        <Polyline
                          path={routePath}
                          options={{
                            strokeColor: routeColor,
                            strokeOpacity: 0.15,
                            strokeWeight: 12,
                          }}
                        />
                        {/* Dashed route — base line is invisible (opacity 0);
                            only the icon symbols (dashes) are rendered so
                            no solid underline bleeds through. */}
                        <Polyline
                          path={routePath}
                          options={{
                            strokeColor: routeColor,
                            strokeOpacity: 0,
                            strokeWeight: 4,
                            icons: [
                              {
                                icon: {
                                  path: "M 0,-1 0,1",
                                  strokeOpacity: 1,
                                  strokeColor: routeColor,
                                  scale: 3.5,
                                },
                                offset: "0",
                                repeat: "14px",
                              },
                            ],
                          }}
                        />
                      </>
                    )}
                  </GoogleMap>
                )}
              </div>
            </div>
            {locationError && (
              <p className="text-sm font-medium text-red-500 px-1">
                {locationError}
              </p>
            )}
          </div>

          {/* Right Column: Job Specifications */}
          <div className="space-y-4">
            <div
              className={`rounded-3xl border p-6 transition-all ${
                isDark
                  ? "border-slate-800 bg-slate-950/40"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                    Job Specifications
                  </h4>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${statusColors[order.status]}`}
                  >
                    {order.status.replace(/_/g, " ")}
                  </span>
                </div>
                <p
                  className={`mt-1 text-[11px] font-mono ${isDark ? "text-slate-600" : "text-slate-400"}`}
                >
                  #{order._id.slice(-6).toUpperCase()}
                </p>
              </div>

              <div className="space-y-6">
                {/* Locations */}
                <div className="space-y-4">
                  {/* Pickup Addresses */}
                  {order.pickupLocations.map((pickup, idx) => (
                    <div key={pickup._id} className="flex gap-3">
                      <div
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500`}
                      >
                        <Store className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                          Pickup Location
                          {order.pickupLocations.length > 1
                            ? ` #${idx + 1}`
                            : ""}
                        </p>
                        <p className="text-sm font-bold leading-tight mt-0.5">
                          {pickup.name}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {pickup.address}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Delivery Location */}
                  <div className="flex gap-3">
                    <div
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-500`}
                    >
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
                <div
                  className={`flex items-center justify-between rounded-2xl p-4 ${isDark ? "bg-slate-900/50" : "bg-slate-50"}`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={order.customer.image}
                      alt={order.customer.name}
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80"
                      }}
                      className="h-12 w-12 rounded-xl object-cover"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                        Recipient
                      </p>
                      <p className="text-base font-bold mt-0.5">
                        {order.customer.name}
                      </p>
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
                  <div
                    className={`rounded-2xl p-4 space-y-3 ${isDark ? "bg-slate-900/50" : "bg-slate-50"}`}
                  >
                    {order.items.map((item) => (
                      <div
                        key={item.itemId}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold ${
                              isDark
                                ? "bg-slate-800 text-cyan-400"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {item.quantity}x
                          </span>
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <span className="font-semibold">
                          {(item.priceAtPurchase * item.quantity).toLocaleString()}{" "}
                          Ks
                        </span>
                      </div>
                    ))}
                    <div className="border-t border-slate-700/10 pt-3 mt-1 flex items-center justify-between text-sm font-bold">
                      <span>Total Cash Collect</span>
                      <span
                        className={`text-base font-bold ${isDark ? "text-cyan-400" : "text-sky-600"}`}
                      >
                        {order.totalAmount.toLocaleString()} Ks
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Controls — only visible once the order is out for delivery */}
                {order.status === "OUT_FOR_DELIVERY" && (
                  <div className="pt-4">
                    <button
                      onClick={() => handleUpdateStatus(order.status)}
                      disabled={updating === order._id}
                      className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold text-white transition-all shadow-md active:scale-95 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/15 disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {updating === order._id ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Updating...
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
