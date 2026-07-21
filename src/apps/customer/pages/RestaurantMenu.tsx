import { useParams, Link, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, AlertCircle } from "lucide-react"

import { useRestaurantDetails, useRestaurants } from "../hooks/useRestaurants"
import { useCartStore } from "../../../store/useCartStore"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function RestaurantMenu() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // Fetch both the restaurant list (to get details) and the menu items for this restaurant
  const { data: restaurants, isLoading: isRestaurantsLoading } = useRestaurants()
  const { data: menuItems, isLoading: isMenuLoading, error } = useRestaurantDetails(id)

  const isLoading = isRestaurantsLoading || isMenuLoading
  const restaurantInfo = restaurants?.find((r: any) => r.restaurantId === id)

  // Zustand Cart Store
  const cartItems = useCartStore((state) => state.items)
  const addToCart = useCartStore((state) => state.addToCart)

  const [seconds, setSeconds] = useState(3)

  // Auto-redirect logic for error
  useEffect(() => {
    if (error || (!isLoading && (!restaurantInfo || !menuItems))) {
      if (seconds > 0) {
        const timer = setTimeout(() => setSeconds(seconds - 1), 1000)
        return () => clearTimeout(timer)
      } else {
        navigate("/customer")
      }
    }
  }, [seconds, error, restaurantInfo, menuItems, isLoading, navigate])

  const handleIncrement = (item: any) => {
    addToCart({
      itemId: item.itemId,
      name: item.name,
      price: item.price,
      quantity: 1,
      image: item.image || "",
      restaurantId: id!,
    })
  }

  if (isLoading) {
    return (
      <div className="flex h-[50vh] animate-pulse items-center justify-center font-serif text-sm font-medium text-zinc-400 italic">
        Fetching curated menu list...
      </div>
    )
  }

  if (error || !restaurantInfo || !menuItems) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-6 p-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-red-500">
          <AlertCircle size={40} />
        </div>
        <div className="space-y-1">
          <h2 className="font-serif text-xl font-bold text-zinc-900">
            Kitchen Unavailable
          </h2>
          <p className="text-sm text-zinc-500">
            We couldn't find the restaurant you're looking for.
          </p>
        </div>

        <div className="text-xs font-medium text-zinc-400">
          Redirecting to Discover in{" "}
          <span className="font-bold text-zinc-900">{seconds}s</span>...
        </div>

        <Link to="/customer">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl border-zinc-200 hover:bg-zinc-50"
          >
            Return to Discover Now
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4">
      {/* Back Link & Shop Profile Banner */}
      <div className="space-y-4">
        <Link
          to="/customer"
          className="group inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-900 shadow-sm transition-all hover:border-zinc-300 hover:bg-zinc-50 hover:shadow-md active:scale-95"
        >
          <ArrowLeft
            size={14}
            className="transition-transform group-hover:-translate-x-1"
          />
          <span>Back to Discover</span>
        </Link>

        <div className="relative h-60 w-full overflow-hidden rounded-3xl">
          <img
            src={
              restaurantInfo.image ||
              "https://placehold.co/1200x400?text=Restaurant+Banner"
            }
            alt={restaurantInfo.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 p-8 text-white">
            <h1 className="font-serif text-3xl font-bold tracking-tight md:text-4xl">
              {restaurantInfo.name}
            </h1>
            <p className="mt-2 text-sm font-light text-zinc-200">
              • {restaurantInfo.address}
            </p>
          </div>
        </div>
      </div>

      {/* Menus List Section */}
      <div className="space-y-6">
        <div className="border-b border-zinc-100 pb-3">
          <h2 className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
            Curated Menu
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {(menuItems || []).map((item: any, index: number) => {
            const currentQty = cartItems[item.itemId]?.quantity || 0
            const isAvailable =
              item.isAvailable !== false && item.available !== false

            return (
              <motion.div
                key={item.itemId}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.04 }}
                className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200/60 bg-white transition-all hover:border-zinc-300 hover:shadow-md"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-zinc-100">
                  <img
                    loading="lazy"
                    src={item.image || "https://placehold.co/400x300?text=Food"}
                    alt={item.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {!isAvailable && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                      <Badge
                        variant="destructive"
                        className="px-3 py-1 font-bold"
                      >
                        SOLD OUT
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-4 flex-1 space-y-2">
                    <h3 className="line-clamp-1 font-serif text-lg font-bold text-zinc-900">
                      {item.name}
                    </h3>
                    <p className="line-clamp-2 text-sm leading-relaxed font-light text-zinc-500">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-auto flex items-center justify-between border-t border-zinc-100 pt-4">
                    <span className="font-semibold text-zinc-900 md:text-lg">
                      {item.price.toLocaleString()}
                      <span className="ml-1 text-xs font-medium text-zinc-500">
                        MMK
                      </span>
                    </span>

                    {/* Action Buttons */}
                    {currentQty === 0 ? (
                      <button
                        onClick={() => handleIncrement(item)}
                        disabled={!isAvailable}
                        className="flex items-center gap-1.5 rounded-full bg-zinc-900 px-4 py-2 text-xs font-bold text-white transition-all hover:cursor-pointer hover:bg-zinc-800 active:scale-95 disabled:opacity-50"
                      >
                        Add
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-emerald-700">
                        <span className="text-xs font-bold">
                          In Cart ({currentQty})
                        </span>
                        <Link
                          to="/customer/checkout"
                          className="text-[10px] underline hover:text-emerald-900"
                        >
                          View
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
