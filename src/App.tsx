// src/App.tsx
import { RouterProvider } from "react-router-dom"
import { router } from "./routes/AppRoutes"
import { Toaster } from "sonner"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { SearchProvider } from "./context/SearchContext"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SearchProvider>
        <Toaster position="top-center" richColors />
        <RouterProvider router={router} />
      </SearchProvider>
    </QueryClientProvider>
  )
}

export default App
