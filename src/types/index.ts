// src/types/index.ts

export type UserRole = "CUSTOMER" | "RIDER" | "ADMIN"
export type OrderStatus =
  | "PENDING"
  | "PREPARING"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"

export interface User {
  _id: string
  name: string
  image: string // ထည့်သွင်းထားသည်
  phone: string
  email: string
  passwordHash: string
  role: UserRole
  createdAt: string
  token?: string
}

export interface MenuItem {
  itemId: string
  name: string
  description: string
  image: string
  price: number
  isAvailable: boolean
}

export interface Restaurant {
  _id: string
  name: string
  ownerId: string
  image: string
  address: string
  location: {
    type: "Point"
    coordinates: [number, number]
  }
  menuItems: MenuItem[]
}

export interface OrderItem {
  itemId: string
  name: string
  image: string // Checkout မှာ ပြဖို့အတွက် ထည့်ထားသင့်သည်
  quantity: number
  priceAtPurchase: number
}

export interface Order {
  _id: string
  customerId: string
  merchantId: string
  riderId: string | null
  status: OrderStatus
  totalAmount: number
  deliveryLocation: {
    address: string
    latitude: number
    longitude: number
  }
  shipping_phone: number 
  items: OrderItem[]
  createdAt: string
}
