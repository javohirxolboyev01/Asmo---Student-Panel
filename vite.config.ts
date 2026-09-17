// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["asmo-512.png", "asmo-192.png", "apple-touch-icon.png"],
      manifest: {
        name: "Asmo Learning Center",
        short_name: "Asmo",
        description: "Asmo Learning Center — talabalar uchun shaxsiy kabinet",
        lang: "uz",
        theme_color: "#2D6BFF",
        background_color: "#F5F7FA",
        display: "standalone",
        start_url: "/",
        scope: "/",
        orientation: "portrait",
        icons: [
          {
            src: "/asmo-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/asmo-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/asmo-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            urlPattern: /^\/api\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              networkTimeoutSeconds: 10,
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    proxy: {
      // Backend CORS sozlanmagan bo'lsa ham ishlashi uchun: brauzer /api'ga
      // shu origin orqali murojaat qiladi, Vite esa uni server tomonda
      // backendga (CORS'siz) yo'naltiradi.
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
  css: {
    postcss: "./postcss.config.js",
  },
});
