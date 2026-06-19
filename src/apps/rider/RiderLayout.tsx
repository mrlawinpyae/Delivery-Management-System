import { Outlet, NavLink } from "react-router-dom"
import { Bike, DollarSign, ClipboardList } from "lucide-react"

export default function RiderLayout() {
  return (
    // 🌐 Layout တစ်ခုလုံးကို Dark Theme (stone-950) နဲ့ Full Screen ဖွင့်ပေးလိုက်ပါတယ်
    <div className="flex min-h-screen w-full flex-col bg-stone-950 text-stone-100 md:flex-row">
      {/* 🖥️ SIDEBAR / HEADER: Mobile မှာ အပေါ်ကပ်နေပြီး Desktop မှာ ဘေးတိုက် Sidebar ဖြစ်သွားမယ် */}
      <aside className="sticky top-0 z-50 flex w-full flex-shrink-0 flex-col justify-between border-b border-stone-800 bg-stone-900 p-4 md:h-screen md:w-64 md:border-r md:border-b-0">
        {/* Top Branding Section */}
        <div className="flex w-full items-center justify-between md:flex-col md:items-start md:gap-6">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-yellow-500 p-1.5 text-stone-950">
              <Bike size={20} className="animate-pulse" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-wide text-stone-100">
                Rider Portal
              </h1>
              <p className="text-[10px] font-semibold tracking-wider text-yellow-500 uppercase">
                Duty: Active
              </p>
            </div>
          </div>

          {/* Today's Earnings Badge */}
          <div className="flex items-center gap-1 rounded-full border border-stone-700 bg-stone-800 px-3 py-1 md:mt-2 md:w-full md:justify-center">
            <DollarSign size={14} className="text-emerald-500" />
            <span className="text-xs font-bold text-emerald-400">12,500 K</span>
          </div>
        </div>

        {/* 🖥️ Desktop Navigation Links (စခရင်ကြီး `md:` မှသာ ပေါ်မယ်) */}
        <nav className="mt-8 hidden w-full flex-1 flex-col gap-2 md:flex">
          <NavLink
            to="/rider"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                isActive
                  ? "bg-yellow-500 font-bold text-stone-950"
                  : "text-stone-400 hover:bg-stone-800 hover:text-stone-200"
              }`
            }
          >
            <ClipboardList size={20} />
            <span>Available Jobs</span>
          </NavLink>

          <NavLink
            to="/rider/map"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                isActive
                  ? "bg-yellow-500 font-bold text-stone-950"
                  : "text-stone-400 hover:bg-stone-800 hover:text-stone-200"
              }`
            }
          >
            <Bike size={20} />
            <span>Navigation Map</span>
          </NavLink>

          <NavLink
            to="/rider/earnings"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                isActive
                  ? "bg-yellow-500 font-bold text-stone-950"
                  : "text-stone-400 hover:bg-stone-800 hover:text-stone-200"
              }`
            }
          >
            <DollarSign size={20} />
            <span>Earnings History</span>
          </NavLink>
        </nav>
      </aside>

      {/* 📍 MAIN CONTENT AREA: Main content က ညာဘက်ခြမ်းမှာ ကျယ်ကျယ်ပြန့်ပြန့် နေရာယူမယ် */}
      <main className="mx-auto w-full max-w-7xl flex-1 overflow-y-auto p-4 pb-24 md:p-8 md:pb-8">
        <Outlet />
      </main>

      {/* 📱 MOBILE BOTTOM NAVIGATION: (စခရင်အသေး `md:` အောက်မှာပဲ အောက်ခြေကပ်ပေါ်မယ်) */}
      <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around border-t border-stone-800 bg-stone-900 px-6 py-2 md:hidden">
        <NavLink
          to="/rider"
          end
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-1 transition-colors ${isActive ? "text-yellow-500" : "text-stone-400"}`
          }
        >
          <ClipboardList size={22} />
          <span className="text-[10px] font-medium">Jobs</span>
        </NavLink>

        <NavLink
          to="/rider/map"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-1 transition-colors ${isActive ? "text-yellow-500" : "text-stone-400"}`
          }
        >
          <Bike size={22} />
          <span className="text-[10px] font-medium">Navigation</span>
        </NavLink>

        <NavLink
          to="/rider/earnings"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-1 transition-colors ${isActive ? "text-yellow-500" : "text-stone-400"}`
          }
        >
          <DollarSign size={22} />
          <span className="text-[10px] font-medium">Earnings</span>
        </NavLink>
      </nav>
    </div>
  )
}
