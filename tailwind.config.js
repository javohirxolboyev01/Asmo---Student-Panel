/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
        "colors": {
            "primary-fixed": "#ecdcff",
            "surface-container-low": "#1f182e",
            "on-primary-fixed-variant": "#5f00c0",
            "tertiary-fixed": "#7df4ff",
            "surface-container-high": "#2e263d",
            "on-error": "#690005",
            "on-surface-variant": "#cdc2d7",
            "background": "#160f26",
            "inverse-on-surface": "#342c44",
            "primary-container": "#aa73ff",
            "secondary-fixed-dim": "#ffafd1",
            "surface": "#160f26",
            "on-secondary-fixed-variant": "#8b0058",
            "surface-container": "#231c32",
            "error": "#ffb4ab",
            "on-surface": "#eaddfd",
            "surface-bright": "#3d354d",
            "surface-container-highest": "#393149",
            "on-background": "#eaddfd",
            "on-tertiary-fixed-variant": "#004f54",
            "on-primary-fixed": "#280057",
            "on-secondary-container": "#ffebf1",
            "on-error-container": "#ffdad6",
            "primary-fixed-dim": "#d6baff",
            "tertiary-fixed-dim": "#00dbe9",
            "on-primary-container": "#3a0079",
            "secondary-container": "#d10087",
            "on-primary": "#420089",
            "surface-tint": "#d6baff",
            "on-tertiary-fixed": "#002022",
            "outline": "#968da0",
            "secondary-fixed": "#ffd8e6",
            "surface-variant": "#393149",
            "error-container": "#93000a",
            "outline-variant": "#4b4454",
            "on-secondary": "#63003d",
            "surface-dim": "#160f26",
            "surface-container-lowest": "#110a20",
            "inverse-primary": "#7832d9",
            "on-tertiary": "#00363a",
            "on-secondary-fixed": "#3d0024",
            "tertiary-container": "#00a0aa",
            "on-tertiary-container": "#002f33",
            "secondary": "#ffafd1",
            "inverse-surface": "#eaddfd",
            "primary": "#d6baff",
            "tertiary": "#00dbe9"
        },
        "borderRadius": {
            "DEFAULT": "0.25rem",
            "lg": "0.5rem",
            "xl": "0.75rem",
            "full": "9999px"
        },
        "spacing": {
            "margin-mobile": "16px",
            "margin-desktop": "40px",
            "gutter": "24px",
            "container-max": "1440px",
            "unit": "8px",
            "nav-width": "280px"
        },
        "fontFamily": {
            "display-lg": ["Inter", "sans-serif"],
            "display-lg-mobile": ["Inter", "sans-serif"],
            "body-lg": ["Inter", "sans-serif"],
            "label-sm": ["Geist", "sans-serif"],
            "body-md": ["Inter", "sans-serif"],
            "headline-md": ["Inter", "sans-serif"]
        },
        "fontSize": {
            "display-lg": ["48px", { "lineHeight": "56px", "letterSpacing": "-0.02em", "fontWeight": "800" }],
            "display-lg-mobile": ["32px", { "lineHeight": "40px", "letterSpacing": "-0.02em", "fontWeight": "800" }],
            "body-lg": ["18px", { "lineHeight": "28px", "fontWeight": "400" }],
            "label-sm": ["13px", { "lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "600" }],
            "body-md": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
            "headline-md": ["24px", { "lineHeight": "32px", "fontWeight": "700" }]
        }
    }
  },
  plugins: [],
}
