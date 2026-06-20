import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { MapPin, Phone, ArrowRight, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { z } from "zod"
import { isValidPhoneNumber } from "libphonenumber-js"
import {
  PhoneInput,
  defaultCountries,
  parseCountry,
} from "react-international-phone"
import "react-international-phone/style.css"
import { Input } from "@/components/ui/input"

const deliverySchema = z.object({
  phone: z.string().refine(
    (val) => {
      if (!val) return false
      return isValidPhoneNumber(val, "MM")
    },
    {
      message: "မှန်ကန်သော မြန်မာဖုန်းနံပါတ်ကို ထည့်သွင်းပေးပါ။",
    }
  ),
  address: z.string().min(5, "တည်နေရာ အပြည့်အစုံ ရိုက်ထည့်ပေးပါ"),
})
const myanmarCountry = defaultCountries.find(
  (c) => parseCountry(c).iso2 === "mm"
)
export default function DeliveryInfoPage() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = () => {
    // Validation စစ်ခြင်း
    const result = deliverySchema.safeParse({ phone, address })

    // if (!result.success) {
    //   setError(result.error.errors[0].message)
    //   return
    // }

    setError(null)
    console.log("Order confirmed:", result.data)
    navigate("/order-success")
  }

  return (
    <div className="mx-auto w-full max-w-lg px-6 py-10">
      <h1 className="mb-2 font-serif text-2xl font-bold">
        Delivery Information
      </h1>
      <p className="mb-8 text-sm text-zinc-500">
        Please provide your details for the rider.
      </p>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-zinc-900">
            <Phone size={16} /> Contact Phone
          </label>
          <PhoneInput
            defaultCountry="mm"
            countries={myanmarCountry ? [myanmarCountry] : undefined}
            value={phone}
            onChange={(phone) => setPhone(phone)}
            className="flex h-10 w-full rounded-md border border-input bg-transparent py-2 pl-3 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
            inputClassName="!border-none !bg-transparent !outline-none !ring-0 !px-2 !text-black"
            countrySelectorStyleProps={{
              buttonStyle: { border: "none", backgroundColor: "transparent" },
            }}
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-zinc-900">
            <MapPin size={16} /> Delivery Address
          </label>
          <textarea
            className="h-20 w-full rounded-xl border border-zinc-200 px-4 py-3 transition-all outline-none focus:ring-2 focus:ring-zinc-900"
            placeholder="Enter your full address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        {error && <p className="text-sm font-medium text-red-500">{error}</p>}
      </div>

      <div className="mt-10">
        <Button
          className="h-12 w-full rounded-2xl bg-zinc-900 font-bold text-white shadow-lg hover:cursor-pointer hover:bg-zinc-800"
          onClick={handleConfirm}
        >
          Confirm Order <ArrowRight size={18} className="ml-2" />
        </Button>
        <button
          onClick={() => navigate("/customer/checkout")}
          className="mt-4 flex w-full items-center justify-center gap-2 text-sm text-zinc-500 hover:cursor-pointer hover:underline"
        >
          <ArrowLeft size={16} /> Back to Checkout
        </button>
      </div>
    </div>
  )
}
