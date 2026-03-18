"use client";

import { useMemo, useState } from "react";

export default function Home() {
  const [amount, setAmount] = useState("");
  const [buyRate, setBuyRate] = useState("2500");
  const [sellRate, setSellRate] = useState("2450");
  const [action, setAction] = useState<"BUY" | "SELL" | "">("");
  const [history, setHistory] = useState<any[]>([]);

  const activeRate =
    action === "SELL"
      ? Number(sellRate) || 0
      : Number(buyRate) || 0;

  const total = useMemo(() => {
    const a = Number(amount) || 0;
    return a * activeRate;
  }, [amount, activeRate]);

  const handleAction = (type: "BUY" | "SELL") => {
    setAction(type);

    const newItem = {
      type,
      amount,
      rate: type === "BUY" ? buyRate : sellRate,
      total,
      time: new Date().toLocaleTimeString(),
    };

    setHistory([newItem, ...history]);
  };

  const resetForm = () => {
    setAmount("");
    setBuyRate("2500");
    setSellRate("2450");
    setAction("");
  };

  return (
    <main style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>P2P FX App</h1>

      <input
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <br /><br />

      <input
        placeholder="Buy Rate"
        value={buyRate}
        onChange={(e) => setBuyRate(e.target.value)}
      />

      <br /><br />

      <input
        placeholder="Sell Rate"
        value={sellRate}
        onChange={(e) => setSellRate(e.target.value)}
      />

      <br /><br />

      <button onClick={() => handleAction("BUY")}>Buy</button>
      <button onClick={() => handleAction("SELL")}>Sell</button>
      <button onClick={resetForm}>Delete</button>

      <h3>Summary</h3>
      <p>Action: {action}</p>
      <p>Total: TZS {total}</p>

      <h3>History</h3>

      {history.length === 0 && <p>No transactions yet</p>}

      {history.map((item, i) => (
        <div key={i} style={{ border: "1px solid #ccc", margin: 5, padding: 5 }}>
          <strong>{item.type}</strong> — {item.amount} @ {item.rate} = {item.total} ({item.time})
        </div>
      ))}
    </main>
  );
}
}