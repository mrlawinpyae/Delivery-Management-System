import { createBrowserRouter, Navigate } from "react-router-dom"
import CustomerLayout from "../apps/customer/CustomerLayout"
import MerchantLayout from "../apps/merchant/MerchantLayout"
import RiderLayout from "../apps/rider/RiderLayout"
import RestaurantMenu from "@/apps/customer/pages/RestaurantMenu"
import BrowseRestaurants from "@/apps/customer/pages/BrowseRestaurants"
import CheckoutPage from "@/apps/customer/pages/CheckoutPage"
import DeliveryInfoPage from "@/apps/customer/pages/DeliveryInfoPage"
import OrderHistoryPage from "@/apps/customer/pages/OrderHistoryPage"
import OrderDetailsPage from "@/apps/customer/pages/OrderDetailsPage"
import CustomerAuth from "@/apps/customer/pages/CustomerAuth"
import ProtectedRoute from "@/apps/customer/components/ProtectedRoute"
import GuestRoute from "@/apps/customer/components/GuestRoute"
import ProfileSettingsPage from "@/apps/customer/pages/ProfileSettingsPage"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/customer" replace />,
  },
  {
    element: <GuestRoute />,
    children: [
      {
        path: "/customer/login",
        element: <CustomerAuth />,
      },
    ],
  },
  // --- APP A: Customer Routes ---
  {
    path: "/customer",
    element: <CustomerLayout />,
    children: [
      {
        path: "",
        element: <BrowseRestaurants />,
      },
      {
        path: "restaurant/:id",
        element: <RestaurantMenu />,
      },
      {
        path: "checkout",
        element: <CheckoutPage />,
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: "delivery-info",
            element: <DeliveryInfoPage />,
          },
          {
            path: "order-history",
            element: <OrderHistoryPage />,
          },
          {
            path: "order/:id",
            element: <OrderDetailsPage />,
          },
          {
            path: "profile",
            element: <ProfileSettingsPage />,
          },
        ],
      },
    ],
  },
  // --- APP B: Merchant Routes ---
  {
    path: "/merchant",
    element: <MerchantLayout />,
    children: [
      {
        path: "",
        element: (
          <div className="rounded-xl bg-white p-6 shadow">
            <h2 className="mb-2 text-2xl font-bold text-zinc-800">
              Order Management
            </h2>
            <p className="text-zinc-600">
              Incoming Orders Dashboard will be here.
            </p>
          </div>
        ),
      },
    ],
  },
  // --- APP C: Rider Routes ---
  {
    path: "/rider",
    element: <RiderLayout />,
    children: [
      {
        path: "",
        element: (
          <div className="rounded-lg border border-stone-700 bg-stone-800 p-4">
            <h3 className="font-semibold text-yellow-500">
              Active Delivery Job
            </h3>
            <p className="text-sm text-stone-400">
              Rider Map and tasks will be here.
            </p>
          </div>
        ),
      },
    ],
  },
  // --- 404 Route ---
  {
    path: "*",
    element: (
      <div className="flex h-screen flex-col items-center justify-center gap-2">
        <h1 className="text-4xl font-bold">404</h1>
        <p>Page Not Found</p>
      </div>
    ),
  },
])
