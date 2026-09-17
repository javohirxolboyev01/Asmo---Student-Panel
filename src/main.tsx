// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// CSS import
import "./css/index.css";
import { initPWA } from "./lib/pwa";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

if (import.meta.env.PROD) {
  initPWA();
}
