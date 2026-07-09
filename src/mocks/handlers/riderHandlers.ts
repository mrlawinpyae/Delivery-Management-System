import { http, HttpResponse, delay } from "msw"

interface MockOrder {
  _id?: string
  orderId?: string
  status?: string
  totalAmount?: number
  deliveryAddress?: string
  deliveryLocation?: {
    address: string
    latitude: number
    longitude: number
  }
  shipping_phone?: string
  createdAt?: string
  customerId?: string
  customer?: {
    _id: string
    name: string
    image: string
  }
  restaurantId?: string
  pickupLocations?: Array<{
    _id: string
    name: string
    address: string
    coordinates: [number, number]
  }>
  items?: Array<{
    itemId: string
    name: string
    image: string
    quantity: number
    priceAtPurchase: number
  }>
}

// Seed initial orders in localStorage — always overwrites to stay in sync with latest mock data
const seedMockOrders = () => {
  const initialOrders: MockOrder[] = [
    {
      _id: "ord_1001",
      status: "PREPARING",
      totalAmount: 9000.0,
      deliveryLocation: {
        address: "UCSM Hostel, Room 302",
        latitude: 20.1504,
        longitude: 94.9301,
      },
      shipping_phone: "09785412596",
      createdAt: "2026-06-17T13:50:00Z",
      customer: {
        _id: "usr_cust_001",
        name: "Thiri",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80",
      },
      pickupLocations: [
        {
          _id: "merch_kky_09",
          name: "Khaing Khaing Kyaw",
          address: "Near UCSM, Magway",
          coordinates: [94.9330, 20.1510] as [number, number],
        },
        {
          _id: "merch_swe_02",
          name: "Swe Swe Myint Tea Shop",
          address: "Magway-Mandalay Road, Magway",
          coordinates: [94.9250, 20.1545] as [number, number],
        },
      ],
      items: [
        { itemId: "menu_mhn_01", name: "Mohinga Special", image: "", quantity: 1, priceAtPurchase: 4500 },
        { itemId: "menu_ko_02", name: "Kyay Oh", image: "", quantity: 1, priceAtPurchase: 4500 },
      ],
    },
    {
      _id: "ord_1002",
      status: "OUT_FOR_DELIVERY",
      totalAmount: 7500.0,
      deliveryLocation: {
        address: "No. 5, Bogyoke Street, Magway",
        latitude: 20.1478,
        longitude: 94.9265,
      },
      shipping_phone: "09456123789",
      createdAt: "2026-06-17T14:10:00Z",
      customer: {
        _id: "usr_cust_002",
        name: "Aung Ko",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
      },
      pickupLocations: [
        {
          _id: "merch_ygn_01",
          name: "Yoma Garden Restaurant",
          address: "Market Street, Magway",
          coordinates: [94.9210, 20.1495] as [number, number],
        },
      ],
      items: [
        { itemId: "menu_bph_03", name: "Biryani (Chicken)", image: "", quantity: 2, priceAtPurchase: 3000 },
        { itemId: "menu_las_04", name: "Lassi", image: "", quantity: 1, priceAtPurchase: 1500 },
      ],
    },
    {
      _id: "ord_1003",
      status: "PREPARING",
      totalAmount: 12500.0,
      deliveryLocation: {
        address: "Technological University Magway, Dorm Block C",
        latitude: 20.1992,
        longitude: 95.0078,
      },
      shipping_phone: "09789654321",
      createdAt: "2026-06-17T14:25:00Z",
      customer: {
        _id: "usr_cust_003",
        name: "Su Wai",
        image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80",
      },
      pickupLocations: [
        {
          _id: "merch_nrg_03",
          name: "Naung Yoe Cafe",
          address: "University Ave, Magway",
          coordinates: [94.9300, 20.1480] as [number, number],
        },
      ],
      items: [
        { itemId: "menu_sha_05", name: "Shan Noodles", image: "", quantity: 2, priceAtPurchase: 3500 },
        { itemId: "menu_tea_06", name: "Myanmar Milk Tea (L)", image: "", quantity: 3, priceAtPurchase: 1000 },
        { itemId: "menu_smp_07", name: "Samosa (x4)", image: "", quantity: 1, priceAtPurchase: 2000 },
      ],
    },
    {
      _id: "ord_1004",
      status: "DELIVERED",
      totalAmount: 5500.0,
      deliveryLocation: {
        address: "Shwe Thar Yar Quarter, Magway",
        latitude: 20.1445,
        longitude: 94.9185,
      },
      shipping_phone: "09971234567",
      createdAt: "2026-06-17T12:00:00Z",
      customer: {
        _id: "usr_cust_004",
        name: "Nay Lin",
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80",
      },
      pickupLocations: [
        {
          _id: "merch_hlm_04",
          name: "Hla May Pastry",
          address: "Chan Aye Tharzan Township, Magway",
          coordinates: [94.9195, 20.1460] as [number, number],
        },
      ],
      items: [
        { itemId: "menu_cke_08", name: "Chocolate Cake Slice", image: "", quantity: 2, priceAtPurchase: 1500 },
        { itemId: "menu_brd_09", name: "Butter Toast", image: "", quantity: 3, priceAtPurchase: 500 },
        { itemId: "menu_cfe_10", name: "Iced Americano", image: "", quantity: 2, priceAtPurchase: 1000 },
      ],
    },
    {
      _id: "ord_1005",
      status: "OUT_FOR_DELIVERY",
      totalAmount: 18000.0,
      deliveryLocation: {
        address: "No. 12, Strand Road, Magway",
        latitude: 20.1520,
        longitude: 94.9340,
      },
      shipping_phone: "09123456789",
      createdAt: "2026-06-17T15:00:00Z",
      customer: {
        _id: "usr_cust_005",
        name: "Phyo Wai",
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80",
      },
      pickupLocations: [
        {
          _id: "merch_gld_05",
          name: "Golden Myanmar Kitchen",
          address: "Zay Street, Magway",
          coordinates: [94.9220, 20.1500] as [number, number],
        },
        {
          _id: "merch_swe_02",
          name: "Swe Swe Myint Tea Shop",
          address: "Magway-Mandalay Road, Magway",
          coordinates: [94.9250, 20.1545] as [number, number],
        },
      ],
      items: [
        { itemId: "menu_frr_11", name: "Fried Rice (Large)", image: "", quantity: 3, priceAtPurchase: 4000 },
        { itemId: "menu_chk_12", name: "Grilled Chicken", image: "", quantity: 2, priceAtPurchase: 3000 },
        { itemId: "menu_tea_06", name: "Myanmar Milk Tea (L)", image: "", quantity: 2, priceAtPurchase: 1000 },
        { itemId: "menu_jce_13", name: "Fresh Sugar Cane Juice", image: "", quantity: 2, priceAtPurchase: 1000 },
      ],
    },
    {
      _id: "ord_1006",
      status: "PREPARING",
      totalAmount: 6500.0,
      deliveryLocation: {
        address: "Sein Pan Quarter, House 44, Magway",
        latitude: 20.1430,
        longitude: 94.9220,
      },
      shipping_phone: "09987654321",
      createdAt: "2026-06-17T15:20:00Z",
      customer: {
        _id: "usr_cust_006",
        name: "Aye Mya",
        image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80",
      },
      pickupLocations: [
        {
          _id: "merch_mys_06",
          name: "May Sabe Noodle Shop",
          address: "Yoma Road, Magway",
          coordinates: [94.9260, 20.1430] as [number, number],
        },
      ],
      items: [
        { itemId: "menu_nd1_14", name: "Noodle Soup (Beef)", image: "", quantity: 2, priceAtPurchase: 2500 },
        { itemId: "menu_egg_15", name: "Boiled Egg (x2)", image: "", quantity: 1, priceAtPurchase: 1500 },
      ],
    },
    {
      _id: "ord_1007",
      status: "DELIVERED",
      totalAmount: 22000.0,
      deliveryLocation: {
        address: "Magway University, Staff Quarters",
        latitude: 20.1361,
        longitude: 94.9350,
      },
      shipping_phone: "09741852963",
      createdAt: "2026-06-17T11:30:00Z",
      customer: {
        _id: "usr_cust_007",
        name: "Min Zaw",
        image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&h=150&q=80",
      },
      pickupLocations: [
        {
          _id: "merch_ygn_01",
          name: "Yoma Garden Restaurant",
          address: "Market Street, Magway",
          coordinates: [94.9210, 20.1495] as [number, number],
        },
        {
          _id: "merch_gld_05",
          name: "Golden Myanmar Kitchen",
          address: "Zay Street, Magway",
          coordinates: [94.9220, 20.1500] as [number, number],
        },
      ],
      items: [
        { itemId: "menu_frr_11", name: "Fried Rice (Large)", image: "", quantity: 4, priceAtPurchase: 4000 },
        { itemId: "menu_mtn_16", name: "Mutton Curry", image: "", quantity: 2, priceAtPurchase: 3000 },
      ],
    },
    {
      _id: "ord_1008",
      status: "PREPARING",
      totalAmount: 8800.0,
      deliveryLocation: {
        address: "Ah Nauk Quarter, Block 3, Magway",
        latitude: 20.1555,
        longitude: 94.9275,
      },
      shipping_phone: "09664455123",
      createdAt: "2026-06-17T15:45:00Z",
      customer: {
        _id: "usr_cust_008",
        name: "Ei Phyu",
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80",
      },
      pickupLocations: [
        {
          _id: "merch_nrg_03",
          name: "Naung Yoe Cafe",
          address: "University Ave, Magway",
          coordinates: [94.9300, 20.1480] as [number, number],
        },
      ],
      items: [
        { itemId: "menu_wfl_17", name: "Waffle with Honey", image: "", quantity: 2, priceAtPurchase: 2200 },
        { itemId: "menu_smt_18", name: "Smoothie (Mixed Fruit)", image: "", quantity: 2, priceAtPurchase: 1800 },
        { itemId: "menu_snd_19", name: "Club Sandwich", image: "", quantity: 1, priceAtPurchase: 2800 },
      ],
    },
    {
      _id: "ord_1009",
      status: "OUT_FOR_DELIVERY",
      totalAmount: 14500.0,
      deliveryLocation: {
        address: "Padauk Garden Condo, Unit 5B, Magway",
        latitude: 20.1490,
        longitude: 94.9310,
      },
      shipping_phone: "09552233441",
      createdAt: "2026-06-17T16:00:00Z",
      customer: {
        _id: "usr_cust_009",
        name: "Zin Moe",
        image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=150&h=150&q=80",
      },
      pickupLocations: [
        {
          _id: "merch_hlm_04",
          name: "Hla May Pastry",
          address: "Chan Aye Tharzan Township, Magway",
          coordinates: [94.9195, 20.1460] as [number, number],
        },
        {
          _id: "merch_mys_06",
          name: "May Sabe Noodle Shop",
          address: "Yoma Road, Magway",
          coordinates: [94.9260, 20.1430] as [number, number],
        },
      ],
      items: [
        { itemId: "menu_cke_08", name: "Chocolate Cake Slice", image: "", quantity: 3, priceAtPurchase: 1500 },
        { itemId: "menu_nd1_14", name: "Noodle Soup (Beef)", image: "", quantity: 2, priceAtPurchase: 2500 },
        { itemId: "menu_jce_13", name: "Fresh Sugar Cane Juice", image: "", quantity: 4, priceAtPurchase: 1000 },
      ],
    },
    {
      _id: "ord_1010",
      status: "DELIVERED",
      totalAmount: 11000.0,
      deliveryLocation: {
        address: "Shwe Pyi Aye Quarter, Magway",
        latitude: 20.1412,
        longitude: 94.9240,
      },
      shipping_phone: "09778899001",
      createdAt: "2026-06-17T10:45:00Z",
      customer: {
        _id: "usr_cust_010",
        name: "Kyaw Thu",
        image: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&h=150&q=80",
      },
      pickupLocations: [
        {
          _id: "merch_kky_09",
          name: "Khaing Khaing Kyaw",
          address: "Near UCSM, Magway",
          coordinates: [94.9330, 20.1510] as [number, number],
        },
      ],
      items: [
        { itemId: "menu_mhn_01", name: "Mohinga Special", image: "", quantity: 2, priceAtPurchase: 4500 },
        { itemId: "menu_egg_15", name: "Boiled Egg (x2)", image: "", quantity: 1, priceAtPurchase: 1500 },
        { itemId: "menu_las_04", name: "Lassi", image: "", quantity: 1, priceAtPurchase: 500 },
      ],
    },
  ]
  localStorage.setItem("mock_orders", JSON.stringify(initialOrders))
}

