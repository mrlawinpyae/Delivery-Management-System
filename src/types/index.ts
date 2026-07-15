export type UserRole = "CUSTOMER" | "RIDER" | "ADMIN"
export type OrderStatus =
  | "PENDING"
  | "PREPARING"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"

export interface User {
  _id: string
  name: string
  image: string
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
  restaurantId: string
  name: string
  image: string
  quantity: number
  priceAtPurchase: number
}

export interface Order {
  orderId: string
  customerId?: string
  status: OrderStatus
  totalAmount: number
  deliveryAddress: string
  latitude?: number
  longitude?: number
  items: OrderItem[]
  createdAt?: string
}
