import { useState } from "react";
import type { ReactNode } from "react";
import {
  CashIcon,
  MannequinIcon,
  ScissorsIcon,
  SpoolIcon,
} from "./components/icons";
import DataProvider from "./data/DataProvider";
import Dashboard from "./pages/Dashboard";
import Models from "./pages/Models";
import Payments from "./pages/Payments";

type Tab = "dashboard" | "models" | "payments";

const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: "dashboard", label: "الحساب", icon: <MannequinIcon /> },
  { id: "models", label: "الموديلات", icon: <ScissorsIcon /> },
  { id: "payments", label: "الدفعات", icon: <CashIcon /> },
];

function App() {
  const [tab, setTab] = useState<Tab>("dashboard");

  // البيانات في DataProvider، فالتنقل بين الصفحات فوري ومابيحمّلش من جديد
  return (
    <DataProvider>
      <div className="app">
        <header className="app-header">
          <SpoolIcon size={24} /> حسابات المصنع
        </header>

        <main className="app-main">
          {tab === "dashboard" && <Dashboard />}
          {tab === "models" && <Models />}
          {tab === "payments" && <Payments />}
        </main>

        <nav className="tabbar" aria-label="التنقل">
          {TABS.map(({ id, label, icon }) => (
            <button
              key={id}
              className={tab === id ? "tab active" : "tab"}
              aria-current={tab === id ? "page" : undefined}
              onClick={() => setTab(id)}
            >
              {icon}
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>
    </DataProvider>
  );
}

export default App;
