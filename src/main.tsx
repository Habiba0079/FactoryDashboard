import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Register the service worker in production builds only.
registerSW({ immediate: true });

// Remove caches created by the previous manually maintained service worker.
if ("caches" in window) {
  void caches.delete("factory-accounts-v1");
  void caches.delete("factory-accounts-v2");
}
