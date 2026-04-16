"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FiHome, FiTrendingUp, FiUser } from "react-icons/fi";
import { supabase } from "@/lib/supabase";

type RateRow = {
  pair: string;
  base_rate: number;
  rafiki_rate: number;
  updated_at?: string;
};

export default function ExpressPage() {
  const [sendCurrency, setSendCurrency] = useState("GBP");
  const [receiveCurrency, setReceiveCurrency] = useState("TZS");
  const [sendAmount, setSendAmount] = useState("1000");

  const [gbpToTzsRate, setGbpToTzsRate] = useState<number | null>(null);
  const [tzsToGbpRate, setTzsToGbpRate] = useState<number | null>(null);
  const [loadingRate, setLoadingRate] = useState(true);
  const [rateError, setRateError] = useState("");
const [lastUpdated, setLastUpdated] = useState("");

 useEffect(() => {
  const loadRates = async () => {
    setLoadingRate(true);
    setRateError("");

    const { data, error } = await supabase
      .from("exchange_rates")
.select("pair, base_rate, rafiki_rate, updated_at")
      .in("pair", ["GBP_TZS", "TZS_GBP"]);

    if (error) {
      console.error("Exchange rates load error:", error);
      setRateError("Could not load exchange rates.");
      setLoadingRate(false);
      return;
    }

    const rows = (data || []) as RateRow[];

    const gbpTzs = rows.find((row) => row.pair === "GBP_TZS");
    const tzsGbp = rows.find((row) => row.pair === "TZS_GBP");
if (rows.length > 0 && rows[0].updated_at) {
  setLastUpdated(rows[0].updated_at);
}

    if (!gbpTzs || !tzsGbp) {
      setRateError("Exchange rates are missing.");
      setLoadingRate(false);
      return;
    }

    setGbpToTzsRate(Number(gbpTzs.rafiki_rate));
    setTzsToGbpRate(Number(tzsGbp.rafiki_rate));
    setLoadingRate(false);
  };

  loadRates();
}, []);

  const switchCurrencies = () => {
    setSendCurrency(receiveCurrency);
    setReceiveCurrency(sendCurrency);
  };

  const activeRate =
    sendCurrency === "GBP" && receiveCurrency === "TZS"
      ? gbpToTzsRate
      : sendCurrency === "TZS" && receiveCurrency === "GBP"
      ? tzsToGbpRate
      : 1;

  const estimatedReceive =
    activeRate === null ? 0 : (Number(sendAmount) || 0) * activeRate;

  const formatValue = (value: number, currency: string) => {
    if (currency === "GBP") {
      return `£${value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }

    return `${value.toLocaleString(undefined, {
      maximumFractionDigits: 0,
    })} TZS`;
  };

  return (
    <main className="page">
      <div className="container">
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

            <button className="btn btn-outline" onClick={switchCurrencies} type="button">
              Swap
            </button>
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">Estimate</h2>

          {loadingRate ? (
            <p className="card-subtitle">Loading latest Rafiki rate...</p>
          ) : rateError ? (
            <p className="card-subtitle">{rateError}</p>
          ) : (
            <>
              <p className="card-subtitle">
                Rate: {sendCurrency} → {receiveCurrency}
              </p>

              <div style={{ marginTop: "16px", fontSize: "20px", fontWeight: 600 }}>
                You receive: {formatValue(estimatedReceive, receiveCurrency)}
              </div>

              <div style={{ marginTop: "10px", opacity: 0.8 }}>
                Rafiki rate:{" "}
                {activeRate !== null
                  ? sendCurrency === "GBP"
                    ? `1 GBP = ${activeRate.toLocaleString()} TZS`
                    : `1 TZS = ${activeRate.toFixed(6)} GBP`
                  : "-"}
              </div>
{lastUpdated ? (
  <p style={{ fontSize: "12px", opacity: 0.7, marginTop: "8px" }}>
    Last updated: {new Date(lastUpdated).toLocaleString()}
  </p>
) : null}
            </>
          )}
        </div>

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