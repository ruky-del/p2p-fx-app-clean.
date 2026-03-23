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

  const total =
    fromCurrency === "TZS" && toCurrency === "GBP"
      ? amount / rate
      : fromCurrency === "GBP" && toCurrency === "TZS"
      ? amount * rate
      : amount;

  async function fetchOffers() {
    const { data, error } = await supabase
      .from("offers")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setOffers(data as Offer[]);
    }
  }

  useEffect(() => {
    fetchOffers();
  }, []);

  async function postOffer() {
    if (!name || !phone || !amount || !rate) return;

    const { error } = await supabase.from("offers").insert([
      {
        name,
        phone,
        from_currency: fromCurrency,
        to_currency: toCurrency,
        rate,
        amount,
      },
    ]);

    if (!error) {
      setName("");
      setPhone("");
      setAmount(0);
      setRate(3600);
      fetchOffers();
      alert("Offer posted successfully");
    }
  }

  return (
    <main style={{ padding: 20, fontFamily: "Arial, sans-serif" }}>
      <h1>P2P FX Marketplace</h1>

      <div style={{ maxWidth: 500, marginBottom: 30 }}>
        <h2>Post Offer</h2>

        <input
          style={{ display: "block", width: "100%", marginBottom: 10, padding: 10 }}
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          style={{ display: "block", width: "100%", marginBottom: 10, padding: 10 }}
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          <select
            style={{ padding: 10, flex: 1 }}
            value={fromCurrency}
            onChange={(e) => setFromCurrency(e.target.value)}
          >
            <option>TZS</option>
            <option>GBP</option>
          </select>

          <select
            style={{ padding: 10, flex: 1 }}
            value={toCurrency}
            onChange={(e) => setToCurrency(e.target.value)}
          >
            <option>GBP</option>
            <option>TZS</option>
          </select>
        </div>

        <input
          style={{ display: "block", width: "100%", marginBottom: 10, padding: 10 }}
          type="number"
          placeholder="Rate"
          value={rate}
          onChange={(e) => setRate(Number(e.target.value))}
        />

        <input
          style={{ display: "block", width: "100%", marginBottom: 10, padding: 10 }}
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
        />

        <p>
          Preview: {amount} {fromCurrency} → {total.toFixed(2)} {toCurrency}
        </p>

        <button
          style={{ padding: "10px 16px", cursor: "pointer" }}
          onClick={postOffer}
        >
          Post Offer
        </button>
      </div>

      <div>
        <h2>Marketplace</h2>

        {offers.map((offer) => {
          const offerTotal =
            offer.from_currency === "TZS" && offer.to_currency === "GBP"
              ? offer.amount / offer.rate
              : offer.from_currency === "GBP" && offer.to_currency === "TZS"
              ? offer.amount * offer.rate
              : offer.amount;

          return (
            <div
              key={offer.id}
              style={{
                border: "1px solid #ccc",
                borderRadius: 8,
                padding: 12,
                marginBottom: 12,
                maxWidth: 500,
              }}
            >
              <p><strong>{offer.name}</strong></p>
              <p>Phone: {offer.phone}</p>
              <p>
                Pair: {offer.from_currency} → {offer.to_currency}
              </p>
              <p>Amount: {offer.amount}</p>
              <p>Rate: {offer.rate}</p>
              <p>Total: {offerTotal.toFixed(2)} {offer.to_currency}</p>
            </div>
          );
        })}
      </div>
    </main>
  );
}
