import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { Store, Utensils, ShoppingCart, Clock, MapPin, Phone } from "lucide-react"

import BrandLogo from "@/imgs/brand_logo.png"

export default function CustomerFooter() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  }

  return (
    <footer className="w-full bg-slate-900 text-white pt-16 pb-28 md:pb-8 mt-auto rounded-t-[3rem] border-t border-slate-700/50 shadow-[0_-15px_50px_-15px_rgba(0,0,0,0.5)] before:absolute before:inset-0 before:rounded-t-[3rem] before:pointer-events-none before:border-t before:border-white/5 relative">
      <div className="mx-auto max-w-7xl px-4 md:px-8 relative z-10">
        <motion.div 
          className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
        >
          
          {/* Column 1: Brand & About */}
          <motion.div variants={itemVariants} className="space-y-6">
            <div className="flex items-center gap-3">
              <img src={BrandLogo} alt="Magway Food Delivery Logo" className="h-10 w-auto object-contain rounded-full bg-white p-1" />
              <div className="flex flex-col justify-center">
                <span className="text-xl font-bold tracking-tight text-white leading-none">Magway</span>
                <span className="text-[10px] font-bold tracking-[0.15em] text-zinc-300 mt-1 leading-none uppercase">Food Delivery</span>
              </div>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-xs">
              Order your favorite food from restaurants in Magway City. Fast delivery, fresh meals, and easy checkout.
            </p>
          </motion.div>

          {/* Column 2: Shops */}
          <motion.div variants={itemVariants} className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Shops</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/customer" className="flex items-center gap-3 text-sm text-zinc-400 transition-colors hover:text-white">
                  <Store size={16} />
                  <span>Browse Restaurants</span>
                </Link>
              </li>
              {/* <li>
                <Link to="/customer" className="flex items-center gap-3 text-sm text-zinc-400 transition-colors hover:text-white">
                  <Utensils size={16} />
                  <span>Menu Categories</span>
                </Link>
              </li> */}
              <li>
                <Link to="/customer/checkout" className="flex items-center gap-3 text-sm text-zinc-400 transition-colors hover:text-white">
                  <ShoppingCart size={16} />
                  <span>Your Cart</span>
                </Link>
              </li>
              <li>
                <Link to="/customer/order-history" className="flex items-center gap-3 text-sm text-zinc-400 transition-colors hover:text-white">
                  <Clock size={16} />
                  <span>Track Your Orders</span>
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Column 3: Service Information */}
          <motion.div variants={itemVariants} className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Service Information</h3>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-sm text-zinc-400">
                <MapPin size={16} />
                <span>Magway City</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-zinc-400">
                <Clock size={16} />
                <span>9:00 AM - 9:00 PM</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-zinc-400">
                <Phone size={16} />
                <span>+95 09796412170</span>
              </li>
            </ul>
          </motion.div>



        </motion.div>

        {/* Bottom Bar */}
        <motion.div 
          className="mt-16 flex flex-col items-center justify-between border-t border-zinc-800 pt-8 sm:flex-row"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          viewport={{ once: true }}
        >
          <p className="text-xs text-zinc-500">
            © 2026 Magway Food Delivery. All rights reserved.
          </p>
          <p className="mt-4 flex items-center gap-1 text-xs text-zinc-500 sm:mt-0">
            Made with <span className="text-red-500">❤</span> in Magway
          </p>
        </motion.div>
      </div>
    </footer>
  )
}
