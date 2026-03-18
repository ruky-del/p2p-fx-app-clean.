"use client";

import { useMemo, useState } from "react";

type Offer = {
  seller: string;
  pair: string;
  rate: string;
  amount: string;
  total: number;
};

export default function Home() {
  const [seller, setSeller] = useState("");
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("TZS");
  const [rate, setRate] = useState("");
  const [amount, setAmount] = useState("");
  const [offers, setOffers] = useState<Offer[]>([]);

  const getCurrencySymbol = (currency: string) => {
    if (currency === "GBP") return "£";
    if (currency === "USD") return "$";
    if (currency === "EUR") return "€";
    if (currency === "TZS") return "TZS ";
    return "";
  };

  const numericAmount = Number(amount) || 0;
  const numericRate = Number(rate) || 0;

  const total = useMemo(() => {
    return numericAmount * numericRate;
  }, [numericAmount, numericRate]);

  const handlePost = () => {
    if (!seller || !rate || !amount) return;

    const symbol = getCurrencySymbol(fromCurrency);
    const targetSymbol = getCurrencySymbol(toCurrency);

    const newOffer: Offer = {
      seller: seller.toUpperCase(),
      pair: `${fromCurrency} → ${toCurrency}`,
      rate: `${targetSymbol}${rate}`,
      amount: `${symbol}${amount}`,
      total,
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
              }}
            >
              <option>TZS</option>
              <option>USD</option>
              <option>GBP</option>
              <option>EUR</option>
            </select>
          </div>

          <input
            placeholder={`Rate (${getCurrencySymbol(toCurrency).trim()})`}
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            style={{
              padding: 14,
              borderRadius: 10,
              border: "1px solid #d1d5db",
            }}
          />

          <input
            placeholder={`Amount (${getCurrencySymbol(fromCurrency).trim()})`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{
              padding: 14,
              borderRadius: 10,
              border: "1px solid #d1d5db",
            }}
          />

          <div
            style={{
              background: "#f9fafb",
              padding: 14,
              borderRadius: 10,
              border: "1px solid #e5e7eb",
            }}
          >
            <strong>Preview:</strong>
            <p style={{ margin: "6px 0" }}>
              {getCurrencySymbol(fromCurrency)}
              {amount || 0} → {getCurrencySymbol(toCurrency)}
              {total.toLocaleString()}
            </p>
          </div>

          <button
            onClick={handlePost}
            style={{
              padding: "12px 20px",
              border: "none",
              borderRadius: 10,
              background: "#2563eb",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
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
              <p style={{ fontWeight: 700, fontSize: 20 }}>
                {offer.seller}
              </p>
              <p>{offer.pair}</p>
              <p>Rate: {offer.rate}</p>
              <p>Amount: {offer.amount}</p>
              <p>
                <strong>Total:</strong>{" "}
                {getCurrencySymbol(toCurrency)}
                {offer.total.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}