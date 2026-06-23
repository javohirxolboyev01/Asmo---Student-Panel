// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#EBF0FF",
          100: "#D6E0FF",
          200: "#ADC1FF",
          300: "#85A2FF",
          400: "#5C83FF",
          500: "#2D6BFF",
          600: "#1A56E8",
          700: "#0F42B5",
          800: "#0A2E82",
          900: "#051A4F",
        },
        gray: {
          50: "#F8F9FA",
          100: "#F1F2F4",
          200: "#E8EAED",
          300: "#D1D5DB",
          400: "#9CA3AF",
          500: "#8E92A4",
          600: "#6B7280",
          700: "#4B5563",
          800: "#1A1D26",
          900: "#111827",
        },
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
        background: "#F5F7FA",
        card: "#FFFFFF",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        "card-hover": "0 4px 12px rgba(0,0,0,0.08)",
        "bottom-nav": "0 -2px 10px rgba(0,0,0,0.05)",
      },
      borderRadius: {
        xl: "16px",
        "2xl": "20px",
        "3xl": "24px",
      },
    },
  },
  plugins: [],
};
