import { Link, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Minus, ArrowRight, ShoppingBag } from "lucide-react"

import { useCartStore } from "../../../store/useCartStore"
import { Button } from "@/components/ui/button"

export default function CheckoutPage() {
  const { items, addToCart, removeFromCart } = useCartStore()

  const cartArray = Object.values(items)

  const totalAmount = cartArray.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )
  let navigate = useNavigate()
  if (cartArray.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100">
          <ShoppingBag size={34} className="text-zinc-400" />
        </div>

        <h2 className="font-serif text-2xl font-bold">Your cart is empty</h2>

        <p className="mt-2 text-sm text-zinc-500">
          Start ordering your favorite meals.
        </p>

        <Link to="/customer" className="mt-6">
          <Button variant="outline" className="rounded-xl">
            Discover Restaurants
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Heading */}

      <h1 className="mb-6 font-serif text-2xl font-bold text-zinc-900 sm:text-3xl">
        Your Order
      </h1>

      {/* Cart */}

      <div className="space-y-4">
        <AnimatePresence>
          {cartArray.map((item) => (
            <motion.div
              key={item.itemId}
              initial={{
                opacity: 0,
                y: 15,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -15,
              }}
              transition={{
                duration: 0.2,
              }}
              className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start gap-4">
                {/* Image */}

                <img
                  src={item.image}
                  alt={item.name}
                  className="h-20 w-20 flex-shrink-0 rounded-xl object-cover"
                />

                {/* Content */}

                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-2 text-sm font-semibold text-zinc-900 sm:text-base">
                    {item.name}
                  </h3>

                  <p className="mt-1 text-sm text-zinc-500">
                    {item.price.toLocaleString()} MMK each
                  </p>

                  <p className="mt-2 text-lg font-bold text-zinc-900">
                    {(item.price * item.quantity).toLocaleString()} MMK
                  </p>
                </div>
              </div>

              {/* Bottom Row */}

              <div className="mt-4 flex items-center justify-end">
                <div className="flex items-center gap-4 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2">
                  <button
                    onClick={() => removeFromCart(item.itemId)}
                    className="transition hover:cursor-pointer hover:text-red-500"
                  >
                    <Minus size={16} />
                  </button>

                  <span className="min-w-[20px] text-center font-semibold">
                    {item.quantity}
                  </span>

                  <button
                    onClick={() => addToCart(item)}
                    className="transition hover:cursor-pointer hover:text-green-600"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Summary */}
      <div className="mt-8 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
        {/* Summary Section */}
        <div className="space-y-4">
          <div className="flex justify-between text-sm text-zinc-500">
            <span>Subtotal</span>
            <span className="font-medium text-zinc-900">
              {totalAmount.toLocaleString()} MMK
            </span>
          </div>

          <div className="flex justify-between text-sm text-zinc-500">
            <span>Delivery Fee</span>
            <span className="text-zinc-600">To be paid to Rider</span>
          </div>

          <div className="flex justify-between border-t border-zinc-200 pt-4 text-lg font-bold">
            <span>Order Total</span>
            <span className="text-zinc-900">
              {totalAmount.toLocaleString()} MMK (+ Delivery)
            </span>
          </div>
        </div>

        {/* Order Button */}
        <Button
          className="mt-6 h-12 w-full rounded-2xl bg-zinc-900 text-base font-semibold text-white hover:cursor-pointer hover:bg-zinc-800"
          onClick={() => {
            // ဒီနေရာမှာ Next Page (ဥပမာ: /checkout/delivery-info) ကို သွားအောင် လုပ်ပါ
            navigate("/checkout/delivery-info")
          }}
        >
          Checkout <ArrowRight size={18} className="ml-2" />
        </Button>
      </div>
    </div>
  )
}
