"use client";

import { useEffect, useMemo, useState } from "react";

type Offer = {
  seller: string;
  pair: string;
  rate: string;
  amount: string;
  total: number;
  phone: string;
};

export default function Home() {
  const [seller, setSeller] = useState("");
  const [phone, setPhone] = useState("");
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("TZS");
  const [rate, setRate] = useState("");
  const [amount, setAmount] = useState("");
  const [offers, setOffers] = useState<Offer[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);

  // LOAD FROM STORAGE
  useEffect(() => {
    const saved = localStorage.getItem("offers");
    if (saved) {
      setOffers(JSON.parse(saved));
    }
  }, []);

  // SAVE TO STORAGE
  useEffect(() => {
    localStorage.setItem("offers", JSON.stringify(offers));
  }, [offers]);

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
    if (!seller || !rate || !amount || !phone) return;

    const symbol = getCurrencySymbol(fromCurrency);
    const targetSymbol = getCurrencySymbol(toCurrency);

    const newOffer: Offer = {
      seller: seller.toUpperCase(),
      pair: `${fromCurrency} → ${toCurrency}`,
      rate: `${targetSymbol}${rate}`,
      amount: `${symbol}${amount}`,
      total,
      phone,
    };

    setOffers([newOffer, ...offers]);

    setSeller("");
    setRate("");
    setAmount("");
    setPhone("");
  };

  const openWhatsApp = (offer: Offer) => {
    const message = `Hi ${offer.seller}, I'm interested in your offer (${offer.pair}) at rate ${offer.rate}`;
    const url = `https://wa.me/${offer.phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <main style={{ padding: 40, fontFamily: "Arial", background: "#f5f7fb" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <h1>P2P FX Marketplace</h1>

        <div style={{ marginBottom: 30 }}>
          <h2>Post Offer</h2>

          <input
            placeholder="Your name"
            value={seller}
            onChange={(e) => setSeller(e.target.value)}
          />
          <br /><br />

          <input
            placeholder="Phone (2557XXXXXXXX)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
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

        {selectedOffer && (
          <div style={{ marginTop: 30, padding: 20, border: "2px solid blue" }}>
            <h2>Contact Seller</h2>

            <p>{selectedOffer.seller}</p>
            <p>{selectedOffer.pair}</p>

            <button onClick={() => openWhatsApp(selectedOffer)}>
              WhatsApp Seller 📲
            </button>

            <br /><br />
            <button onClick={() => setSelectedOffer(null)}>Close</button>
          </div>
        )}
      </div>
    </main>
  );
}