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

// ── Admin / Rider Management ──────────────────────────────────────────────────

export interface RiderVehicle {
  id: string
  riderId: string
  type: string
  licenceNumber: string
  createdAt: string
}

export interface RiderSummary {
  riderId: string
  name: string
  phone: string | null
  status: "AVAILABLE" | "BUSY" | "OFFLINE"
  image?: string
  email?: string
  vehicleType?: string
  licenceNumber?: string
  nrcNumber?: string
}

export interface CreateRiderPayload {
  name: string
  phone: string
  email: string
  password: string
  vehicleType: string
  licenceNumber: string
  nrcNumber: string
}

export interface UpdateRiderPayload {
  name?: string
  image?: string
  nrcNumber?: string
}

export interface UpdateVehiclePayload {
  type: string
  licenceNumber: string
}

export interface AdminOrder {
  orderId: string
  totalAmount: number
  status: OrderStatus
}
