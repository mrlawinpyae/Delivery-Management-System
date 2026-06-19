import { Outlet } from "react-router-dom"

export default function MerchantLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-100 md:flex-row">
      {/* 📱 Mobile Header (စခရင်အသေးမှာပဲ ပေါ်မယ်) */}
      <header className="flex items-center justify-between bg-zinc-950 p-4 text-white md:hidden">
        <h2 className="font-bold text-green-400">🏪 Merchant Portal</h2>
        <button className="rounded border border-zinc-700 p-2">Menu</button>
      </header>

      {/* 🖥️ Desktop Sidebar (စခရင်အကြီး `md:` ရောက်မှ ဘေးကပ်ပေါ်မယ်) */}
      <aside className="hidden min-h-screen w-64 bg-zinc-950 p-6 text-white md:block">
        <h2 className="mb-6 text-xl font-bold text-green-400">
          🏪 Merchant Portal
        </h2>
        <nav className="space-y-4">
          <p className="text-sm font-medium text-zinc-400">Order Management</p>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  )
}
