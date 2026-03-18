"use client";

import { useMemo, useState } from "react";

export default function Home() {
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState("2500");
  const [action, setAction] = useState("");

  const total = useMemo(() => {
    const a = Number(amount) || 0;
    const r = Number(rate) || 0;
    return a * r;
  }, [amount, rate]);

  return (
    <main style={{ padding: 24, fontFamily: "Arial, sans-serif", maxWidth: 500 }}>
      <h1>P2P FX App</h1>
      <p>Buy and sell foreign currency easily.</p>

      <div style={{ marginTop: 20 }}>
        <label>Amount</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
          style={{ display: "block", width: "100%", padding: 10, marginTop: 6, marginBottom: 16 }}
        />

        <label>Rate</label>
        <input
          type="number"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          placeholder="Enter rate"
          style={{ display: "block", width: "100%", padding: 10, marginTop: 6, marginBottom: 16 }}
        />
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        <button onClick={() => setAction("BUY")} style={{ padding: "10px 16px" }}>
          Buy
        </button>

        <button onClick={() => setAction("SELL")} style={{ padding: "10px 16px" }}>
          Sell
        </button>

        <button
          onClick={() => {
            setAmount("");
            setRate("2500");
            setAction("CLEARED");
          }}
          style={{ padding: "10px 16px" }}
        >
          Delete
        </button>
      </div>

      <div style={{ marginTop: 24 }}>
        <h3>Summary</h3>
        <p>Selected action: {action || "None"}</p>
        <p>Amount: {amount || 0}</p>
        <p>Rate: {rate || 0}</p>
        <p>Total: {total.toLocaleString()}</p>
      </div>
    </main>
  );
}