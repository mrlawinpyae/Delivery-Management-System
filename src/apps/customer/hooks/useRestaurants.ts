// src/apps/customer/hooks/useRestaurants.ts
import { useQuery } from "@tanstack/react-query"
import axios from "axios"

// 1. Get All Restaurants Hook
export function useRestaurants() {
  return useQuery({
    queryKey: ["restaurants"],
    queryFn: async () => {
      const { data } = await axios.get("/api/restaurants")
      return data.data
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
      const { data } = await axios.get(`/api/restaurants/${restaurantId}`)
      // This assumes the API now returns the full restaurant details
      // including a `menuItems` property, based on the suggested API improvement.
      return data.data
    },
    enabled: !!restaurantId,
  })
}
