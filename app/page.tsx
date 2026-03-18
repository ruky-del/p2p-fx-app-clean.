"use client";

import { useMemo, useState } from "react";

export default function Home() {
  const [amount, setAmount] = useState("");
  const [buyRate, setBuyRate] = useState("2500");
  const [sellRate, setSellRate] = useState("2450");
  const [action, setAction] = useState<"BUY" | "SELL" | "">("");

  const activeRate = action === "SELL" ? Number(sellRate) || 0 : Number(buyRate) || 0;

  const total = useMemo(() => {
    const a = Number(amount) || 0;
    return a * activeRate;
  }, [amount, activeRate]);

  const resetForm = () => {
    setAmount("");
    setBuyRate("2500");
    setSellRate("2450");
    setAction("");
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        padding: "40px 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          background: "#ffffff",
          borderRadius: 18,
          padding: 24,
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        <h1 style={{ marginTop: 0, fontSize: 36, color: "#111827" }}>P2P FX App</h1>
        <p style={{ color: "#4b5563" }}>Buy and sell foreign currency easily.</p>

        <div style={{ display: "grid", gap: 16, marginTop: 24 }}>
          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              style={{
                width: "100%",
                padding: 14,
                borderRadius: 10,
                border: "1px solid #d1d5db",
                fontSize: 16,
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Buy Rate</label>
            <input
              type="number"
              value={buyRate}
              onChange={(e) => setBuyRate(e.target.value)}
              style={{
                width: "100%",
                padding: 14,
                borderRadius: 10,
                border: "1px solid #d1d5db",
                fontSize: 16,
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Sell Rate</label>
            <input
              type="number"
              value={sellRate}
              onChange={(e) => setSellRate(e.target.value)}
              style={{
                width: "100%",
                padding: 14,
                borderRadius: 10,
                border: "1px solid #d1d5db",
                fontSize: 16,
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24, marginBottom: 24 }}>
          <button
            onClick={() => setAction("BUY")}
            style={{
              padding: "12px 20px",
              border: "none",
              borderRadius: 10,
              background: "#16a34a",
              color: "white",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Buy
          </button>

          <button
            onClick={() => setAction("SELL")}
            style={{
              padding: "12px 20px",
              border: "none",
              borderRadius: 10,
              background: "#2563eb",
              color: "white",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Sell
          </button>

          <button
            onClick={resetForm}
            style={{
              padding: "12px 20px",
              border: "none",
              borderRadius: 10,
              background: "#dc2626",
              color: "white",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Delete
          </button>
        </div>

        <div
          style={{
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: 14,
            padding: 20,
          }}
        >
          <h3 style={{ marginTop: 0 }}>Summary</h3>
          <p><strong>Selected action:</strong> {action || "None"}</p>
          <p><strong>Amount:</strong> {amount || 0}</p>
          <p><strong>Buy Rate:</strong> {buyRate}</p>
          <p><strong>Sell Rate:</strong> {sellRate}</p>
          <p><strong>Active Rate:</strong> {action ? activeRate : 0}</p>
          <p><strong>Total:</strong> TZS {total.toLocaleString()}</p>
        </div>
      </div>
    </main>
  );
}