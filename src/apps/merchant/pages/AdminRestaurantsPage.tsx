import { useState, useRef, useCallback, useEffect } from "react"
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import { Link } from "react-router-dom"
import {
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Store,
  Upload,
  Loader2,
  LocateFixed,
} from "lucide-react"
import axios from "@/lib/axios"
import { toast } from "sonner"
import { getImageUrl } from "@/lib/utils"
import { GoogleMap, useLoadScript, OverlayView } from "@react-google-maps/api"
import restLogo from "../../../imgs/resturant_logo.jpg"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { isValidPhoneNumber } from "libphonenumber-js"
import {
  PhoneInput,
  defaultCountries,
  parseCountry,
} from "react-international-phone"
import "react-international-phone/style.css"

const myanmarCountry = defaultCountries.find(
  (c) => parseCountry(c).iso2 === "mm"
)

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string

const MAGWAY_CENTER = { lat: 20.1489, lng: 94.9211 }

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

function isWithinMagwayBounds(lat: number, lng: number) {
  return (
    lat >= MAGWAY_BOUNDS.south &&
    lat <= MAGWAY_BOUNDS.north &&
    lng >= MAGWAY_BOUNDS.west &&
    lng <= MAGWAY_BOUNDS.east
  )
}

function PulsingDot() {
  return (
    <div style={{ position: "relative", width: 24, height: 24 }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: "rgba(99,102,241,0.25)",
          animation: "ping 1.4s cubic-bezier(0,0,0.2,1) infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 4,
          borderRadius: "50%",
          background: "#6366f1",
          border: "2.5px solid white",
          boxShadow: "0 0 0 2px rgba(99,102,241,0.5)",
        }}
      />
      <style>{`@keyframes ping{75%,100%{transform:scale(2);opacity:0;}}`}</style>
    </div>
  )
}

// --- Types ---
interface Restaurant {
  restaurantId: string
  name: string
  phone?: string
  image: string
  address: string
  latitude: number
  longitude: number
}

interface RestaurantFormData {
  name: string
  phone: string
  image: string
  address: string
  latitude: number | ""
  longitude: number | ""
}

const defaultFormData: RestaurantFormData = {
  name: "",
  phone: "",
  image: "",
  address: "",
  latitude: "",
  longitude: "",
}

