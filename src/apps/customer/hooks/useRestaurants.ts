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
      const resShops = await axios.get("/api/restaurants")

      const currentShop = resShops.data.data.find(
        (r: any) => r.restaurantId === restaurantId
      )

      if (!currentShop) throw new Error("Restaurant not found")

      const resMenu = await axios.get(`/api/restaurants/${restaurantId}`)

      return {
        ...currentShop,
        menuItems: resMenu.data.data,
      }
    },
    enabled: !!restaurantId,
  })
}
