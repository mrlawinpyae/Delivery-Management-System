// src/main.tsx
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"

// ─── MSW WORKER INITIALIZATION (FOR VITE) ───
async function enableMocking() {
  // Vite မှာ development mode ဟုတ်မဟုတ် စစ်ဆေးခြင်း
  if (import.meta.env.MODE !== "development") {
    return
  }

  // browser.ts ဖိုင်ကို dynamically import ယူခြင်း
  const { worker } = await import("./mocks/browser")

  // MSW ကို စတင်နှိုးဆော်ခြင်း
  return worker.start({
    onUnhandledRequest: "bypass", // Mock မလုပ်ထားတဲ့ တခြား URL တွေကို ပေးဖြတ်မည်
  })
}

// MSW အဆင်သင့်ဖြစ်မှသာ App ကို Render လုပ်မည်
enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(
    <ThemeProvider>
      <App />
    </ThemeProvider>
  )
})
