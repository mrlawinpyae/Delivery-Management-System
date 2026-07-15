// src/App.tsx
import { RouterProvider } from "react-router-dom"
import { router } from "./routes/AppRoutes"

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
        <RouterProvider router={router} />
      </SearchProvider>
    </QueryClientProvider>
  )
}

export default App
