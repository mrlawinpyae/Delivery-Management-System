// src/mocks/handlers.ts
import { http, HttpResponse } from "msw"

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


const mockMenus: Record<string, any[]> = {}

mockRestaurants.forEach((shop) => {
  mockMenus[shop.restaurantId] = [
    {
      itemId: `menu_${shop.restaurantId}_01`,
      name: `Signature Dish of ${shop.name}`,
      description: `Chef's special recommendation at ${shop.name}.`,
      price: Math.floor(Math.random() * 5 + 3) * 1000,
      isAvailable: true,
      image:
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80",
    },
    {
      itemId: `menu_${shop.restaurantId}_02`,
      name: `${shop.name} Combo Set`,
      description: "A fulfilling meal with rice and premium side dishes.",
      price: Math.floor(Math.random() * 3 + 2) * 1000,
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
export const mockOrders: any[] = [
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

    // Retrieve existing orders from localStorage
    const existingOrders = JSON.parse(
      localStorage.getItem("mock_orders") || "[]"
    )

    // Generate a new order with a stable orderId key
    const orderId = "ord_" + Math.random().toString(36).substr(2, 5)
    const newOrder = {
      orderId,
      status: "PENDING",
      ...body,
    }

    existingOrders.push(newOrder)
    localStorage.setItem("mock_orders", JSON.stringify(existingOrders))

    // Return the exact shape defined in API Contract #8
    return HttpResponse.json(
      {
        message: "Order placed successfully",
        data: { orderId, status: "PENDING" },
        error: null,
      },
      { status: 201 }
    )
  }),

  http.get("/api/orders/getUserOrders/:userId", () => {
    const savedOrders = JSON.parse(localStorage.getItem("mock_orders") || "[]")
    return HttpResponse.json({
      message: "Orders fetched successfully",
      data: savedOrders,
      error: null,
    })
  }),

  // 7. Get Order Details — API Contract #7
  http.get("/api/orders/getOrderDetails/:orderId", ({ params }) => {
    const { orderId } = params as { orderId: string }

    const savedOrders = JSON.parse(localStorage.getItem("mock_orders") || "[]")

    const order = savedOrders.find(
      (o: any) => o.orderId === orderId
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

    // Return the exact shape defined in API Contract #7
    return HttpResponse.json({
      message: "Order details fetched",
      data: {
        orderId: order.orderId,
        status: order.status,
        totalAmount: order.totalAmount,
        deliveryAddress: order.deliveryAddress,
        items: (order.items || []).map((item: any) => ({
          restaurantId: item.restaurantId,
          name: item.name,
          image: item.image,
          quantity: item.quantity,
          priceAtPurchase: item.priceAtPurchase,
        })),
      },
      error: null,
    })
  }),
]
