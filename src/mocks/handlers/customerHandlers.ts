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
// Order များကို သိမ်းဆည်းရန် In-memory array
const mockOrders: any[] = [
  {
    orderId: "ord_1003",
    customerId: "usr_cust_001",
    restaurantsId: ["merch_kky_09", "merch_cafe_01", "merch_sushi_01"],
    status: "PREPARING",
    totalAmount: 9000.0,
    deliveryAddress: "UCSM Hostel, Room 302",
    items: [
      { name: "Mohinga Special", quantity: 1, priceAtPurchase: 4500.0 },
      { name: "Kyay Oh", quantity: 1, priceAtPurchase: 4500.0 },
    ],
    createdAt: "2026-06-17T13:50:00Z",
  },
]

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

  // 4. Make Order (API Contract 8)
  // http.post("/api/order/save-order", async ({ request }) => {
  //   const body = (await request.json()) as any
  //   const newOrder = {
  //     orderId: "ord_" + Math.random().toString(36).substr(2, 5),
  //     status: "PENDING",
  //     ...body,
  //   }
  //   mockOrders.push(newOrder)
  //   return HttpResponse.json(
  //     {
  //       message: "Order placed successfully",
  //       data: { orderId: newOrder.orderId, status: "PENDING" },
  //       error: null,
  //     },
  //     { status: 201 }
  //   )
  // }),
  http.post("/api/order/save-order", async ({ request }) => {
    const body = (await request.json()) as any

    // 1. လက်ရှိ LocalStorage ထဲက အော်ဒါတွေကို အရင်ယူမယ်
    const existingOrders = JSON.parse(
      localStorage.getItem("mock_orders") || "[]"
    )

    // 2. အော်ဒါအသစ် ဖန်တီးမယ်
    const newOrder = {
      _id: "ord_" + Math.random().toString(36).substr(2, 5),
      status: "PREPARING", // Backend က ပေးတဲ့ initial status
      ...body,
    }

    // 3. Array အသစ်ထဲကို Push လုပ်မယ်
    existingOrders.push(newOrder)

    // 4. LocalStorage ထဲကို ပြန်သိမ်းမယ်
    localStorage.setItem("mock_orders", JSON.stringify(existingOrders))

    return HttpResponse.json(
      {
        message: "Order placed successfully",
        data: { orderId: newOrder.orderId, status: "PREPARING" },
        error: null,
      },
      { status: 201 }
    )
  }),

  // 5. Order History ကို ပြန်ဆွဲထုတ်ဖို့ Handler အသစ်တစ်ခု ထပ်ထည့်ပေးရမယ်
  http.get("/api/orders/getUserOrders/:userId", () => {
    const savedOrders = JSON.parse(localStorage.getItem("mock_orders") || "[]")
    return HttpResponse.json({
      message: "Orders fetched successfully",
      data: savedOrders,
      error: null,
    })
  }),

  // 7. Get Order Details
  http.get("/api/orders/getOrderDetails/:orderId", ({ params }) => {
    const { orderId } = params as { orderId: string }

    // LocalStorage ထဲက အော်ဒါများအားလုံးကို ထုတ်ယူ
    const savedOrders = JSON.parse(localStorage.getItem("mock_orders") || "[]")

    // orderId နဲ့ ကိုက်ညီတဲ့ အော်ဒါကို ရှာဖွေခြင်း
    // (မှတ်ချက်: မင်းရဲ့ save-order မှာ _id နဲ့ သိမ်းထားရင် ဒီနေရာမှာ o._id နဲ့ စစ်ပါ)
    const order = savedOrders.find(
      (o: any) => o._id === orderId || o.orderId === orderId
    )

    if (!order) {
      return HttpResponse.json(
        {
          message: "Order not found",
          data: null,
          error: "Invalid order ID",
        },
        { status: 404 }
      )
    }

    // API Contract အတိုင်း ပြန်ပေးခြင်း
    return HttpResponse.json({
      message: "Order details fetched",
      data: {
        orderId: order.orderId || order._id,
        restaurantId: order.restaurantId || "merch_kky_09", // Mock data အတွက် default
        status: order.status,
        totalAmount: order.totalAmount,
        deliveryAddress:
          order.deliveryAddress || order.deliveryLocation?.address,
        items: order.items,
      },
      error: null,
    })
  }),
]
