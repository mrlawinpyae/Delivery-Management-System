import { createBrowserRouter, Navigate } from "react-router-dom"
import CustomerLayout from "../apps/customer/CustomerLayout"
import MerchantLayout from "../apps/merchant/MerchantLayout"
import RiderLayout from "../apps/rider/RiderLayout"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/customer" replace />, // Default အနေနဲ့ Customer App ဆီ ပို့ပေးမယ်
  },
  // --- APP A: Customer Routes ---
  {
    path: "/customer",
    element: <CustomerLayout />,
    children: [
      // {
      //   path: "",
      //   element: <RestaurantMenu />,
      // },
      // {
      //   path: "login",
      //   element: <CustomerLogin />,
      // },
      // {
      //   path: "checkout", 
      //   element: <CheckoutPage />,
      // },
      //   {
      //     path: "", // 1. ဆိုင်တွေအကုန်လုံး Browse လုပ်မယ့် အိမ်စာမျက်နှာ
      //     element: <BrowseRestaurants />,
      //   },
      //   {
      //     path: "restaurant/:id", // 2. ဆိုင်တစ်ခုချင်းစီရဲ့ Menu ပြမယ့်စာမျက်နှာ (Dynamic ID)
      //     element: <RestaurantMenu />,
      //   },
      //   {
      //     path: "checkout", // 3. ဖုန်းနံပါတ်နှင့် မြေပုံတည်နေရာထည့်ပြီး အော်ဒါတင်မယ့်စာမျက်နှာ
      //     element: <CheckoutPage />,
      //   },
      //   {
      //     path: "profile", // 4. Profile နှင့် မှာယူခဲ့ဖူးသော ရာဇဝင်ကြည့်ရန် စာမျက်နှာ
      //     element: <CustomerProfile />,
      //   },
      //   {
      //     path: "login", // 5. အကောင့်မရှိလျှင် ဝင်ခိုင်းမည့် စာမျက်နှာ
      //     element: <CustomerLogin />,
      //   }
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
