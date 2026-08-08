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
import RoleGuard, { RoleRedirect } from "@/components/RoleGuard"
import ProfileSettingsPage from "@/apps/customer/pages/ProfileSettingsPage"
import RiderTasks from "@/apps/rider/pages/RiderTasks"
import RiderTaskDetails from "@/apps/rider/pages/RiderTaskDetails"
import RiderProfile from "@/apps/rider/pages/RiderProfile"
import AdminOrdersPage from "@/apps/merchant/pages/AdminOrdersPage"
import AdminRidersPage from "@/apps/merchant/pages/AdminRidersPage"
import AdminRestaurantsPage from "@/apps/merchant/pages/AdminRestaurantsPage"
import AdminRestaurantDetailsPage from "@/apps/merchant/pages/AdminRestaurantDetailsPage"
import AdminOrderDetailsPage from "@/apps/merchant/pages/AdminOrderDetailsPage"
import AdminAssignRiderPage from "@/apps/merchant/pages/AdminAssignRiderPage"
import AdminOrderRiderDetailsPage from "@/apps/merchant/pages/AdminOrderRiderDetailsPage"

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
  // --- APP A: Customer Routes (guests + CUSTOMER role only) ---
  {
    element: <RoleRedirect allowedRoles={["CUSTOMER"]} />,
    children: [
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
    ],
  },
  // --- APP B: Merchant Routes (ADMIN only) ---
  {
    element: <RoleGuard allowedRoles={["ADMIN"]} />,
    children: [
      {
        path: "/admin",
        element: <MerchantLayout />,
        children: [
          {
            path: "",
            element: <AdminOrdersPage />,
          },
          {
            path: "orders/:id",
            element: <AdminOrderDetailsPage />,
          },
          {
            path: "orders/:id/assign-rider",
            element: <AdminAssignRiderPage />,
          },
          {
            path: "orders/:id/rider-info",
            element: <AdminOrderRiderDetailsPage />,
          },
          {
            path: "riders",
            element: <AdminRidersPage />,
          },
          {
            path: "restaurants",
            element: <AdminRestaurantsPage />,
          },
          {
            path: "restaurants/:id",
            element: <AdminRestaurantDetailsPage />,
          },
        ],
      },
    ],
  },
  // --- APP C: Rider Routes (RIDER only) ---
  {
    element: <RoleGuard allowedRoles={["RIDER"]} />,
    children: [
      {
        path: "/rider",
        element: <RiderLayout />,
        children: [
          {
            path: "",
            element: <RiderTasks />,
          },
          {
            path: "profile",
            element: <RiderProfile />,
          },
          {
            path: ":id",
            element: <RiderTaskDetails />,
          },
        ],
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
