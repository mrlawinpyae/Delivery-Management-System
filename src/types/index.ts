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
  itemId: string
  name: string
  image: string
  quantity: number
  priceAtPurchase: number
}

export interface Order {
  _id: string
  customerId: string
  restaurantsId: Array<string>
  riderId: string | null
  status: OrderStatus
  totalAmount: number
  deliveryAddress: string
  deliveryLocation: {
    address: string
    latitude: number
    longitude: number
  }
  shipping_phone: string
  items: OrderItem[]
  createdAt: string
}
