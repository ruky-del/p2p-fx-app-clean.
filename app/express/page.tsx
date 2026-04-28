"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ExpressPage() {
  const router = useRouter();

  const [sendCurrency, setSendCurrency] = useState("GBP");
  const [receiveCurrency, setReceiveCurrency] = useState("TZS");
  const [amount, setAmount] = useState(1000);

  // 🔥 FIXED STATIC RATE (no loading issue)
  const rate = 3550;

  const receiveAmount =
    sendCurrency === "GBP"
      ? amount * rate
      : amount / rate;

  const handleContinue = () => {
    router.push(
      `/exchange?sendCurrency=${sendCurrency}&receiveCurrency=${receiveCurrency}&sendAmount=${amount}&receiveAmount=${receiveAmount}&rateUsed=${rate}&tradeLabel=Express`
    );
  };

  return (
    <main style={{ padding: 20 }}>
      <h1>⚡ Express Exchange</h1>
      <p>Quick exchange between UK and Tanzania</p>

      <div style={{ marginTop: 20 }}>
        <label>Send Currency</label>
        <select
          value={sendCurrency}
          onChange={(e) => setSendCurrency(e.target.value)}
        >
          <option value="GBP">GBP</option>
          <option value="TZS">TZS</option>
        </select>
      </div>

      <div style={{ marginTop: 20 }}>
        <label>Receive Currency</label>
        <select
          value={receiveCurrency}
          onChange={(e) => setReceiveCurrency(e.target.value)}
        >
          <option value="TZS">TZS</option>
          <option value="GBP">GBP</option>
        </select>
      </div>

      <div style={{ marginTop: 20 }}>
        <label>Amount</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
        />
      </div>

      <div style={{ marginTop: 20 }}>
        <h2>Estimate</h2>
        <p>
          You receive:{" "}
          {receiveCurrency === "TZS"
            ? `${receiveAmount.toLocaleString()} TZS`
            : `${receiveAmount.toFixed(6)} GBP`}
        </p>
        <p>Rate: 1 GBP = {rate} TZS</p>
      </div>

      <button
        onClick={handleContinue}
        style={{
          marginTop: 20,
          padding: 10,
          background: "#00bcd4",
          color: "white",
          border: "none",
        }}
      >
        Continue
      </button>
    </main>
  );
}