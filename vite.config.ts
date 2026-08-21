import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"
import { VitePWA } from "vite-plugin-pwa"
import basicSsl from "@vitejs/plugin-basic-ssl"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  return {
    plugins: [
      react(),
      basicSsl(),
      tailwindcss(),
      VitePWA({
        registerType: "prompt",
        includeAssets: ["brand_color_logo.png", "pwa-192x192.png", "pwa-512x512.png"],
        devOptions: {
          enabled: true,
          type: "module",
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        },
        manifest: {
          name: "Magway Delivery App",
          short_name: "Magway Delivery App",
          theme_color: "#18181b",
          background_color: "#ffffff",
          display: "standalone",
          icons: [
            {
              src: "/pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "/pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: "/pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
            },
          ],
        },
      }),
    ],
    server: {
      proxy: {
        "/api": {
          // target: "http://localhost:8080", // Adjust if your backend runs on a different port
          // target: "http://192.168.43.105:8080", // Adjust if your backend runs on a different port
          target: env.VITE_BACKEND_IP || "http://localhost:8080", // Adjust if your backend runs on a different port
          changeOrigin: true,
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }
})
