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

// تسجيل الـ service worker (بيشتغل في النسخة المنشورة بس)
registerSW({ immediate: true });

// تنظيف كاش الـ service worker القديم اللي كان مكتوب باليد
if ("caches" in window) {
  void caches.delete("factory-accounts-v1");
  void caches.delete("factory-accounts-v2");
}
