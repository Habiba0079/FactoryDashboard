import { useEffect, useState } from "react";
import { getSummary } from "./services/api";
import type { Summary } from "./services/api";
import ModelForm from "./components/ModelForm";
import Models from "./pages/Models";
import PaymentForm from "./components/PaymentForm";
import Dashboard from "./pages/Dashboard";

function App() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSummary() {
      try {
        const data = await getSummary();
        setSummary(data);
      } catch (error) {
        setError("حدث خطأ أثناء تحميل البيانات");
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadSummary();
  }, []);

  if (loading) {
    return <h1>Loading...</h1>;
  }

  if (error) {
    return <h1>{error}</h1>;
  }

  return (
    <div>
      <h1>Factory Accounts</h1>

      {summary && (
        <div>
          <p>Total Work: {summary.totalWork}</p>
          <p>Total Payments: {summary.totalPayments}</p>
          <p>Balance: {summary.balance}</p>
          <p>Total Pieces: {summary.totalPieces}</p>
          <p>Total Fabric: {summary.totalFabricCm} cm</p>
        </div>
      )}

      <ModelForm />
      <Models />
      <PaymentForm />
      <Dashboard />
    </div>
  );
}

export default App;
