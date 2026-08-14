import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowLeft, Check, Copy, ExternalLink, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast, Toaster } from "sonner"
import { QRCodeSVG } from "qrcode.react"
import axios from "@/lib/axios"
import { useCartStore } from "@/store/useCartStore"
import { useAuthStore } from "@/store/useAuthStore"
import kpayLogo from '../../../../src/imgs/kpaylogo.png';

export default function PaymentPage() {
  const navigate = useNavigate()
  const location = useLocation()
  
  // Extract delivery info passed from DeliveryInfoPage
  const { phone, address, position } = location.state || {}
  
  if (!location.state) {
    navigate("/customer/delivery-info")
  }

  const { items, clearCart } = useCartStore()
  const user = useAuthStore((state) => state.user)

  const [formData, setFormData] = useState({
    payment_method: "mobile_banking",
    screenshot: null as File | null,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)

  const kpayPhone = "09454844898"

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(kpayPhone)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success("KPay number copied!")
  }

  const handleConfirmOrder = async () => {
    if (formData.payment_method === "mobile_banking" && !formData.screenshot) {
      toast.error("Please upload a payment screenshot.")
      return
    }

    setIsSubmitting(true)

    const customerId = user
      ? user.userId || (user as any).id || (user as any)._id
      : "GUEST"

    let paymentImgUrl = ""
    if (formData.screenshot) {
      const uploadFormData = new FormData()
      uploadFormData.append("file", formData.screenshot)

      try {
        const uploadResponse = await axios.post("/images/upload", uploadFormData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })

        paymentImgUrl =
          typeof uploadResponse.data === "string"
            ? uploadResponse.data
            : uploadResponse.data?.url ||
              uploadResponse.data?.data?.url ||
              uploadResponse.data?.img ||
              uploadResponse.data?.image ||
              ""
      } catch (error) {
        console.error("Error uploading screenshot:", error)
        toast.error("Failed to upload screenshot.")
        setIsSubmitting(false)
        return
      }
    }

    const orderData = {
      customerId,
      shippingPhone: phone,
      deliveryAddress: address,
      latitude: position?.lat,
      longitude: position?.lng,
      paymentImg: paymentImgUrl,
      items: Object.values(items).map((i) => ({
        menuItemId: i.itemId,
        restaurantId: i.restaurantId,
        name: i.name,
        image: i.image,
        quantity: i.quantity,
        priceAtPurchase: i.price,
      })),
    }

    try {
      const response = await axios.post("orders/v2/create", orderData)

      const { message, data } = response.data
      toast.success(message || "Order placed successfully!")
      
      clearCart()
      
      setTimeout(() => {
        navigate("/customer/order-history", { replace: true })
      }, 1500)
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        "Failed to place order. Please try again."
      toast.error(errorMessage)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg px-6 py-10">
      <Toaster position="top-center" richColors />
      <h1 className="mb-2 font-serif text-2xl font-bold">Payment Method</h1>
      <p className="mb-8 text-sm text-zinc-500">
        Please complete your payment by scanning the QR code or transferring to the KPay number below.
      </p>

      <div className="space-y-6">
        {/* 1. KPAY INTERFACE */}
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 bg-zinc-50 rounded-[2.5rem] border border-black/5 space-y-6 text-center"
          >
            <div className="inline-block p-4 bg-white rounded-3xl shadow-sm border border-black/5">
              <QRCodeSVG
                value="hQZLQlpQYXlhQE8C8FACEFECMTFXFglFSESJjSYGEBAfnwgEAQGfJAEwF919e88fe5458="
                size={150}
                level="M"
                imageSettings={{
                  src: kpayLogo,
                  height: 30,
                  width: 30,
                  excavate: true,
                }}
              />
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-black tracking-widest uppercase">
                KPay: {kpayPhone.replace(/(\d{2})(\d{3})(\d{3})(\d{3})/, "$1 $2 $3 $4")}
              </p>
              <p className="text-[9px] opacity-40 font-bold uppercase tracking-tighter italic">
                U La Win Pyae
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto pt-2">
              <a
                href={`kpay://transfer?phone=${kpayPhone}`}
                className="flex-1 flex items-center justify-center gap-2 bg-[#1258ef] hover:bg-blue-700 text-white text-[9px] font-black uppercase tracking-wider py-4 px-4 rounded-xl transition-all shadow-md active:scale-95"
              >
                Open KPay App <ExternalLink size={12} />
              </a>
              <button
                type="button"
                onClick={handleCopyNumber}
                className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-black text-[9px] font-black uppercase tracking-wider py-4 px-4 rounded-xl transition-all border border-black/5 active:scale-95"
              >
                {copied ? (
                  <>
                    Copied! <Check size={12} className="text-green-600" />
                  </>
                ) : (
                  <>
                    Copy KPay No. <Copy size={12} className="opacity-40" />
                  </>
                )}
              </button>
            </div>
            <div className="relative group pt-2">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setFormData({
                      ...formData,
                      screenshot: e.target.files[0],
                    })
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div
                className={`w-full py-8 border-2 border-dashed rounded-3xl transition-all ${
                  formData.screenshot
                    ? "border-green-500/30 bg-green-50/30"
                    : "border-black/5 bg-white group-hover:border-black/20"
                }`}
              >
                {!formData.screenshot ? (
                  <p className="text-[9px] font-black uppercase opacity-30 tracking-widest">
                    Upload Screenshot
                  </p>
                ) : (
                  <div className="flex items-center justify-center gap-3 px-6">
                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-black/10">
                      <img
                        src={URL.createObjectURL(formData.screenshot)}
                        className="w-full h-full object-cover"
                        alt="Screenshot preview"
                      />
                    </div>
                    <p className="text-[9px] font-bold uppercase truncate max-w-[150px]">
                      {formData.screenshot.name}
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setFormData({ ...formData, screenshot: null });
                      }}
                      className="text-red-500 font-bold ml-2 relative z-20 cursor-pointer hover:bg-red-50 p-1 rounded-md"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
      </div>

      <div className="mt-10">
        <Button
          className="h-12 w-full rounded-2xl bg-zinc-900 font-bold text-white shadow-lg hover:cursor-pointer hover:bg-zinc-800"
          onClick={handleConfirmOrder}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="animate-spin text-white" size={18} />
          ) : (
            "Confirm Order"
          )}
        </Button>
        <button
          onClick={() => navigate("/customer/delivery-info", { state: location.state })}
          className="mt-4 flex w-full items-center justify-center gap-2 text-sm text-zinc-500 hover:cursor-pointer hover:underline"
        >
          <ArrowLeft size={16} /> Back to Delivery Info
        </button>
      </div>
    </div>
  )
}
