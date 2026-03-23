"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [offers, setOffers] = useState([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState(0);
  const [rate, setRate] = useState(3600);

  const total = amount / rate;

  async function fetchOffers() {
    const { data } = await supabase
      .from("offers")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setOffers(data);
  }

  useEffect(() => {
    fetchOffers();
  }, []);

  async function postOffer() {
    await supabase.from("offers").insert([
      {
        name,
        phone,
        from_currency: "TZS",
        to_currency: "GBP",
        amount,
        rate,
      },
    ]);

    fetchOffers();
    setName("");
    setPhone("");
    setAmount(0);
  }

  return (
    <main style={{ padding: 30, fontFamily: "Arial" }}>
      <h1 style={{ fontSize: 28, marginBottom: 20 }}>
        💱 P2P FX Marketplace
      </h1>

      {/* FORM */}
      <div
        style={{
          background: "#f9f9f9",
          padding: 20,
          borderRadius: 10,
          maxWidth: 400,
          marginBottom: 30,
        }}
      >
        <h2>Post Offer</h2>

        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: "100%", padding: 10, marginBottom: 10 }}
        />

        <input
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={{ width: "100%", padding: 10, marginBottom: 10 }}
        />

        <input
          type="number"
          placeholder="Amount (TZS)"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          style={{ width: "100%", padding: 10, marginBottom: 10 }}
        />

        <input
          type="number"
          placeholder="Rate"
          value={rate}
          onChange={(e) => setRate(Number(e.target.value))}
          style={{ width: "100%", padding: 10, marginBottom: 10 }}
        />

        <p>
          Preview: {amount} TZS → {total.toFixed(2)} GBP
        </p>

        <button
          onClick={postOffer}
          style={{
            background: "#16a34a",
            color: "white",
            padding: "10px 15px",
            borderRadius: 6,
            border: "none",
            cursor: "pointer",
          }}
        >
          Post Offer
        </button>
      </div>

      {/* MARKETPLACE */}
      <h2>Marketplace</h2>

      {offers.map((offer: any) => (
        <div
          key={offer.id}
          style={{
            border: "1px solid #ddd",
            padding: 15,
            borderRadius: 10,
            marginBottom: 15,
            maxWidth: 400,
          }}
        >
          <h3>{offer.name}</h3>
          <p>📞 {offer.phone}</p>
          <p>
            {offer.amount} TZS → {(offer.amount / offer.rate).toFixed(2)} GBP
          </p>
          <p>Rate: {offer.rate}</p>

          <a
            href={`https://wa.me/${offer.phone}`}
            target="_blank"
            style={{
              display: "inline-block",
              marginTop: 10,
              background: "#22c55e",
              color: "white",
              padding: "8px 12px",
              borderRadius: 6,
              textDecoration: "none",
            }}
          >
            💬 Contact Seller
          </a>
        </div>
      ))}
    </main>
  );
}
