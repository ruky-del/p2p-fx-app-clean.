"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ExpressPage() {
  const router = useRouter();

  const [sendCurrency, setSendCurrency] = useState("GBP");
  const [receiveCurrency, setReceiveCurrency] = useState("TZS");
  const [amount, setAmount] = useState(1000);

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
    <main className="page">
      <div className="container">
        
        {/* HEADER */}
        <div className="market-header-card">
          <h1 className="market-section-title">⚡ Express Exchange</h1>
          <p className="market-section-subtitle">
            Fast exchange between UK and Tanzania
          </p>
        </div>

        {/* FORM */}
        <div className="market-section-card">

          <div className="market-filter-row">

            <div>
              <label className="market-detail-label">You send</label>
              <select
                className="market-select"
                value={sendCurrency}
                onChange={(e) => setSendCurrency(e.target.value)}
              >
                <option value="GBP">GBP</option>
                <option value="TZS">TZS</option>
              </select>
            </div>

            <div>
              <label className="market-detail-label">You receive</label>
              <select
                className="market-select"
                value={receiveCurrency}
                onChange={(e) => setReceiveCurrency(e.target.value)}
              >
                <option value="TZS">TZS</option>
                <option value="GBP">GBP</option>
              </select>
            </div>

            <div>
              <label className="market-detail-label">Amount</label>
              <input
                className="market-input"
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>

          </div>

        </div>

        {/* ESTIMATE */}
        <div className="market-section-card">

          <h2 className="market-section-title">Estimate</h2>

          <div className="market-detail-line">
            <span className="market-detail-label">You receive</span>
            <span className="market-detail-value">
              {receiveCurrency === "TZS"
                ? `${receiveAmount.toLocaleString()} TZS`
                : `${receiveAmount.toFixed(6)} GBP`}
            </span>
          </div>

          <div className="market-detail-line">
            <span className="market-detail-label">Rate</span>
            <span className="market-detail-value">
              1 GBP = {rate.toLocaleString()} TZS
            </span>
          </div>

          <button
            className="market-action-btn buy"
            style={{ width: "100%", marginTop: "16px" }}
            onClick={handleContinue}
          >
            Continue
          </button>

        </div>

      </div>
    </main>
  );
}