import axios from "@/lib/axios"
import { useState, useRef, useCallback, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  MapPin,
  Phone,
  ArrowRight,
  ArrowLeft,
  LocateFixed,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { z } from "zod"
import { isValidPhoneNumber } from "libphonenumber-js"
import {
  PhoneInput,
  defaultCountries,
  parseCountry,
} from "react-international-phone"
import "react-international-phone/style.css"
import { toast, Toaster } from "sonner"

// Google Maps
import {
  GoogleMap,
  useLoadScript,
  OverlayView,
} from "@react-google-maps/api"
import { useCartStore } from "@/store/useCartStore"
import { useAuthStore } from "@/store/useAuthStore"
import { useLocation } from "react-router-dom"

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string

const deliverySchema = z.object({
  phone: z.string().refine(
    (val) => {
      if (!val) return false
      return isValidPhoneNumber(val, "MM")
    },
    {
      message: "Please enter a valid Myanmar phone number.",
    }
  ),
  address: z.string().min(5, "Please enter your full delivery address"),
})
const myanmarCountry = defaultCountries.find(
  (c) => parseCountry(c).iso2 === "mm"
)

// Magway city center
const MAGWAY_CENTER = { lat: 20.1489, lng: 94.9211 }

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

// Checks whether a GPS-derived location falls within the Magway bounds
function isWithinMagwayBounds(lat: number, lng: number) {
  return (
    lat >= MAGWAY_BOUNDS.south &&
    lat <= MAGWAY_BOUNDS.north &&
    lng >= MAGWAY_BOUNDS.west &&
    lng <= MAGWAY_BOUNDS.east
  )
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

export default function DeliveryInfoPage() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const { items, clearCart } = useCartStore()
  const user = useAuthStore((state) => state.user)

  const [position, setPosition] = useState<{ lat: number; lng: number }>(
    MAGWAY_CENTER
  )

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    language: "my", // Display map labels and UI text in Myanmar/Burmese script
    region: "MM",   // Myanmar region context
  })

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map
  }, [])

  // Triggered when the user taps "Current Location" — requests GPS permission
  // from the device, then points the marker at the user's location on the map
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
          // If the GPS result falls outside Magway, don't move the marker
          // outside the bounds — just let the user know and keep it where it is
          setLocationError(
            "Your current location is outside the delivery area (Magway city + universities/schools). Please select your delivery point on the map yourself."
          )
          return
        }

        const newPosition = { lat: latitude, lng: longitude }
        setPosition(newPosition)
        mapRef.current?.panTo(newPosition)
        mapRef.current?.setZoom(16)
      },
      (err) => {
        setLocating(false)
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError(
            "Location access was denied. Please enable location permission in your browser settings."
          )
        } else {
          setLocationError(
            "Couldn't find your current location. Please try again."
          )
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  useEffect(() => {
    const fetchAddress = async () => {
      const { lat, lng } = position
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
        )
        const data = await res.json()
        setAddress(data.display_name || "Unknown Location")
      } catch (err) {
        setAddress("Location details unavailable")
      }
    }
    fetchAddress()
  }, [position])

  const location = useLocation()
  const { totalAmount } = location.state || { totalAmount: 0 }

  if (!location.state) {
    navigate("/customer/checkout")
  }

  const handleConfirm = async () => {
    const result = deliverySchema.safeParse({ phone, address })

    if (!result.success) {
      toast.error(result.error.issues[0].message)
      return
    }

    if (!address || address === "Unknown Location") {
      toast.error("Please wait while we detect your location.")
      return
    }

    const customerId = user
      ? user.userId || (user as any).id || (user as any)._id
      : "GUEST"
    // Build the request body that matches POST /api/order/save-order
    const orderData = {
      customerId,
      // totalAmount,
      shipping_phone: phone,
      deliveryAddress: address,
      latitude: position.lat,
      longitude: position.lng,
      items: Object.values(items).map((i) => ({
        restaurantId: i.restaurantId,
        name: i.name,
        image: i.image,
        quantity: i.quantity,
        priceAtPurchase: i.price,
      })),
    }

    try {
      const response = await axios.post("/orders/save-order", orderData)

      // Success: { message, data: { orderId, status }, error: null }
      const { message, data } = response.data
      toast.success(message || "Order placed successfully!")
      console.log(
        "Order Success — orderId:",
        data?.orderId,
        "status:",
        data?.status
      )
      clearCart()
      setTimeout(() => {
        navigate("/customer/order-history", { replace: true })
      }, 1500)
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        "Failed to place order. Please try again."
      toast.error(errorMessage)
    }
  }

  useEffect(() => {
    handleUseCurrentLocation()
  }, [])

  return (
    <div className="mx-auto w-full max-w-lg px-6 py-10">
      <Toaster position="top-center" richColors />
      <h1 className="mb-2 font-serif text-2xl font-bold">
        Delivery Information
      </h1>
      <p className="mb-8 text-sm text-zinc-500">
        Please provide your details for the rider.
      </p>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-zinc-900">
            <Phone size={16} /> Contact Phone
          </label>
          <PhoneInput
            defaultCountry="mm"
            countries={myanmarCountry ? [myanmarCountry] : undefined}
            value={phone}
            onChange={(phone) => setPhone(phone)}
            className="flex h-10 w-full rounded-md border border-input bg-transparent py-2 pl-3 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
            inputClassName="!border-none !bg-transparent !outline-none !ring-0 !px-2 !text-black"
            countrySelectorStyleProps={{
              buttonStyle: { border: "none", backgroundColor: "transparent" },
            }}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm font-medium text-zinc-900">
              <MapPin size={16} /> Delivery Location
            </label>
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={locating}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {locating ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <LocateFixed size={12} />
              )}
              {locating ? "Locating..." : "Use Current Location"}
            </button>
          </div>

          {/* Map Container */}
          <div className="relative isolate z-0 h-64 w-full overflow-hidden rounded-xl border border-zinc-200">
            {!isLoaded ? (
              <div className="flex h-full w-full items-center justify-center bg-zinc-50">
                <Loader2 className="animate-spin text-zinc-400" size={24} />
              </div>
            ) : (
              <GoogleMap
                mapContainerStyle={MAP_CONTAINER_STYLE}
                center={position}
                zoom={14}
                options={MAP_OPTIONS}
                onLoad={onMapLoad}
              >
                {/* Pulsing cyan dot marker at the delivery position */}
                <OverlayView
                  position={position}
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

          <p className="text-xs text-zinc-400">
            Your location is pinned on the map. Tap "Use Current Location" to re-center.
          </p>
          {locationError && (
            <p className="text-sm font-medium text-red-500">{locationError}</p>
          )}
        </div>
      </div>

      <div className="mt-10">
        <Button
          className="h-12 w-full rounded-2xl bg-zinc-900 font-bold text-white shadow-lg hover:cursor-pointer hover:bg-zinc-800"
          onClick={handleConfirm}
          disabled={locating || !isWithinMagwayBounds(position.lat, position.lng)}
        >
          {locating ? "Locating..." : "Confirm Order"}{" "}
          <ArrowRight size={18} className="ml-2" />
        </Button>
        <button
          onClick={() => navigate("/customer/checkout")}
          className="mt-4 flex w-full items-center justify-center gap-2 text-sm text-zinc-500 hover:cursor-pointer hover:underline"
        >
          <ArrowLeft size={16} /> Back to Checkout
        </button>
      </div>
    </div>
  )
}
