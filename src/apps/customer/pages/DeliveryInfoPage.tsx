import axios from "axios"
import { useState, useRef, useEffect } from "react"
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

// Leaflet imports
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

// Marker icon setup so the default pin renders correctly
import icon from "leaflet/dist/images/marker-icon.png"
import iconShadow from "leaflet/dist/images/marker-shadow.png"
import { useCartStore } from "@/store/useCartStore"
import { useLocation } from "react-router-dom"

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})
L.Marker.prototype.options.icon = DefaultIcon

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
const MAGWAY_CENTER: [number, number] = [20.1489, 94.9211]

// Landmarks included in scope:
// - Magway city center
// - Magway University (Taungdwin Road, south part of the city) — 20.13611, 94.93500
// - Technological University, Magway (near Kanbyar village, north of the city) — 20.19917, 95.00778
// A tight bounding box that covers these 3 locations (not the entire region)
const MAGWAY_BOUNDS: [[number, number], [number, number]] = [
  [20.085, 94.885], // Southwest corner — small buffer below Magway University
  [20.235, 95.04], // Northeast corner — small buffer above TU Magway
]

// Minimum zoom level required so the area outside the bounds is never visible
// (too low a zoom level makes the viewport wider than the bounds box, revealing the outside map)
const MAGWAY_MIN_ZOOM = 13

// Checks whether a GPS-derived location falls within the Magway bounds
function isWithinMagwayBounds(lat: number, lng: number) {
  const [[south, west], [north, east]] = MAGWAY_BOUNDS
  return lat >= south && lat <= north && lng >= west && lng <= east
}

export default function DeliveryInfoPage() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const { items, clearCart } = useCartStore()

  const [position, setPosition] = useState<[number, number]>(MAGWAY_CENTER)

  // Marker is now fixed in place — it only moves when the user taps
  // "Use Current Location", never by clicking/dragging on the map.
  function LocationMarker() {
    return <Marker position={position} />
  }

  // Capture the map instance so we can call flyTo() on it programmatically
  function MapRefSetter() {
    const map = useMap()
    mapRef.current = map
    return null
  }

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

        const newPosition: [number, number] = [latitude, longitude]
        setPosition(newPosition)
        mapRef.current?.flyTo(newPosition, 16, { duration: 1 })
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

  // Position ပြောင်းတိုင်း Address အလိုအလျောက် ရယူရန်
  useEffect(() => {
    const fetchAddress = async () => {
      const [lat, lng] = position
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

  // DeliveryInfoPage ထဲတွင်
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

    const uniqueRestaurantIds = Array.from(
      new Set(
        Object.values(items)
          .map((i) => i.restaurantId)
          .filter((id) => id !== undefined)
      )
    )

    const orderData = {
      customerId: "USER_ID_FROM_AUTH",
      restaurantsId: uniqueRestaurantIds,
      status: "PREPARING",
      totalAmount,
      deliveryLocation: {
        address: address,
        latitude: position[0],
        longitude: position[1],
      },
      shipping_phone: phone,
      items: Object.values(items).map((i) => ({
        itemId: i.itemId,
        name: i.name,
        quantity: i.quantity,
        priceAtPurchase: i.price,
      })),
      createdAt: new Date().toISOString(),
    }

    try {
      // Axios သုံးထားခြင်း
      const response = await axios.post("/api/order/save-order", orderData)

      // Axios က response.data မှာ JSON ကို အသင့်ပေးထားပြီးသားပါ
      const data = response.data

      toast.success("Order confirmed successfully!")
      console.log("Order Success:", data)
      clearCart()
      setTimeout(() => {
        navigate("/customer/order-history", { replace: true })
      }, 1500)
    } catch (error: any) {
      // Axios က Error တွေကို catch ထဲ တန်းရောက်ပါတယ်
      // Backend က ပြန်လာတဲ့ message ကို error.response.data ကနေ ယူနိုင်ပါတယ်
      const errorMessage =
        error.response?.data?.error ||
        "Failed to place order. Please try again."
      toast.error(errorMessage)
    }
  }

  // ၁။ Page စရောက်တာနဲ့ Current Location ကို Auto တောင်းရန်
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
              className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {locating ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <LocateFixed size={14} />
              )}
              {locating ? "Locating..." : "Use Current Location"}
            </button>
          </div>

          {/* Map Container — wrapped with isolate so Leaflet's internal
              z-index (panes/controls go up to ~1000) can never escape
              above the page navbar, even while scrolling. */}
          <div className="relative isolate z-0 h-64 w-full overflow-hidden rounded-xl border border-zinc-200">
            <MapContainer
              center={position}
              zoom={14}
              className="h-full w-full"
              maxBounds={MAGWAY_BOUNDS}
              maxBoundsViscosity={1.0}
              minZoom={MAGWAY_MIN_ZOOM}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationMarker />
              <MapRefSetter />
            </MapContainer>
          </div>
          {/* Cap Leaflet's internal stacking context so its panes/controls
              (which default to z-index up to 1000) never render above
              fixed/sticky page chrome like the navbar. */}
          <style>{`
            .leaflet-pane,
            .leaflet-top,
            .leaflet-bottom {
              z-index: 0 !important;
            }
            .leaflet-control {
              z-index: 1 !important;
            }
          `}</style>
          <p className="text-xs text-zinc-400">
            Tap "Use Current Location" above to set your delivery point
            automatically.
          </p>
          {locationError && (
            <p className="text-sm font-medium text-red-500">{locationError}</p>
          )}
        </div>

        {error && <p className="text-sm font-medium text-red-500">{error}</p>}
      </div>

      <div className="mt-10">
        <Button
          className="h-12 w-full rounded-2xl bg-zinc-900 font-bold text-white shadow-lg hover:cursor-pointer hover:bg-zinc-800"
          onClick={handleConfirm}
          disabled={locating || !isWithinMagwayBounds(position[0], position[1])} // Location ရမှပဲ Button ပွင့်မယ်
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
