import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"
import basicSsl from "@vitejs/plugin-basic-ssl"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    basicSsl(),
    tailwindcss(),
    VitePWA({
      registerType: "prompt",
      manifest: {
        name: "Delivery Rider App",
        short_name: "Delivery App",
        theme_color: "#18181b",
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          {
            src: "/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      "/api": {
        // target: "http://localhost:8080", // Adjust if your backend runs on a different port
        target: "http://192.168.43.105:8080", // Adjust if your backend runs on a different port
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
