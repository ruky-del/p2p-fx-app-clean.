"use client";

import Link from "next/link";
import { useState } from "react";
import { FiHome, FiTrendingUp, FiUser } from "react-icons/fi";

export default function ExpressPage() {
  const [sendCurrency, setSendCurrency] = useState("GBP");
  const [receiveCurrency, setReceiveCurrency] = useState("TZS");
  const [sendAmount, setSendAmount] = useState("1000");

  const rate =
    sendCurrency === "GBP" && receiveCurrency === "TZS"
      ? 3120
      : sendCurrency === "TZS" && receiveCurrency === "GBP"
      ? 1 / 3120
      : 1;

  const estimatedReceive =
    sendCurrency === "GBP" && receiveCurrency === "TZS"
      ? (Number(sendAmount) || 0) * 3120
      : sendCurrency === "TZS" && receiveCurrency === "GBP"
      ? (Number(sendAmount) || 0) / 3120
      : Number(sendAmount) || 0;

  const switchCurrencies = () => {
    setSendCurrency(receiveCurrency);
    setReceiveCurrency(sendCurrency);
  };

  return (
    <main className="page">
      <div className="container">

        {/* HEADER */}
        <div className="card">
          <h1 className="card-title">⚡ Express Exchange</h1>
          <p className="card-subtitle">
            Quick estimate for direct exchange between Tanzania and the UK.
          </p>

          <div className="stack top-space">

            <select
              className="input"
              value={sendCurrency}
              onChange={(e) => setSendCurrency(e.target.value)}
            >
              <option value="GBP">GBP</option>
              <option value="TZS">TZS</option>
            </select>

            <select
              className="input"
              value={receiveCurrency}
              onChange={(e) => setReceiveCurrency(e.target.value)}
            >
              <option value="TZS">TZS</option>
              <option value="GBP">GBP</option>
            </select>

            <input
              className="input"
              type="number"
              value={sendAmount}
              onChange={(e) => setSendAmount(e.target.value)}
              placeholder="Amount"
            />

            <button className="btn btn-outline" onClick={switchCurrencies}>
              Swap
            </button>
          </div>
        </div>

        {/* RESULT */}
        <div className="card">
          <h2 className="card-title">Estimate</h2>

          <p className="card-subtitle">
            Rate: {sendCurrency} → {receiveCurrency}
          </p>

          <div style={{ marginTop: "16px", fontSize: "20px", fontWeight: "600" }}>
            You receive:{" "}
            {sendCurrency === "GBP"
              ? `${estimatedReceive.toLocaleString()} TZS`
              : `£${estimatedReceive.toFixed(2)}`}
          </div>
        </div>

        {/* NAV */}
        <div className="nav">
          <Link href="/">
            <FiHome />
            <span>Home</span>
          </Link>

          <Link href="/market">
            <FiTrendingUp />
            <span>Market</span>
          </Link>

          <Link href="/profile">
            <FiUser />
            <span>Profile</span>
          </Link>
        </div>

      </div>
    </main>
  );
}