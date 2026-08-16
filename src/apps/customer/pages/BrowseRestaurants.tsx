// src/apps/customer/pages/BrowseRestaurants.tsx
import { Link } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import { MapPin, Loader2 } from "lucide-react"
import { useEffect, useRef } from "react"

import { useInfiniteRestaurants } from "../hooks/useRestaurants"

// Shadcn UI Components
import { Card, CardContent } from "@/components/ui/card"
import { useSearch } from "@/context/SearchContext"
import restLogo from '../../../imgs/resturant_logo.jpg'

export default function BrowseRestaurants() {
  const { searchTerm } = useSearch()
  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteRestaurants(searchTerm)

  
  const observerTarget = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
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

  const filteredRestaurants = data?.pages.flat() || []
  if (isLoading) {
    return (
      <div className="flex h-[50vh] animate-pulse items-center justify-center font-serif text-sm font-medium text-zinc-400 italic">
        Curating premium kitchens near you...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-2 text-sm text-red-500">
        <span>Failed to load kitchens. Please check connection.</span>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <section className="space-y-6">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Use filteredRestaurants instead of restaurantList */}
          <AnimatePresence mode="popLayout">
            {filteredRestaurants.length > 0 ? (
              filteredRestaurants.map((shop: any) => (
                <motion.div
                  key={shop.restaurantId}
                  layout // Enables smooth reordering animations
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ y: -6 }}
                >
                  <Link
                    to={`/customer/restaurant/${shop.restaurantId}`}
                    className="group block"
                  >
                    <Card className="group relative h-80 overflow-hidden rounded-3xl border-0 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)]">
                      <div className="absolute inset-0 h-full w-full bg-zinc-900">
                        <img
                          src={shop.image || restLogo}
                          alt={shop.name}
                          className="h-full w-full object-cover opacity-80 transition-transform duration-1000 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
                      </div>

                      <CardContent className="absolute right-0 bottom-0 left-0 z-10 space-y-4 p-5 text-white">
                        <div className="space-y-1">
                          <h3 className="font-serif text-2xl font-bold tracking-tight text-white group-hover:text-amber-400">
                            {shop.name}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs font-light text-zinc-300">
                            <MapPin size={14} className="text-zinc-400" />
                            <span className="truncate">{shop.address}</span>
                          </div>
                        </div>
                        <div className="h-[1px] w-full bg-gradient-to-r from-white/30 to-transparent" />
                        <div className="flex items-center text-xs">
                          <span className="flex items-center gap-1.5 font-medium text-emerald-400">
                            <span className="relative flex h-2 w-2">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                            </span>
                            Open Now
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full py-20 text-center text-zinc-500"
              >
                No premium kitchens found matching "{searchTerm}"
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Infinite Scroll Target */}
        <div ref={observerTarget} className="flex w-full justify-center py-8">
          {isFetchingNextPage ? (
            <div className="flex items-center gap-2 text-zinc-400">
              <Loader2 className="animate-spin" size={20} />
              <span className="text-sm font-medium">
                Loading more kitchens...
              </span>
            </div>
          ) : hasNextPage ? (
            <div className="h-10" />
          ) : (
            filteredRestaurants.length > 0 && (
              <div className="py-4 text-center text-sm text-zinc-500">
                You've reached the end of the list.
              </div>
            )
          )}
        </div>
      </section>
    </div>
  )
}