"use client";

import { useState } from "react";

export default function Home() {
  const [message, setMessage] = useState("");

  return (
    <main style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>
      <h1>P2P FX App</h1>
      <p>Buy and sell foreign currency easily.</p>

      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        <button onClick={() => setMessage("You clicked BUY")}>
          Buy
        </button>

        <button onClick={() => setMessage("You clicked SELL")}>
          Sell
        </button>

        <button onClick={() => setMessage("You clicked DELETE")}>
          Delete
        </button>
      </div>

      <p style={{ marginTop: 20 }}>{message}</p>
    </main>
  );
}