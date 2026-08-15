// src/apps/customer/hooks/useRestaurants.ts
import { useQuery, useInfiniteQuery } from "@tanstack/react-query"
import axios from "@/lib/axios"

// 1. Get All Restaurants Hook
export function useRestaurants() {
  return useQuery({
    queryKey: ["restaurants"],
    queryFn: async () => {
      const { data } = await axios.get("/restaurants")
      return data.data
    },
  })
}

// 1.5 Get Infinite Restaurants Hook
export function useInfiniteRestaurants(searchTerm: string = "") {
  return useInfiniteQuery({
    queryKey: ["restaurants", "infinite", searchTerm],
    queryFn: async ({ pageParam = 0 }) => {
      const endpoint = searchTerm
        ? `/restaurants/search?query=${encodeURIComponent(searchTerm)}&page=${pageParam}&size=10`
        : `/restaurants?page=${pageParam}&size=10`
      const { data } = await axios.get(endpoint)
      return data.data
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < 10) return undefined
      return allPages.length
    },
  })
}

// 2. Get Single Restaurant Menu Hook
// src/apps/customer/hooks/useRestaurants.ts

export function useRestaurantDetails(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ["restaurant", restaurantId],
    queryFn: async () => {
      // The `enabled` option ensures that `restaurantId` is a string here.
      const { data } = await axios.get(`/restaurants/${restaurantId}`)
      // This assumes the API now returns the full restaurant details
      // including a `menuItems` property, based on the suggested API improvement.
      return data.data
    },
    enabled: !!restaurantId,
  })
}
