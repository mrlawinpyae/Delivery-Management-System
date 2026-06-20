// src/mocks/handlers.ts
import { http, HttpResponse } from "msw"

// ─── ၁။ Mock Data: Restaurants ───
const explicitRestaurants = [
  {
    restaurantId: "merch_kky_09",
    name: "Khaing Khaing Kyaw",
    image:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=500&q=80",
    address: "Near UCSM, Magway",
    latitude: 20.151,
    longitude: 94.933,
  },
  {
    restaurantId: "merch_cafe_01",
    name: "The UCSM Cafe & Bakery",
    image:
      "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=500&q=80",
    address: "Campus Main Gate",
    latitude: 20.152,
    longitude: 94.934,
  },
  {
    restaurantId: "merch_sushi_01",
    name: "Sakura Premium Sushi",
    image:
      "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&w=500&q=80",
    address: "Downtown Magway",
    latitude: 20.15,
    longitude: 94.93,
  },
]

// Auto-generate 27 more restaurants to make total 30
const generatedRestaurants = Array.from({ length: 27 }).map((_, index) => {
  const num = index + 4
  return {
    restaurantId: `merch_auto_${num}`,
    name: `Premium Kitchen ${num}`,
    image: `https://source.unsplash.com/random/500x300/?food&sig=${num}`,
    address: `Street ${num}, Magway`,
    latitude: 20.15 + Math.random() * 0.01,
    longitude: 94.93 + Math.random() * 0.01,
  }
})

const mockRestaurants = [...explicitRestaurants, ...generatedRestaurants]

// ─── ၂။ Mock Data: Menus ───

const mockMenus: Record<string, any[]> = {}

mockRestaurants.forEach((shop) => {
  mockMenus[shop.restaurantId] = [
    {
      itemId: `menu_${shop.restaurantId}_01`,
      name: `Signature Dish of ${shop.name}`, // ဆိုင်နာမည်အလိုက် ပြောင်းသွားပါမယ်
      description: `Chef's special recommendation at ${shop.name}.`,
      price: Math.floor(Math.random() * 5 + 3) * 1000, // 3000 - 7000 ကျပ်ကြား
      isAvailable: true,
      image:
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80",
    },
    {
      itemId: `menu_${shop.restaurantId}_02`,
      name: `${shop.name} Combo Set`, // ဆိုင်နာမည်နဲ့ Combo Set
      description: "A fulfilling meal with rice and premium side dishes.",
      price: Math.floor(Math.random() * 3 + 2) * 1000, // 2000 - 4000 ကျပ်ကြား
      isAvailable: true,
      image:
        "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=400&q=80",
    },
    {
      itemId: `menu_${shop.restaurantId}_03`,
      name: "Refreshing Seasonal Drink",
      description: "Cold and sweet drink to cool off the heat.",
      price: 2500,
      isAvailable: true,
      image:
        "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80",
    },
  ]
})

// ─── ၃။ API Handlers ───
export const handlers = [
  // 1. Get All Restaurants
  http.get("/api/restaurants", () => {
    return HttpResponse.json({
      message: "Restaurants fetched successfully",
      data: mockRestaurants,
      error: null,
    })
  }),

  // 2. Get Menus by Restaurant ID
  http.get("/api/restaurants/:restaurantId", ({ params }) => {
    const { restaurantId } = params as { restaurantId: string }
    const menu = mockMenus[restaurantId]

    if (!menu) {
      return HttpResponse.json(
        {
          message: "Action processing error",
          data: null,
          error: "Restaurant not found",
        },
        { status: 404 }
      )
    }

    return HttpResponse.json({
      message: "Menu fetched successfully",
      data: menu,
      error: null,
    })
  }),

  // 3. User Login
  http.post("/api/auth/login", async ({ request }) => {
    const body = (await request.json()) as any
    return HttpResponse.json({
      message: "Login successful",
      data: {
        userId: "usr_cust_001",
        name: body.email.split("@")[0],
        role: "CUSTOMER",
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
      },
      error: null,
    })
  }),
]