export default function AdminRestaurantsPage() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(
    null
  )
  const [formData, setFormData] = useState<RestaurantFormData>(defaultFormData)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [restaurantToDelete, setRestaurantToDelete] =
    useState<Restaurant | null>(null)

  const mapRef = useRef<google.maps.Map | null>(null)
  const [mapPosition, setMapPosition] = useState<{ lat: number; lng: number }>(
    MAGWAY_CENTER
  )
  const [locating, setLocating] = useState(false)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const skipReverseGeocodeRef = useRef(false)

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    language: "my",
    region: "MM",
  })

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map
  }, [])

  // --- Queries & Mutations ---
  const {
    data: restaurantsData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["admin-restaurants"],
    queryFn: async ({ pageParam = 0 }) => {
      const { data } = await axios.get(`/restaurants?page=${pageParam}&size=12`)
      return data.data as Restaurant[]
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < 12) return undefined
      return allPages.length
    },
  })

  const restaurants = restaurantsData?.pages.flat() || []

  const observerTarget = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  const createMutation = useMutation({
    mutationFn: async (newRestaurant: Partial<RestaurantFormData>) => {
      const { data } = await axios.post("/restaurants", newRestaurant)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-restaurants"] })
      toast.success("Restaurant created successfully")
      setIsModalOpen(false)
    },
    onError: (error: any) => {
      const resData = error?.response?.data
      if (resData?.message) {
        toast.error(resData.message)
      } else if (resData?.error && typeof resData.error === "string") {
        toast.error(resData.error)
      } else if (resData && typeof resData === "object") {
        const msgs = Object.values(resData)
          .filter((v) => typeof v === "string")
          .join(", ")
        toast.error(msgs || "Failed to create restaurant")
      } else {
        toast.error("Failed to create restaurant")
      }
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: Partial<RestaurantFormData>
    }) => {
      const response = await axios.put(`/restaurants/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-restaurants"] })
      toast.success("Restaurant updated successfully")
      setIsModalOpen(false)
    },
    onError: (error: any) => {
      const resData = error?.response?.data
      if (resData?.message) {
        toast.error(resData.message)
      } else if (resData?.error && typeof resData.error === "string") {
        toast.error(resData.error)
      } else if (resData && typeof resData === "object") {
        const msgs = Object.values(resData)
          .filter((v) => typeof v === "string")
          .join(", ")
        toast.error(msgs || "Failed to update restaurant")
      } else {
        toast.error("Failed to update restaurant")
      }
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/restaurants/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-restaurants"] })
      toast.success("Restaurant deleted successfully")
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to delete restaurant"
      )
    },
  })

  // --- Handlers ---
  const handleOpenModal = (restaurant?: Restaurant | any) => {
    if (restaurant) {
      setEditingRestaurant(restaurant)
      const latVal =
        Number(restaurant.latitude ?? restaurant.lat) || MAGWAY_CENTER.lat
      const lngVal =
        Number(restaurant.longitude ?? restaurant.lng ?? restaurant.long) ||
        MAGWAY_CENTER.lng

      setFormData({
        name: restaurant.name || restaurant.restaurantName || "",
        phone:
          restaurant.phone ||
          restaurant.phoneNumber ||
          restaurant.phone_number ||
          "",
        image:
          restaurant.image ||
          restaurant.img ||
          restaurant.photo ||
          restaurant.imageUrl ||
          "",
        address: restaurant.address || restaurant.location || "",
        latitude: latVal,
        longitude: lngVal,
      })
      setMapPosition({ lat: latVal, lng: lngVal })
    } else {
      setEditingRestaurant(null)
      setFormData(defaultFormData)
      setMapPosition(MAGWAY_CENTER)
    }
    setIsModalOpen(true)
  }

  // Reverse geocode whenever map position changes while modal is open
  useEffect(() => {
    if (!isModalOpen) return
    if (skipReverseGeocodeRef.current) {
      skipReverseGeocodeRef.current = false
      return
    }
    const fetchAddress = async () => {
      setIsGeocoding(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${mapPosition.lat}&lon=${mapPosition.lng}&zoom=18&addressdetails=1`
        )
        const data = await res.json()
        const generatedAddress =
          data.display_name || "Selected Location, Magway"
        setFormData((prev) => ({
          ...prev,
          address: generatedAddress,
          latitude: mapPosition.lat,
          longitude: mapPosition.lng,
        }))
      } catch (err) {
        console.error("Reverse geocoding error:", err)
      } finally {
        setIsGeocoding(false)
      }
    }
    fetchAddress()
  }, [mapPosition, isModalOpen])

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const newLat = Number(e.latLng.lat().toFixed(6))
      const newLng = Number(e.latLng.lng().toFixed(6))
      setMapPosition({ lat: newLat, lng: newLng })
      setFormData((prev) => ({
        ...prev,
        latitude: newLat,
        longitude: newLng,
      }))
    }
  }

  const handleUseCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Location services are not available on this device.")
      return
    }

    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setLocating(false)

        if (!isWithinMagwayBounds(latitude, longitude)) {
          toast.error("Your current location is outside Magway region.")
          return
        }

        const newPos = { lat: latitude, lng: longitude }
        setMapPosition(newPos)
        mapRef.current?.panTo(newPos)
        mapRef.current?.setZoom(16)
      },
      (err) => {
        setLocating(false)
        if (err.code === err.PERMISSION_DENIED) {
          toast.error("Location permission was denied.")
        } else {
          toast.error("Could not fetch current location.")
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    let finalPhone = formData.phone
    if (!finalPhone || finalPhone === "+95") {
      finalPhone = ""
    } else if (!isValidPhoneNumber(finalPhone, "MM")) {
      toast.error("Please enter a valid Myanmar phone number.")
      return
    }

    if (!formData.name?.trim()) {
      toast.error("Restaurant name is required.")
      return
    }

    if (formData.latitude === "" || formData.longitude === "") {
      toast.error("Please provide both latitude and longitude.")
      return
    }

    const payload = { ...formData, phone: finalPhone }

    if (editingRestaurant) {
      const restId =
        editingRestaurant.restaurantId ||
        (editingRestaurant as any)._id ||
        (editingRestaurant as any).id
      updateMutation.mutate({ id: restId, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const confirmDelete = () => {
    if (!restaurantToDelete) return
    const restId =
      restaurantToDelete.restaurantId ||
      (restaurantToDelete as any)._id ||
      (restaurantToDelete as any).id
    deleteMutation.mutate(restId, {
      onSettled: () => setRestaurantToDelete(null),
    })
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file")
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB")
      return
    }

    const uploadFormData = new FormData()
    uploadFormData.append("file", file)

    setIsUploadingImage(true)
    const toastId = toast.loading("Uploading image...")

    try {
      const response = await axios.post("/images/upload", uploadFormData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      const uploadedUrl =
        typeof response.data === "string"
          ? response.data
          : response.data?.url ||
            response.data?.data?.url ||
            response.data?.img ||
            response.data?.image ||
            ""

      if (uploadedUrl) {
        setFormData((prev) => ({ ...prev, image: uploadedUrl }))
        toast.success("Image uploaded successfully", { id: toastId })
      } else {
        toast.error("Failed to parse uploaded image URL", { id: toastId })
      }
    } catch (error) {
      console.error("Error uploading image:", error)
      toast.error("Failed to upload image", { id: toastId })
    } finally {
      setIsUploadingImage(false)
      e.target.value = ""
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const newValue =
      name === "latitude" || name === "longitude"
        ? value === ""
          ? ""
          : Number(value)
        : value

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }))

    if (name === "latitude" && value !== "") {
      const lat = Number(value)
      if (!isNaN(lat)) {
        skipReverseGeocodeRef.current = true
        setMapPosition((prev) => {
          const newPos = { lat, lng: prev.lng }
          mapRef.current?.panTo(newPos)
          return newPos
        })
      }
    }

    if (name === "longitude" && value !== "") {
      const lng = Number(value)
      if (!isNaN(lng)) {
        skipReverseGeocodeRef.current = true
        setMapPosition((prev) => {
          const newPos = { lat: prev.lat, lng }
          mapRef.current?.panTo(newPos)
          return newPos
        })
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Restaurants
          </h1>
          <p className="text-sm text-slate-500">
            Manage partner restaurants and their details.
          </p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="group h-9 rounded-md bg-slate-900 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800"
        >
          <Plus className="mr-2 h-4 w-4" strokeWidth={2} />
          Add Restaurant
        </Button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card
              key={i}
              className="animate-pulse overflow-hidden rounded-2xl border-0 shadow-sm"
            >
              <div className="h-48 bg-slate-200" />
              <CardContent className="space-y-3 p-5">
                <div className="h-5 w-2/3 rounded bg-slate-200" />
                <div className="h-4 w-full rounded bg-slate-100" />
                <div className="h-4 w-1/2 rounded bg-slate-100" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {restaurants.map((restaurant) => (
              <motion.div
                key={restaurant.restaurantId}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="flex h-full flex-col gap-0 overflow-hidden rounded-xl border border-slate-200/60 bg-white p-0 shadow-sm transition-all hover:shadow-md">
                  <div className="relative h-48 w-full shrink-0 bg-slate-50">
                    <img
                      src={restaurant.image ? getImageUrl(restaurant.image) : restLogo}
                      alt={restaurant.name}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Body */}
                  <div className="flex flex-1 flex-col p-5">
                    <div className="mb-6 space-y-2">
                      <h3 className="line-clamp-1 text-lg font-semibold text-slate-900">
                        {restaurant.name}
                      </h3>
                      <div className="flex items-start gap-2 text-sm text-slate-500">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                        <span className="line-clamp-2 leading-relaxed">
                          {restaurant.address}
                        </span>
                      </div>
                    </div>

                    {/* Footer with Actions */}
                    <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
                      <Link
                        to={`/admin/restaurants/${restaurant.restaurantId || (restaurant as any)._id || (restaurant as any).id}`}
                        className="flex-1"
                      >
                        <Button className="w-full cursor-pointer bg-slate-900 text-white transition-colors hover:bg-slate-800">
                          Manage Menus
                        </Button>
                      </Link>

                      <div className="flex shrink-0 items-center gap-1.5">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 text-slate-500 hover:text-slate-900"
                          onClick={() => handleOpenModal(restaurant)}
                          title="Edit Restaurant"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                          onClick={() => setRestaurantToDelete(restaurant)}
                          title="Delete Restaurant"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
            {restaurants.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500">
                No restaurants found. Click "Add Restaurant" to create one.
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Infinite Scroll Target */}
      <div ref={observerTarget} className="flex w-full justify-center py-4">
        {isFetchingNextPage ? (
          <div className="flex items-center gap-2 text-slate-500">
            <Loader2 className="animate-spin" size={16} />
            <span className="text-sm">Loading more...</span>
          </div>
        ) : hasNextPage ? (
          <div className="h-4" />
        ) : null}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-xl border border-slate-200/60 bg-white p-5 shadow-lg sm:max-w-[520px]">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
            noValidate
          >
            <DialogHeader className="border-b border-slate-100 pb-1">
              <DialogTitle className="text-lg font-bold text-slate-900">
                {editingRestaurant ? "Edit Restaurant" : "Add Restaurant"}
              </DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 gap-3.5 pt-1 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <Label
                  htmlFor="name"
                  className="text-xs font-semibold text-slate-700"
                >
                  Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Riverside Cafe"
                  className="h-9 rounded-md border-slate-300 text-sm"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label
                  htmlFor="phone"
                  className="text-xs font-semibold text-slate-700"
                >
                  Phone
                </Label>
                <PhoneInput
                  defaultCountry="mm"
                  countries={myanmarCountry ? [myanmarCountry] : undefined}
                  value={formData.phone}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, phone: value }))
                  }
                  className="flex h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm transition-colors focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900"
                  inputClassName="!border-none !bg-transparent !outline-none !ring-0 !px-1.5 !text-sm !text-slate-900 !font-medium h-full w-full"
                  countrySelectorStyleProps={{
                    buttonStyle: {
                      border: "none",
                      backgroundColor: "transparent",
                      height: "100%",
                    },
                  }}
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs font-semibold text-slate-700">
                  Restaurant Image
                </Label>
                <div className="flex items-center gap-3">
                  <div className="relative flex h-14 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                    {formData.image ? (
                      <img
                        src={getImageUrl(formData.image)}
                        alt="Restaurant Preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <Store className="h-5 w-5" />
                        <span className="text-[9px] font-medium">No Image</span>
                      </div>
                    )}
                    {isUploadingImage && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white backdrop-blur-[1px]">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col gap-1">
                    <label className="inline-flex w-fit cursor-pointer items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs transition-colors hover:bg-slate-50">
                      <Upload className="h-3.5 w-3.5 text-slate-500" />
                      <span>
                        {formData.image ? "Change Image" : "Upload Image"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        disabled={isUploadingImage}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[10px] text-slate-500">
                      JPG, PNG, or WEBP up to 2MB.
                    </p>
                  </div>
                </div>
              </div>

              {/* Location Picker Header */}
              <div className="space-y-1.5 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <MapPin className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Select Location on Map</span>
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleUseCurrentLocation}
                    disabled={locating}
                    className="h-7 gap-1 rounded-md px-2 text-[11px] font-medium text-slate-700"
                  >
                    {locating ? (
                      <Loader2
                        size={11}
                        className="animate-spin text-slate-500"
                      />
                    ) : (
                      <LocateFixed size={11} className="text-indigo-600" />
                    )}
                    {locating ? "Locating..." : "Use GPS"}
                  </Button>
                </div>

                {/* Google Map */}
                <div className="relative h-44 w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                  {!isLoaded ? (
                    <div className="flex h-full w-full items-center justify-center">
                      <Loader2
                        className="animate-spin text-slate-400"
                        size={20}
                      />
                    </div>
                  ) : (
                    <GoogleMap
                      mapContainerStyle={MAP_CONTAINER_STYLE}
                      center={mapPosition}
                      zoom={15}
                      options={MAP_OPTIONS}
                      onLoad={onMapLoad}
                      onClick={handleMapClick}
                    >
                      <OverlayView
                        position={mapPosition}
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
                <p className="text-[10px] text-slate-400">
                  Click anywhere on the map to place the location pin.
                </p>
              </div>

              {/* Auto-Generated Address Field */}
              <div className="space-y-1 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="address"
                    className="text-xs font-semibold text-slate-700"
                  >
                    Address
                  </Label>
                  {isGeocoding && (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-indigo-600">
                      <Loader2 size={10} className="animate-spin" /> Detecting
                      address...
                    </span>
                  )}
                </div>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter address manually or select from map..."
                  className="h-9 rounded-md border-slate-300 text-sm text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <Label
                  htmlFor="latitude"
                  className="text-xs font-semibold text-slate-700"
                >
                  Latitude
                </Label>
                <Input
                  id="latitude"
                  name="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={handleChange}
                  placeholder="20.1451"
                  className="h-9 rounded-md border-slate-300 font-mono text-sm text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <Label
                  htmlFor="longitude"
                  className="text-xs font-semibold text-slate-700"
                >
                  Longitude
                </Label>
                <Input
                  id="longitude"
                  name="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={handleChange}
                  placeholder="94.9312"
                  className="h-9 rounded-md border-slate-300 font-mono text-sm text-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-md px-4 text-xs font-medium"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-9 rounded-md bg-slate-900 px-5 text-xs font-medium text-white shadow-xs transition-colors hover:bg-slate-800 disabled:opacity-50"
                disabled={
                  createMutation.isPending ||
                  updateMutation.isPending ||
                  isUploadingImage
                }
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving..."
                  : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modern Delete Confirmation Alert Dialog */}
      <AlertDialog
        open={!!restaurantToDelete}
        onOpenChange={(open) => !open && setRestaurantToDelete(null)}
      >
        <AlertDialogContent className="rounded-xl border border-slate-200/60 bg-white p-6 shadow-lg sm:max-w-[400px]">
          <AlertDialogHeader className="space-y-3 text-center sm:text-left">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-600 sm:mx-0">
              <Trash2 className="h-6 w-6" />
            </div>
            <AlertDialogTitle className="text-lg font-bold text-slate-900">
              Delete Restaurant?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed text-slate-500">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-slate-900">
                "{restaurantToDelete?.name}"
              </span>
              ? This action cannot be undone and will remove all associated
              menus and data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex gap-2 sm:gap-3">
            <AlertDialogCancel className="h-10 rounded-xl border-slate-200 font-medium text-slate-700 hover:bg-slate-50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="h-10 rounded-xl bg-rose-600 font-medium text-white shadow-sm transition-all hover:bg-rose-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Restaurant"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
