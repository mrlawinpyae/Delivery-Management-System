import axios from "axios"
import { useAuthStore } from "@/store/useAuthStore"

const baseURL = import.meta.env.VITE_API_BASE_URL || "/api"

const client = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
})

client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token is invalid or expired
      useAuthStore.getState().logout()
      // If the user isn't in a protected route, we might want to force navigation here,
      // but ProtectedRoute will automatically redirect state-based components.
      window.location.href = "/customer/login"
    }
    return Promise.reject(error)
  }
)

export default client
