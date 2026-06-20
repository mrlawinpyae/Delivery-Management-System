import { Link, useLocation } from "react-router-dom"
import { motion } from "framer-motion"
import { useNavItems } from "./CustomerNavbar" // အရင်က ခွဲထားတဲ့ items တွေကို ပြန်သုံးပါ

export default function MobileNavbar() {
  const location = useLocation()
  const navItems = useNavItems()
  return (
    <div className="fixed right-4 bottom-4 left-4 z-50 md:hidden">
      <div className="flex items-center justify-around rounded-3xl border border-zinc-200/60 bg-white/90 p-2 shadow-[0_8px_32px_rgba(0,0,0,0.05)] backdrop-blur-xl">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center gap-1 rounded-2xl px-4 py-2.5 transition-all"
            >
              <Icon
                size={18}
                className={`transition-colors duration-200 ${
                  isActive ? "text-zinc-900" : "text-zinc-400"
                }`}
                strokeWidth={isActive ? 2.5 : 2}
              />

              {item.badge && (
                <span className="absolute top-1.5 right-3 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-zinc-950 px-1 text-[8px] font-bold text-white">
                  {item.badge}
                </span>
              )}

              {isActive && (
                <motion.div
                  layoutId="luxuryMobileDot"
                  className="absolute bottom-1 h-1 w-1 rounded-full bg-zinc-900"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
