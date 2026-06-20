// src/App.tsx
import { RouterProvider } from "react-router-dom"
import { router } from "./routes/AppRoutes"

// 1. TanStack Query ရဲ့ Provider နဲ့ Client ကို Import ယူပါ
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

// 2. QueryClient Instance ကို App ရဲ့ အပြင်မှာ ဆောက်ပေးပါ
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Window active ပြန်ဖြစ်တိုင်း background refetch မလုပ်ရန်
      retry: 1, // Error တက်ရင် ၁ ကြိမ်ပဲ ထပ်ကြိုးစားရန်
    },
  },
})

function App() {
  return (
    // 3. QueryClientProvider ဖြင့် RouterProvider ကို ပတ်ပေးလိုက်ပါ
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

export default App
