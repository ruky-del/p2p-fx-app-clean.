"use client";

import { useMemo, useState } from "react";

type ActionType = "BUY" | "SELL" | "";

type HistoryItem = {
  type: "BUY" | "SELL";
  amount: string;
  rate: string;
  total: number;
  time: string;
};

export default function Home() {
  const [amount, setAmount] = useState("");
  const [buyRate, setBuyRate] = useState("2500");
  const [sellRate, setSellRate] = useState("2450");
  const [action, setAction] = useState<ActionType>("");
  const [history, setHistory] = useState<HistoryItem[]>([]);

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

    if (!amount) return;

    const selectedRate = type === "BUY" ? buyRate : sellRate;
    const calculatedTotal = (Number(amount) || 0) * (Number(selectedRate) || 0);

    const newItem: HistoryItem = {
      type,
      amount,
      rate: selectedRate,
      total: calculatedTotal,
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
    <main
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
        padding: "40px 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 760,
          margin: "0 auto",
          background: "#ffffff",
          borderRadius: 20,
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            background: "#111827",
            color: "#ffffff",
            padding: "24px 28px",
          }}
        >
          <h1 style={{ margin: 0, fontSize: 32 }}>P2P FX App</h1>
          <p style={{ margin: "8px 0 0", color: "#d1d5db" }}>
            Buy and sell foreign currency easily.
          </p>
        </div>

        <div style={{ padding: 28 }}>
          <div
            style={{
              display: "grid",
              gap: 16,
              gridTemplateColumns: "1fr",
              marginBottom: 24,
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 8,
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                Amount
              </label>
              <input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
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
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                Buy Rate
              </label>
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
              <label
                style={{
                  display: "block",
                  marginBottom: 8,
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                Sell Rate
              </label>
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

          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 28,
            }}
          >
            <button
              onClick={() => handleAction("BUY")}
              style={{
                padding: "12px 20px",
                border: "none",
                borderRadius: 10,
                background: "#16a34a",
                color: "#ffffff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Buy
            </button>

            <button
              onClick={() => handleAction("SELL")}
              style={{
                padding: "12px 20px",
                border: "none",
                borderRadius: 10,
                background: "#2563eb",
                color: "#ffffff",
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
                color: "#ffffff",
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
              marginBottom: 28,
            }}
          >
            <h2 style={{ marginTop: 0, fontSize: 22, color: "#111827" }}>
              Summary
            </h2>
            <p><strong>Selected Action:</strong> {action || "None"}</p>
            <p><strong>Amount:</strong> {amount || 0}</p>
            <p><strong>Buy Rate:</strong> {buyRate}</p>
            <p><strong>Sell Rate:</strong> {sellRate}</p>
            <p><strong>Active Rate:</strong> {action ? activeRate : 0}</p>
            <p><strong>Total:</strong> TZS {total.toLocaleString()}</p>
          </div>

          <div>
            <h2 style={{ fontSize: 22, color: "#111827" }}>Transaction History</h2>

            {history.length === 0 ? (
              <div
                style={{
                  background: "#f9fafb",
                  border: "1px dashed #d1d5db",
                  borderRadius: 12,
                  padding: 18,
                  color: "#6b7280",
                }}
              >
                No transactions yet.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {history.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 12,
                      padding: 16,
                      background: "#ffffff",
                    }}
                  >
                    <p style={{ margin: "0 0 8px", fontWeight: 700 }}>
                      {item.type === "BUY" ? "🟢 BUY" : "🔵 SELL"}
                    </p>
                    <p style={{ margin: "4px 0" }}>
                      <strong>Amount:</strong> {item.amount}
                    </p>
                    <p style={{ margin: "4px 0" }}>
                      <strong>Rate:</strong> {item.rate}
                    </p>
                    <p style={{ margin: "4px 0" }}>
                      <strong>Total:</strong> TZS {item.total.toLocaleString()}
                    </p>
                    <p style={{ margin: "4px 0", color: "#6b7280" }}>
                      <strong>Time:</strong> {item.time}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}