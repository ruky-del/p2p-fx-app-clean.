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
  const [offers, setOffers] = useState<Offer[]>([]);

  const handlePost = () => {
    if (!seller || !rate || !amount) return;

    const newOffer: Offer = {
      seller,
      pair: `${fromCurrency} → ${toCurrency}`,
      rate,
      amount,
    };

    setOffers([newOffer, ...offers]);

    setSeller("");
    setRate("");
    setAmount("");
  };

  return (
    <main style={{ padding: 40, fontFamily: "Arial" }}>
      <h1>P2P FX Marketplace</h1>

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

      <button onClick={handlePost}>Post Offer</button>

      <h2>Marketplace</h2>

      {offers.length === 0 && <p>No offers yet</p>}

      {offers.map((offer, i) => (
        <div key={i} style={{ border: "1px solid #ccc", padding: 10, marginTop: 10 }}>
          <strong>{offer.seller}</strong>
          <p>{offer.pair}</p>
          <p>Rate: {offer.rate}</p>
          <p>Amount: {offer.amount}</p>
        </div>
      ))}
    </main>
  );
}