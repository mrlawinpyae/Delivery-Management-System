import { Outlet, Link, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Map, ClipboardList, User, Radio, Sun, Moon } from "lucide-react"
import { useThemeStore } from "@/store/useThemeStore"

// ─── Theme token maps ────────────────────────────────────────────────────────
// Every colour decision lives here; the JSX just reads from these objects.
const tokens = {
  dark: {
    // Backgrounds
    root:      "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(56,189,248,0.08) 0%, transparent 70%), linear-gradient(160deg, #0a0e1a 0%, #0d1321 50%, #080c18 100%)",
    rail:      "rgba(6,10,26,0.85)",
    header:    "rgba(6,10,26,0.70)",
    mobileHdr: "rgba(6,10,26,0.85)",
    mobileNav: "rgba(6,10,26,0.92)",
    // Borders
    railBorder:    "border-cyan-500/[0.08]",
    headerBorder:  "border-white/[0.05]",
    navEdgeLine:   "via-cyan-500/40",
    // Text
    pageLabel:   "text-slate-200",
    riderBadge:  "bg-slate-800/80 text-slate-500",
    logoSub:     "text-cyan-500/60",
    logoX:       "text-slate-500",
    liveLabel:   "text-emerald-500/70",
    // Icon rail
    iconActive:  "text-cyan-300",
    iconInactive: "text-slate-600 hover:bg-slate-800/60 hover:text-slate-400",
    // Tooltip
    tooltip: "border-slate-700/60 bg-slate-900/90 text-slate-300",
    // Mobile nav
    mobileIconActive: "text-cyan-300",
    mobileIconInactive: "text-slate-600",
    mobileLabelActive: "text-cyan-400",
    mobileLabelInactive: "text-slate-600",
    // Toggle button
    toggleBtn: "bg-slate-800/70 text-slate-400 hover:bg-slate-700/80 hover:text-slate-200 border-slate-700/50",
    toggleIcon: <Moon size={15} strokeWidth={2} className="cursor-pointer"/>,
  },
  light: {
    root:      "linear-gradient(160deg, #f0f7ff 0%, #e8f2fc 50%, #f5f9ff 100%)",
    rail:      "rgba(255,255,255,0.90)",
    header:    "rgba(255,255,255,0.85)",
    mobileHdr: "rgba(255,255,255,0.92)",
    mobileNav: "rgba(255,255,255,0.95)",
    // Borders
    railBorder:    "border-sky-200/60",
    headerBorder:  "border-slate-200/80",
    navEdgeLine:   "via-sky-400/50",
    // Text
    pageLabel:   "text-slate-800",
    riderBadge:  "bg-sky-100 text-sky-600",
    logoSub:     "text-sky-500/80",
    logoX:       "text-slate-400",
    liveLabel:   "text-emerald-600/80",
    // Icon rail
    iconActive:  "text-sky-600",
    iconInactive: "text-slate-400 hover:bg-slate-100 hover:text-slate-600",
    // Tooltip
    tooltip: "border-slate-200 bg-white text-slate-700 shadow-lg",
    // Mobile nav
    mobileIconActive: "text-sky-600",
    mobileIconInactive: "text-slate-400",
    mobileLabelActive: "text-sky-600",
    mobileLabelInactive: "text-slate-400",
    // Toggle button
    toggleBtn: "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-800 border-slate-200",
    toggleIcon: <Sun size={15} strokeWidth={2} className="cursor-pointer"/>,
  },
} as const

