"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FiHome, FiTrendingUp, FiUser } from "react-icons/fi";
import { supabase } from "@/lib/supabase";

type RateRow = {
  pair: string;
  base_rate: number;
  rafiki_rate: number;
};

export default function ExpressPage() {
  const router = useRouter();

  const [sendCurrency, setSendCurrency] = useState("GBP");
  const [receiveCurrency, setReceiveCurrency] = useState("TZS");
  const [sendAmount, setSendAmount] = useState("1000");

  const [gbpToTzsRate, setGbpToTzsRate] = useState<number | null>(null);
  const [tzsToGbpRate, setTzsToGbpRate] = useState<number | null>(null);
  const [loadingRate, setLoadingRate] = useState(true);
  const [rateError, setRateError] = useState("");

  useEffect(() => {
    const loadRates = async () => {
      setLoadingRate(true);
      setRateError("");

      const { data, error } = await supabase
        .from("exchange_rates")
        .select("pair, base_rate, rafiki_rate")
        .in("pair", ["GBP_TZS", "TZS_GBP"]);

      if (error) {
        setRateError("Could not load exchange rates.");
        setLoadingRate(false);
        return;
      }

      const rows = (data || []) as RateRow[];
      const gbpTzs = rows.find((row) => row.pair === "GBP_TZS");
      const tzsGbp = rows.find((row) => row.pair === "TZS_GBP");

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

  const activeRate = useMemo(() => {
    if (sendCurrency === "GBP" && receiveCurrency === "TZS") return gbpToTzsRate;
    if (sendCurrency === "TZS" && receiveCurrency === "GBP") return tzsToGbpRate;
    return null;
  }, [sendCurrency, receiveCurrency, gbpToTzsRate, tzsToGbpRate]);

  const tradeLabel =
    sendCurrency === "GBP" && receiveCurrency === "TZS"
      ? "We buy GBP (you receive TZS)"
      : sendCurrency === "TZS" && receiveCurrency === "GBP"
      ? "We sell GBP (you receive GBP)"
      : "Exchange";

  const estimatedReceive = useMemo(() => {
    const amount = Number(sendAmount);
    if (!amount || !activeRate) return 0;
    return amount * activeRate;
  }, [sendAmount, activeRate]);

  const swapCurrencies = () => {
    const oldSend = sendCurrency;
    const oldReceive = receiveCurrency;
    setSendCurrency(oldReceive);
    setReceiveCurrency(oldSend);
    setSendAmount("");
  };

  const formatValue = (value: number, currency: string) => {
    if (!value) return `0 ${currency}`;
    if (currency === "TZS") return `${value.toLocaleString()} TZS`;
    return `${value.toFixed(6)} GBP`;
  };

  const handleContinue = () => {
    const params = new URLSearchParams({
      sendCurrency,
      receiveCurrency,
      sendAmount,
      receiveAmount: String(estimatedReceive),
      rateUsed: String(activeRate || 0),
      tradeLabel,
    });

    router.push(`/exchange?${params.toString()}`);
  };

  return (
    <main className="page">
      <div className="container">
        <div className="card">
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "12px",
    }}
  >
    <h1 className="card-title" style={{ margin: 0 }}>
      ⚡ Express Exchange
    </h1>

    <Link
      href="/market"
      className="btn btn-outline"
      style={{ width: "auto", textAlign: "center", padding: "8px 14px" }}
    >
      Back to P2P
    </Link>
  </div>

  <p className="card-subtitle" style={{ marginTop: "10px" }}>
    Quick estimate for direct exchange between Tanzania and the UK.
  </p>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
            <button
              type="button"
              onClick={swapCurrencies}
              className="swap-button"
              aria-label="Swap currencies"
              title="Swap currencies"
            >
              ↔
            </button>
          </div>

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
              placeholder="Enter amount"
            />
          </div>
        </div>

        <div className="card top-space">
          <h2 className="card-title">Estimate</h2>

          {loadingRate ? (
            <p className="card-subtitle">Loading latest Rafiki rate...</p>
          ) : rateError ? (
            <p className="card-subtitle">{rateError}</p>
          ) : (
            <>
              <p className="card-subtitle">{tradeLabel}</p>

              <div className="receive-amount">
                You receive: {formatValue(estimatedReceive, receiveCurrency)}
              </div>

              <div style={{ marginTop: "10px", opacity: 0.8 }}>
                Exchange rate:{" "}
                {activeRate !== null
                  ? sendCurrency === "GBP"
                    ? `1 GBP = ${activeRate.toLocaleString()} TZS`
                    : `1 TZS = ${activeRate.toFixed(6)} GBP`
                  : "--"}
              </div>

              <button className="button top-space" type="button" onClick={handleContinue}>
                Continue to Exchange
              </button>
            </>
          )}
        </div>
      </div>

      <div className="nav">
        <Link href="/">
          <FiHome />
          <span>Home</span>
        </Link>

        <Link href="/market" className="active">
          <FiTrendingUp />
          <span>Market</span>
        </Link>

        <Link href="/profile">
          <FiUser />
          <span>Profile</span>
        </Link>
      </div>
    </main>
  );
}