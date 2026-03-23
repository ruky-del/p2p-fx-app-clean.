"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Offer = {
  id: string;
  name: string;
  phone: string;
  from_currency: string;
  to_currency: string;
  rate: number;
  amount: number;
};

export default function Home() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [fromCurrency, setFromCurrency] = useState("TZS");
  const [toCurrency, setToCurrency] = useState("GBP");
  const [rate, setRate] = useState(3600);
  const [amount, setAmount] = useState(0);

  const totalGBP =
    fromCurrency === "TZS"
      ? amount / rate
      : amount * rate;

  async function fetchOffers() {
    const { data } = await supabase.from("offers").select("*").order("created_at", { ascending: false });
    if (data) setOffers(data);
  }

  useEffect(() => {
    fetchOffers();
  }, []);

  async function postOffer() {
    if (!name || !phone || !amount) return;

    await supabase.from("offers").insert([
      {
        name,
        phone,
        from_currency: fromCurrency,
        to_currency: toCurrency,
        rate,
        amount,
      },
    ]);

    setName("");
    setPhone("");
    setAmount(0);

    fetchOffers();
    alert("✅ Offer posted successfully");
  }

  return (
    <main style={{ padding: 20 }}>
      <h1>P2P FX Marketplace</h1>

      <h2>Post Offer</h2>

      <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} /><br />
      <input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} /><br />

      <select value={fromCurrency} onChange={(e) => setFromCurrency(e.target.value)}>
        <option>TZS</option>
        <option>GBP</option>
      </select>

      <select value={toCurrency} onChange={(e) => setToCurrency(e.target.value)}>
        <option>GBP</option>
        <option>TZS</option>
      </select>

      <br />

      <input
        placeholder="Rate"
        type="number"
        value={rate}
        onChange={(e) => setRate(Number(e.target.value))}
      /><br />

      <input
        placeholder="Amount"
        type="number"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
      /><br />

      <p>
        Preview: {amount} {fromCurrency} → £{totalGBP.toFixed(2)} GBP
      </p>

      <button onClick={postOffer}>Post Offer</button>

      <h2>Marketplace</h2>

      {offers.map((offer) => (
        <div key={offer.id} style={{ border: "1px solid #ccc", padding: 10, marginBottom: 10 }}>
          <p><b>{offer.name}</b></p>
          <p>{offer.amount} {offer.from_currency}</p>
          <p>Rate: {offer.rate}</p>
          <p>Total: £{(offer.amount / offer.rate).toFixed(2)}</p>
          <p>Phone: {offer.phone}</p>
        </div>
      ))}
    </main>
  );
}
