import { Outlet, useLocation } from "react-router-dom"
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion"

// Shadcn UI Components
import CustomerNavbar from "./components/CustomerNavbar"
import MobileNavbar from "./components/MobileNavbar"
import CustomerFooter from "./components/CustomerFooter"

export default function CustomerLayout() {
  const location = useLocation()

  // ─── 📜 SCROLL PROGRESS ENGINE ───
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  })

  return (
    <div className="flex min-h-screen flex-col bg-[#F9F9FB] font-sans text-zinc-900 antialiased">

      {/* ─── LUXURY FLOATING TOP NAVBAR ─── */}
      <CustomerNavbar scaleX={scaleX} />

      {/* ─── MAIN CONTENT AREA ─── */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-20 pb-24 md:px-8 md:pt-8 md:pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, scale: 0.98, y: 15, filter: 'blur(8px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.98, y: -15, filter: 'blur(8px)' }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ─── FOOTER ─── */}
      {(location.pathname === "/customer" || location.pathname === "/customer/") && <CustomerFooter />}

      {/* ─── MOBILE BOTTOM BAR ─── */}
      <MobileNavbar scaleX={scaleX} />
    
    </div>
  )
}
