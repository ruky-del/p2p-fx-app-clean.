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
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);

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
    <main style={{ padding: 40, fontFamily: "Arial", background: "#f5f7fb" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <h1>P2P FX Marketplace</h1>

        {/* POST OFFER */}
        <div style={{ marginBottom: 30 }}>
          <h2>Post Offer</h2>

          <input
            placeholder="Your name"
            value={seller}
            onChange={(e) => setSeller(e.target.value)}
          />
          <br /><br />

          <select value={fromCurrency} onChange={(e) => setFromCurrency(e.target.value)}>
            <option>USD</option>
            <option>GBP</option>
            <option>EUR</option>
          </select>

          <select value={toCurrency} onChange={(e) => setToCurrency(e.target.value)}>
            <option>TZS</option>
            <option>USD</option>
          </select>

          <br /><br />

          <input
            placeholder="Rate"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
          <br /><br />

          <input
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <br /><br />

          <p>
            Preview: {getCurrencySymbol(fromCurrency)}{amount || 0} →{" "}
            {getCurrencySymbol(toCurrency)}
            {total.toLocaleString()}
          </p>

          <button onClick={handlePost}>Post Offer</button>
        </div>

        {/* MARKETPLACE */}
        <h2>Marketplace</h2>

        {offers.map((offer, i) => (
          <div key={i} style={{ border: "1px solid #ccc", padding: 10, marginTop: 10 }}>
            <strong>{offer.seller}</strong>
            <p>{offer.pair}</p>
            <p>Rate: {offer.rate}</p>
            <p>Amount: {offer.amount}</p>

            <button onClick={() => setSelectedOffer(offer)}>
              Contact Seller
            </button>
          </div>
        ))}

        {/* CONTACT MODAL */}
        {selectedOffer && (
          <div
            style={{
              marginTop: 30,
              padding: 20,
              border: "2px solid #2563eb",
              borderRadius: 10,
              background: "#ffffff",
            }}
          >
            <h2>Contact Seller</h2>

            <p><strong>Seller:</strong> {selectedOffer.seller}</p>
            <p><strong>Pair:</strong> {selectedOffer.pair}</p>
            <p><strong>Rate:</strong> {selectedOffer.rate}</p>
            <p><strong>Amount:</strong> {selectedOffer.amount}</p>

            <p style={{ color: "green", fontWeight: 700 }}>
              📞 WhatsApp: +255 XXX XXX XXX
            </p>

            <button onClick={() => setSelectedOffer(null)}>
              Close
            </button>
          </div>
        )}
      </div>
    </main>
  );
}