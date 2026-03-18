"use client";

import { useMemo, useState } from "react";

export default function Home() {
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState("2500");
  const [action, setAction] = useState<"BUY" | "SELL" | "">("");

  const total = useMemo(() => {
    const a = Number(amount) || 0;
    const r = Number(rate) || 0;
    return a * r;
  }, [amount, rate]);

  const resetForm = () => {
    setAmount("");
    setRate("2500");
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
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 36, color: "#111827" }}>
            P2P FX App
          </h1>
          <p style={{ color: "#4b5563", marginTop: 10 }}>
            Buy and sell foreign currency easily.
          </p>
        </div>

        <div style={{ display: "grid", gap: 16, marginBottom: 20 }}>
          <div>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                fontWeight: 600,
                color: "#111827",
              }}
            >
              Amount
            </label>
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
            <label
              style={{
                display: "block",
                marginBottom: 8,
                fontWeight: 600,
                color: "#111827",
              }}
            >
              Rate
            </label>
            <input
              type="number"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="Enter rate"
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

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
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
          <h3 style={{ marginTop: 0, color: "#111827" }}>Summary</h3>
          <p>
            <strong>Selected action:</strong> {action || "None"}
          </p>
          <p>
            <strong>Amount:</strong> {amount || 0}
          </p>
          <p>
            <strong>Rate:</strong> {rate || 0}
          </p>
          <p>
            <strong>Total:</strong> {total.toLocaleString()}
          </p>
        </div>
      </div>
    </main>
  );
}