export const riderHandlers = [
  // 24. Get Assigned Orders
  http.get("/api/orders/:orderId/getAssignedOrders", async () => {
    seedMockOrders()
    await delay(600) // Simulate network latency

    const savedOrders = JSON.parse(localStorage.getItem("mock_orders") || "[]") as MockOrder[]

    // The backend should resolve the customerId and restaurantsId array into arrays of objects.
    // Ensure the structure matches the contract exactly.
    const resolvedOrders = savedOrders.map((order) => {
      // Map standard local orders if they are placed via the customer checkout
      const hasCustomer = !!order.customer
      const hasPickupLocations = !!order.pickupLocations

      return {
        _id: order._id || order.orderId || "ord_1003",
        status: order.status || "PREPARING",
        totalAmount: order.totalAmount || 9000.0,
        deliveryLocation: order.deliveryLocation || {
          address: order.deliveryAddress || "UCSM Hostel, Room 302",
          latitude: 20.1504,
          longitude: 94.9301,
        },
        shipping_phone: order.shipping_phone || "09785412596",
        createdAt: order.createdAt || "2026-06-17T13:50:00Z",
        customer: hasCustomer
          ? order.customer
          : {
              _id: order.customerId || "usr_cust_001",
              name: "Thiri",
              image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80",
            },
        pickupLocations: hasPickupLocations
          ? order.pickupLocations
          : [
              {
                _id: order.restaurantId || "merch_kky_09",
                name: "Khaing Khaing Kyaw",
                address: "Near UCSM, Magway",
                coordinates: [94.9330, 20.1510] as [number, number],
              },
            ],
        items: order.items || [
          {
            itemId: "menu_mhn_01",
            name: "Mohinga Special",
            image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80",
            quantity: 1,
            priceAtPurchase: 4500.0,
          },
          {
            itemId: "menu_ko_02",
            name: "Kyay Oh",
            image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=400&q=80",
            quantity: 1,
            priceAtPurchase: 4500.0,
          },
        ],
      }
    })

    return HttpResponse.json({
      message: "Assigned orders fetched successfully",
      data: resolvedOrders,
      error: null,
    })
  }),

  // Update Order Status (For interactive rider flows)
  http.put("/api/orders/:orderId/status", async ({ params, request }) => {
    const { orderId } = params as { orderId: string }
    const { status } = (await request.json()) as { status: string }

    await delay(500)

    const savedOrders = JSON.parse(localStorage.getItem("mock_orders") || "[]") as MockOrder[]
    const updatedOrders = savedOrders.map((order) => {
      if (order._id === orderId || order.orderId === orderId) {
        return { ...order, status }
      }
      return order
    })

    localStorage.setItem("mock_orders", JSON.stringify(updatedOrders))

    return HttpResponse.json({
      message: `Order status updated to ${status} successfully`,
      data: { orderId, status },
      error: null,
    })
  }),
]
