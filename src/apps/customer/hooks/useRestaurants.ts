// src/apps/customer/hooks/useRestaurants.ts
import { useQuery } from "@tanstack/react-query"
import axios from "axios"

// 1. Get All Restaurants Hook
export function useRestaurants() {
  return useQuery({
    queryKey: ["restaurants"],
    queryFn: async () => {
      // မည်သည့် custom instance မျှမသုံးဘဲ standard axios ဖြင့် တိုက်ရိုက်ခေါ်ယူခြင်း
      const { data } = await axios.get("/api/restaurants")
      return data.data // Contract အရ array က data variable ထဲမှာ ရှိနေလို့ပါ
    },
  })
}

// 2. Get Single Restaurant Menu Hook
// src/apps/customer/hooks/useRestaurants.ts

export function useRestaurantDetails(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ["restaurant", restaurantId],
    queryFn: async () => {
      // ၁။ အရင်ဆုံး ဆိုင်အားလုံးကို Fetch ပါ
      const resShops = await axios.get("/api/restaurants")

      // ၂။ ရှာတဲ့နေရာမှာ _id အစား restaurantId နဲ့ ရှာပါ (Contract နှင့် ကိုက်ညီအောင်)
      const currentShop = resShops.data.data.find(
        (r: any) => r.restaurantId === restaurantId
      )

      if (!currentShop) throw new Error("Restaurant not found")

      // ၃။ Menu ကို fetch ပါ
      const resMenu = await axios.get(`/api/restaurants/${restaurantId}`)

      // ၄။ ရလာတဲ့ Data ကို return လုပ်ပါ
      return {
        ...currentShop,
        menuItems: resMenu.data.data, // ဒါက RestaurantMenu.tsx မှာ သုံးမယ့် key
      }
    },
    enabled: !!restaurantId, // id ရှိမှသာ ခေါ်ပါ
  })
}
