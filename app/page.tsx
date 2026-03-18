"use client";

import { useState } from "react";

type Offer = {
  seller: string;
  pair: string;
  rate: string;
  amount: string;
};

export default function Home() {
  const [seller, setSeller] = useState("");
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("TZS");
  const [rate, setRate] = useState("");
  const [amount, setAmount] = useState("");
  const [offers, setOffers] = useState<Offer[]>([
    {
      seller: "ASHA",
      pair: "GBP → TZS",
      rate: "3400",
      amount: "£1000",
    },
  ]);

  const getCurrencySymbol = (currency: string) => {
    if (currency === "GBP") return "£";
    if (currency === "USD") return "$";
    if (currency === "EUR") return "€";
    if (currency === "TZS") return "TZS ";
    return "";
  };

  const handlePost = () => {
    if (!seller || !rate || !amount) return;

    const symbol = getCurrencySymbol(fromCurrency);

    const newOffer: Offer = {
      seller: seller.toUpperCase(),
      pair: `${fromCurrency} → ${toCurrency}`,
      rate,
      amount: `${symbol}${amount}`,
    };

    setOffers([newOffer, ...offers]);

    setSeller("");
    setRate("");
    setAmount("");
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
          maxWidth: 760,
          margin: "0 auto",
          background: "#ffffff",
          borderRadius: 18,
          padding: 24,
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        <h1 style={{ marginTop: 0, fontSize: 36 }}>P2P FX Marketplace</h1>

        <h2>Post Offer</h2>

        <div style={{ display: "grid", gap: 14, marginBottom: 24 }}>
          <input
            placeholder="Your name"
            value={seller}
            onChange={(e) => setSeller(e.target.value)}
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 10,
              border: "1px solid #d1d5db",
              fontSize: 16,
              boxSizing: "border-box",
            }}
          />

          <div style={{ display: "flex", gap: 12 }}>
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              style={{
                padding: 14,
                borderRadius: 10,
                border: "1px solid #d1d5db",
                fontSize: 16,
              }}
            >
              <option>USD</option>
              <option>GBP</option>
              <option>EUR</option>
              <option>TZS</option>
            </select>

            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
              style={{
                padding: 14,
                borderRadius: 10,
                border: "1px solid #d1d5db",
                fontSize: 16,
              }}
            >
              <option>TZS</option>
              <option>USD</option>
              <option>GBP</option>
              <option>EUR</option>
            </select>
          </div>

          <input
            placeholder="Rate"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
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
            placeholder={`Amount (${getCurrencySymbol(fromCurrency).trim() || fromCurrency})`}
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

          <button
            onClick={handlePost}
            style={{
              padding: "12px 20px",
              border: "none",
              borderRadius: 10,
              background: "#2563eb",
              color: "#ffffff",
              fontWeight: 700,
              cursor: "pointer",
              width: "fit-content",
            }}
          >
            Post Offer
          </button>
        </div>

        <h2>Marketplace</h2>

        <div style={{ display: "grid", gap: 14 }}>
          {offers.map((offer, i) => (
            <div
              key={i}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 14,
                padding: 18,
                background: "#f9fafb",
              }}
            >
              <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 22 }}>
                {offer.seller}
              </p>
              <p style={{ margin: "6px 0" }}>{offer.pair}</p>
              <p style={{ margin: "6px 0" }}>Rate: {offer.rate}</p>
              <p style={{ margin: "6px 0" }}>Amount: {offer.amount}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}