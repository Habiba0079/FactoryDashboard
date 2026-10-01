import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import Models from "./pages/Models";
import Payments from "./pages/Payments";

type Tab = "dashboard" | "models" | "payments";

const TABS: { id: Tab; label: string }[] = [
  { id: "dashboard", label: "الحساب" },
  { id: "models", label: "الموديلات" },
  { id: "payments", label: "الدفعات" },
];

function App() {
  const [tab, setTab] = useState<Tab>("dashboard");

  // بنعرض الصفحة النشطة بس، فكل مرة تفتحها بتتحمّل بيانات جديدة
  return (
    <div className="app">
      <header className="app-header">Factory Accounts</header>

      <main className="app-main">
        {tab === "dashboard" && <Dashboard />}
        {tab === "models" && <Models />}
        {tab === "payments" && <Payments />}
      </main>

      <nav className="tabbar" aria-label="التنقل">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            className={tab === id ? "tab active" : "tab"}
            aria-current={tab === id ? "page" : undefined}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}

export default App;
