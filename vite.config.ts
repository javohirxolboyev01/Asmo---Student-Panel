// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
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
        target: "http://localhost:4001",
        changeOrigin: true,
      },
    },
  },
  css: {
    postcss: "./postcss.config.js",
  },
});
