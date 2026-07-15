// src/main.tsx
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"

// ─── MSW WORKER INITIALIZATION (FOR VITE) ───
async function enableMocking() {
  if (import.meta.env.MODE !== "development") {
    return
  }

  const { worker } = await import("./mocks/browser")

  return worker.start({
    onUnhandledRequest: "bypass",
  })
}

enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(
    <ThemeProvider>
      <App />
    </ThemeProvider>
  )
})
