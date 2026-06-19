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
  phone: string
  email: string
  role: UserRole
  createdAt: string
  token?: string // Frontend session အတွက် ထပ်ဖြည့်ထားခြင်း
}

export interface MenuItem {
  itemId: string
  name: string
  description: string
  price: number
  isAvailable: boolean
}

export interface Restaurant {
  _id: string
  name: string
  ownerId: string
  address: string
  location: {
    type: "Point"
    coordinates: [number, number] // [Longitude, Latitude]
  }
  menuItems: MenuItem[]
}

export interface OrderItem {
  itemId: string
  name: string
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
  items: OrderItem[]
  createdAt: string
}