// ─── Theme toggle button (reused in desktop + mobile headers) ─────────────────
function ThemeToggle({ tk }: { tk: typeof tokens.dark | typeof tokens.light }) {
  const toggleTheme = useThemeStore((s) => s.toggleTheme)
  const theme = useThemeStore((s) => s.theme)

  return (
    <motion.button
      onClick={toggleTheme}
      whileTap={{ scale: 0.88 }}
      aria-label="Toggle theme"
      className={`relative flex h-8 w-8 items-center justify-center rounded-xl border transition-all duration-200 ${tk.toggleBtn}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ rotate: -30, opacity: 0, scale: 0.6 }}
          animate={{ rotate: 0,   opacity: 1, scale: 1   }}
          exit={{   rotate:  30,  opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="absolute"
        >
          {tk.toggleIcon}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}

// ─── Online Status Pill ───────────────────────────────────────────────────────
function OnlinePill({ size = "md" }: { size?: "sm" | "md" }) {
  const sm = size === "sm"
  return (
    <div
      className={`flex items-center ${sm ? "gap-1.5 px-3 py-1" : "gap-2.5 px-3.5 py-1.5"} rounded-full border border-emerald-500/20 bg-emerald-500/[0.08]`}
    >
      <div className={`relative ${sm ? "h-1.5 w-1.5" : "h-2 w-2"}`}>
        <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-60" />
        <span className={`relative block ${sm ? "h-1.5 w-1.5" : "h-2 w-2"} rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50`} />
      </div>
      <span className={`${sm ? "text-[10px]" : "text-[11px]"} font-semibold text-emerald-400`}>
        Online
      </span>
      {!sm && <span className="text-[10px] text-emerald-600">· Accepting</span>}
    </div>
  )
}

// ─── Root Layout ─────────────────────────────────────────────────────────────
export default function RiderLayout() {
  const location  = useLocation()
  const theme     = useThemeStore((s) => s.theme)
  const tk        = tokens[theme]
  const isDark    = theme === "dark"

  const navItems = [
    { path: "/rider",         label: "Tasks",   icon: ClipboardList },
    { path: "/rider/map",     label: "Map",     icon: Map           },
    { path: "/rider/profile", label: "Profile", icon: User          },
  ]

  const activeLabel = navItems.find((n) => n.path === location.pathname)?.label ?? "Dashboard"

  return (
    // We toggle the `.dark` class here so CSS custom-variants (used by shadcn)
    // also pick up the change. The actual visual theming is done via tk tokens.
    <div
      className={`flex min-h-screen flex-col md:flex-row ${isDark ? "dark text-slate-100" : "text-slate-800"}`}
      style={{ background: tk.root, transition: "background 0.35s ease" }}
    >

      {/* ═══ DESKTOP: ICON RAIL ═══ */}
      <aside
        className={`hidden w-20 flex-col items-center border-r py-6 md:flex ${tk.railBorder}`}
        style={{ background: tk.rail, backdropFilter: "blur(24px)", transition: "background 0.35s ease" }}
      >
        {/* Logo */}
        <Link to="/rider" className="group mb-8 flex flex-col items-center gap-1">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-sky-500 to-violet-600 shadow-lg shadow-cyan-500/30 transition-transform duration-300 group-hover:scale-110">
            <Radio size={20} strokeWidth={2.5} className="text-white" />
            <div className="absolute inset-0 -z-10 scale-125 rounded-2xl bg-gradient-to-br from-cyan-400/30 to-violet-600/30 blur-md" />
          </div>
        </Link>

        {/* Rail icons */}
        <nav className="flex flex-1 flex-col items-center gap-3">
          {navItems.map((item) => {
            const Icon     = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link key={item.path} to={item.path} title={item.label} className="group relative">
                {/* Active glow backdrop */}
                {isActive && (
                  <motion.div
                    layoutId="railGlow"
                    className="absolute inset-0 rounded-2xl"
                    style={{
                      background: isDark
                        ? "linear-gradient(135deg, rgba(34,211,238,0.15), rgba(139,92,246,0.08))"
                        : "linear-gradient(135deg, rgba(14,165,233,0.12), rgba(139,92,246,0.06))",
                      boxShadow: isDark
                        ? "0 0 16px rgba(34,211,238,0.12)"
                        : "0 0 16px rgba(14,165,233,0.10)",
                    }}
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <div className={`relative flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-200 ${isActive ? tk.iconActive : tk.iconInactive}`}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                  {/* Active left-bar */}
                  {isActive && (
                    <motion.div
                      layoutId="railBar"
                      className="absolute -left-3 h-5 w-1 rounded-r-full bg-gradient-to-b from-cyan-400 to-violet-500"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                </div>
                {/* Hover tooltip */}
                <div className={`pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg border px-2.5 py-1 text-[11px] font-medium opacity-0 shadow-xl backdrop-blur-sm transition-opacity duration-150 group-hover:opacity-100 ${tk.tooltip}`}>
                  {item.label}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Online dot + theme toggle */}
        <div className="flex flex-col items-center gap-3">
          <ThemeToggle tk={tk}/>
          <div className="flex flex-col items-center gap-1.5">
            <div className="relative">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-md shadow-emerald-400/50" />
            </div>
            <span className={`text-[9px] font-semibold uppercase tracking-widest ${tk.liveLabel}`}>
              Live
            </span>
          </div>
        </div>
      </aside>

      {/* ═══ MAIN AREA ═══ */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* DESKTOP TOP HEADER */}
        <header
          className={`hidden h-14 shrink-0 items-center justify-between border-b px-8 md:flex ${tk.headerBorder}`}
          style={{ background: tk.header, backdropFilter: "blur(20px)", transition: "background 0.35s ease" }}
        >
          <div className="flex items-center gap-3">
            <div className="h-4 w-0.5 rounded-full bg-gradient-to-b from-cyan-400 to-violet-500" />
            <span className={`text-sm font-semibold tracking-wide ${tk.pageLabel}`}>
              {activeLabel}
            </span>
            <span className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${tk.riderBadge}`}>
              Rider Mode
            </span>
          </div>
          <OnlinePill size="md" />
        </header>

        {/* MOBILE TOP HEADER */}
        <header
          className={`sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b px-5 md:hidden ${tk.headerBorder}`}
          style={{ background: tk.mobileHdr, backdropFilter: "blur(24px)", transition: "background 0.35s ease" }}
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-sky-500 to-violet-600 shadow-md shadow-cyan-500/25">
              <Radio size={16} strokeWidth={2.5} className="text-white" />
            </div>
            <div>
              <p className={`text-sm font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                Deliv<span className={`font-light ${tk.logoX}`}>X</span>
              </p>
              <p className={`text-[9px] font-semibold uppercase tracking-widest ${tk.logoSub}`}>
                Rider
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle tk={tk} />
            <OnlinePill size="sm" />
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 pb-28 md:p-6 md:pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, filter: "blur(4px)", scale: 0.99 }}
              animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
              exit={  { opacity: 0, filter: "blur(4px)", scale: 0.99 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="mx-auto max-w-5xl"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ═══ MOBILE BOTTOM NAV ═══ */}
      <div className="fixed inset-x-0 bottom-0 z-50 md:hidden">
        {/* Top edge accent line */}
        <div className={`h-px bg-gradient-to-r from-transparent ${tk.navEdgeLine} to-transparent`} />

        <nav
          className="flex items-center justify-around px-4 py-3"
          style={{ background: tk.mobileNav, backdropFilter: "blur(28px)", transition: "background 0.35s ease" }}
        >
          {navItems.map((item) => {
            const Icon     = item.icon
            const isActive = location.pathname === item.path

            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative flex flex-col items-center gap-1 px-3 py-1"
              >
                {/* Sliding pill */}
                {isActive && (
                  <motion.div
                    layoutId="mobileTabPill"
                    className="absolute -inset-x-3 -inset-y-1 rounded-2xl"
                    style={{
                      background: isDark
                        ? "linear-gradient(135deg, rgba(34,211,238,0.12), rgba(139,92,246,0.07))"
                        : "linear-gradient(135deg, rgba(14,165,233,0.10), rgba(139,92,246,0.05))",
                      border: isDark
                        ? "1px solid rgba(34,211,238,0.15)"
                        : "1px solid rgba(14,165,233,0.20)",
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  />
                )}

                {/* Top accent line */}
                {isActive && (
                  <motion.div
                    layoutId="mobileTabLine"
                    className="absolute -top-3 h-0.5 w-8 rounded-full bg-gradient-to-r from-cyan-400 to-violet-500"
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  />
                )}

                <Icon
                  size={20}
                  className={`relative z-10 transition-colors duration-200 ${isActive ? tk.mobileIconActive : tk.mobileIconInactive}`}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                <span className={`relative z-10 text-[10px] font-semibold tracking-wide transition-colors duration-200 ${isActive ? tk.mobileLabelActive : tk.mobileLabelInactive}`}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
