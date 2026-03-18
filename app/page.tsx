"use client";

import { useMemo, useState } from "react";

type ActionType = "BUY" | "SELL" | "";

type HistoryItem = {
  type: "BUY" | "SELL";
  amount: string;
  fromCurrency: string;
  toCurrency: string;
  rate: string;
  total: number;
  time: string;
};

type MarketplaceItem = {
  seller: string;
  pair: string;
  rate: string;
  amount: string;
};

export default function Home() {
  const [amount, setAmount] = useState("");
  const [buyRate, setBuyRate] = useState("2500");
  const [sellRate, setSellRate] = useState("2450");
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("TZS");
  const [action, setAction] = useState<ActionType>("");
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginMessage, setLoginMessage] = useState("");

  const marketplace: MarketplaceItem[] = [
    { seller: "Ruky FX", pair: "USD → TZS", rate: "2500", amount: "500" },
    { seller: "Amina Exchange", pair: "GBP → TZS", rate: "3200", amount: "300" },
    { seller: "Global Pesa", pair: "EUR → TZS", rate: "2700", amount: "700" },
  ];

  const activeRate =
    action === "SELL" ? Number(sellRate) || 0 : Number(buyRate) || 0;

  const total = useMemo(() => {
    const a = Number(amount) || 0;
    return a * activeRate;
  }, [amount, activeRate]);

  const handleAction = (type: "BUY" | "SELL") => {
    setAction(type);

    if (!amount) return;

    const selectedRate = type === "BUY" ? buyRate : sellRate;
    const calculatedTotal =
      (Number(amount) || 0) * (Number(selectedRate) || 0);

    const newItem: HistoryItem = {
      type,
      amount,
      fromCurrency,
      toCurrency,
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
    setFromCurrency("USD");
    setToCurrency("TZS");
    setAction("");
  };

  const swapCurrencies = () => {
    const oldFrom = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(oldFrom);
  };

  const handleLogin = () => {
    if (!email || !password) {
      setLoginMessage("Please enter email and password.");
      return;
    }

    setLoginMessage(`Logged in as ${email}`);
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
          maxWidth: 920,
          margin: "0 auto",
          display: "grid",
          gap: 20,
        }}
      >
        <div
          style={{
            background: "#111827",
            color: "#ffffff",
            borderRadius: 20,
            padding: "24px 28px",
          }}
        >
          <h1 style={{ margin: 0, fontSize: 34 }}>P2P FX App</h1>
          <p style={{ margin: "8px 0 0", color: "#d1d5db" }}>
            Demo app with FX calculator, login UI, and marketplace preview.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 0.8fr",
            gap: 20,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 20,
              padding: 24,
              boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
            }}
          >
            <h2 style={{ marginTop: 0 }}>FX Calculator</h2>

            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 700 }}>
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

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto 1fr",
                  gap: 12,
                  alignItems: "end",
                }}
              >
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 700 }}>
                    From Currency
                  </label>
                  <select
                    value={fromCurrency}
                    onChange={(e) => setFromCurrency(e.target.value)}
                    style={{
                      width: "100%",
                      padding: 14,
                      borderRadius: 10,
                      border: "1px solid #d1d5db",
                      fontSize: 16,
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                    <option value="EUR">EUR</option>
                    <option value="TZS">TZS</option>
                  </select>
                </div>

                <button
                  onClick={swapCurrencies}
                  style={{
                    padding: "12px 16px",
                    border: "none",
                    borderRadius: 10,
                    background: "#e5e7eb",
                    fontWeight: 700,
                    cursor: "pointer",
                    height: 48,
                  }}
                >
                  ⇄
                </button>

                <div>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 700 }}>
                    To Currency
                  </label>
                  <select
                    value={toCurrency}
                    onChange={(e) => setToCurrency(e.target.value)}
                    style={{
                      width: "100%",
                      padding: 14,
                      borderRadius: 10,
                      border: "1px solid #d1d5db",
                      fontSize: 16,
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="TZS">TZS</option>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 700 }}>
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
                <label style={{ display: "block", marginBottom: 8, fontWeight: 700 }}>
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

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
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
                marginTop: 24,
              }}
            >
              <h3 style={{ marginTop: 0 }}>Summary</h3>
              <p><strong>Selected Action:</strong> {action || "None"}</p>
              <p><strong>Pair:</strong> {fromCurrency} → {toCurrency}</p>
              <p><strong>Amount:</strong> {amount || 0} {fromCurrency}</p>
              <p><strong>Buy Rate:</strong> {buyRate}</p>
              <p><strong>Sell Rate:</strong> {sellRate}</p>
              <p><strong>Active Rate:</strong> {action ? activeRate : 0}</p>
              <p><strong>Total:</strong> {toCurrency} {total.toLocaleString()}</p>
            </div>
          </div>

          <div style={{ display: "grid", gap: 20 }}>
            <div
              style={{
                background: "#ffffff",
                borderRadius: 20,
                padding: 24,
                boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
              }}
            >
              <h2 style={{ marginTop: 0 }}>Login</h2>

              <div style={{ display: "grid", gap: 12 }}>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: "100%",
                    padding: 14,
                    borderRadius: 10,
                    border: "1px solid #d1d5db",
                    fontSize: 16,
                    boxSizing: "border-box",
                  }}
                />

                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: 14,
                    borderRadius: 10,
                    border: "1px solid #d1d5db",
                    fontSize: 16,
                    boxSizing: "border-box",
                  }}
                />

                <button
                  onClick={handleLogin}
                  style={{
                    padding: "12px 20px",
                    border: "none",
                    borderRadius: 10,
                    background: "#111827",
                    color: "#ffffff",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Login
                </button>

                {loginMessage && (
                  <p style={{ margin: 0, color: "#374151" }}>{loginMessage}</p>
                )}
              </div>
            </div>

            <div
              style={{
                background: "#ffffff",
                borderRadius: 20,
                padding: 24,
                boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
              }}
            >
              <h2 style={{ marginTop: 0 }}>Marketplace</h2>

              <div style={{ display: "grid", gap: 12 }}>
                {marketplace.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 12,
                      padding: 14,
                      background: "#f9fafb",
                    }}
                  >
                    <p style={{ margin: "0 0 6px", fontWeight: 700 }}>{item.seller}</p>
                    <p style={{ margin: "4px 0" }}><strong>Pair:</strong> {item.pair}</p>
                    <p style={{ margin: "4px 0" }}><strong>Rate:</strong> {item.rate}</p>
                    <p style={{ margin: "4px 0" }}><strong>Amount:</strong> {item.amount}</p>
                    <button
                      style={{
                        marginTop: 8,
                        padding: "10px 14px",
                        border: "none",
                        borderRadius: 10,
                        background: "#7c3aed",
                        color: "#ffffff",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      View Offer
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            background: "#ffffff",
            borderRadius: 20,
            padding: 24,
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Transaction History</h2>

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
                    <strong>Pair:</strong> {item.fromCurrency} → {item.toCurrency}
                  </p>
                  <p style={{ margin: "4px 0" }}>
                    <strong>Amount:</strong> {item.amount} {item.fromCurrency}
                  </p>
                  <p style={{ margin: "4px 0" }}>
                    <strong>Rate:</strong> {item.rate}
                  </p>
                  <p style={{ margin: "4px 0" }}>
                    <strong>Total:</strong> {item.toCurrency} {item.total.toLocaleString()}
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
    </main>
  );
}
}