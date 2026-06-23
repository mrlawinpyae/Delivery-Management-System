import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

interface CartItem {
  itemId: string
  name: string
  price: number
  quantity: number
  image: string
  restaurantId: string 
}

interface CartStore {
  items: Record<string, CartItem>
  addToCart: (item: CartItem) => void
  removeFromCart: (itemId: string) => void
  clearCart: () => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: {},
      addToCart: (item) =>
        set((state) => {
          const currentQty = state.items[item.itemId]?.quantity || 0
          return {
            items: {
              ...state.items,
              [item.itemId]: { ...item, quantity: currentQty + 1 },
            },
          }
        }),
      removeFromCart: (itemId) =>
        set((state) => {
          const newItems = { ...state.items }
          if (newItems[itemId]?.quantity > 1) {
            newItems[itemId].quantity -= 1
          } else {
            delete newItems[itemId]
          }
          return { items: newItems }
        }),
      clearCart: () => set({ items: {} }),
    }),
    {
      name: "customer-cart-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
)
