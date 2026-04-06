"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const offersData = [
  {
    id: 1,
    trader: "Dar Exchange",
    rating: "98.20%",
    trades: 214,
    side: "buy",
    fromCurrency: "GBP",
    toCurrency: "TZS",
    rate: 3120,
    available: 980,
    area: "Dar es Salaam",
    verified: true,
    speed: "10 min",
  },
  {
    id: 2,
    trader: "UK Seller",
    rating: "99.10%",
    trades: 402,
    side: "buy",
    fromCurrency: "GBP",
    toCurrency: "TZS",
    rate: 3140,
    available: 900,
    area: "Birmingham",
    verified: true,
    speed: "20 min",
  },
  {
    id: 3,
    trader: "Alice Trader",
    rating: "94.45%",
    trades: 81,
    side: "buy",
    fromCurrency: "GBP",
    toCurrency: "TZS",
    rate: 3150,
    available: 1500,
    area: "London",
    verified: true,
    speed: "15 min",
  },
  {
    id: 4,
    trader: "Sambala FX",
    rating: "97.80%",
    trades: 350,
    side: "sell",
    fromCurrency: "TZS",
    toCurrency: "GBP",
    rate: 2618,
    available: 397900,
    area: "Dar es Salaam",
    verified: true,
    speed: "15 min",
  },
  {
    id: 5,
    trader: "Mboni One",
    rating: "99.49%",
    trades: 1902,
    side: "sell",
    fromCurrency: "TZS",
    toCurrency: "GBP",
    rate: 2553.99,
    available: 5932770,
    area: "Mwanza",
    verified: true,
    speed: "15 min",
  },
];

export default function MarketPage() {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [currency, setCurrency] = useState("GBP");
  const [amount, setAmount] = useState("1000");
  const [area, setArea] = useState("All");
  const [sortBy, setSortBy] = useState<"closest" | "best_price" | "most_active">(
    "closest"
  );

  const numericAmount = Number(amount) || 0;

  const filteredOffers = useMemo(() => {
    let base = offersData.filter((offer) => {
      const sideMatch = offer.side === side;
      const currencyMatch = offer.fromCurrency === currency;
      const areaMatch = area === "All" || offer.area === area;
      return sideMatch && currencyMatch && areaMatch;
    });

    const ranked = [...base].sort((a, b) => {
      if (sortBy === "closest") {
        const diffA = Math.abs(a.available - numericAmount);
        const diffB = Math.abs(b.available - numericAmount);

        if (diffA !== diffB) return diffA - diffB;

        return side === "buy" ? a.rate - b.rate : b.rate - a.rate;
      }

      if (sortBy === "best_price") {
        return side === "buy" ? a.rate - b.rate : b.rate - a.rate;
      }

      return b.trades - a.trades;
    });

    return ranked;
  }, [side, currency, area, sortBy, numericAmount]);

  const bestOfferId = filteredOffers[0]?.id;

  const formatAmount = (value: number, curr: string) => {
    if (curr === "GBP") return `£${value.toLocaleString()}`;
    return `${value.toLocaleString()} TZS`;
  };

  const renderRate = (offer: (typeof offersData)[number]) => {
    if (offer.fromCurrency === "GBP" && offer.toCurrency === "TZS") {
      return `£1 = ${offer.rate.toLocaleString()} TZS`;
    }

    if (offer.fromCurrency === "TZS" && offer.toCurrency === "GBP") {
      return `1 GBP = ${offer.rate.toLocaleString()} TZS`;
    }

    return `${offer.fromCurrency} → ${offer.toCurrency}`;
  };

  return (
    <main className="page">
      <div className="container">
        <div className="card">
          <h2 className="card-title">Marketplace</h2>
          <p className="card-subtitle">
            Find the best exchange partner based on currency, amount, area and match quality.
          </p>

          <div className="form-stack top-space">
            <div className="stack" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <button
                className={`btn ${side === "buy" ? "btn-success" : "btn-outline"}`}
                onClick={() => setSide("buy")}
              >
                Buy
              </button>

              <button
                className={`btn ${side === "sell" ? "btn-dark" : "btn-outline"}`}
                onClick={() => setSide("sell")}
              >
                Sell
              </button>
            </div>

            <label className="input-label">
              I want to exchange
              <select
                className="input"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="GBP">GBP</option>
                <option value="TZS">TZS</option>
              </select>
            </label>

            <label className="input-label">
              Amount
              <input
                className="input"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>

            <label className="input-label">
              Area
              <select
                className="input"
                value={area}
                onChange={(e) => setArea(e.target.value)}
              >
                <option value="All">All areas</option>
                <option value="London">London</option>
                <option value="Dar es Salaam">Dar es Salaam</option>
                <option value="Birmingham">Birmingham</option>
                <option value="Mwanza">Mwanza</option>
              </select>
            </label>

            <label className="input-label">
              Sort by
              <select
                className="input"
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "closest" | "best_price" | "most_active")
                }
              >
                <option value="closest">Closest amount match</option>
                <option value="best_price">Best rate</option>
                <option value="most_active">Most active traders</option>
              </select>
            </label>
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">Available Offers</h2>
          <p className="card-subtitle">
            Browse all matching offers or use sorting to find the best exchange match first.
          </p>

          <div className="offer-list top-space">
            {filteredOffers.length === 0 ? (
              <p className="empty-state">
                No offers match your current filters. Try changing the amount, area or currency.
              </p>
            ) : (
              filteredOffers.map((offer) => {
                const isBestMatch = offer.id === bestOfferId;
                const buttonLabel = side === "buy" ? "Buy" : "Sell";

                return (
                  <div key={offer.id} className="offer-item">
                    <div className="offer-main">
                      <h3>
                        {offer.trader}{" "}
                        {offer.verified ? (
                          <span style={{ fontSize: "0.85rem", color: "#2563eb" }}>
                            • Verified Trader
                          </span>
                        ) : null}
                      </h3>

                      <p>
                        Trades: {offer.trades} • Rating: {offer.rating} • Area: {offer.area}
                      </p>

                      <p style={{ marginTop: "8px" }}>
                        Available: {formatAmount(offer.available, offer.fromCurrency)}
                      </p>

                      <p>
                        Account status:{" "}
                        {offer.verified ? "Verified account details matched" : "Pending verification"}
                      </p>

                      {isBestMatch ? (
                        <div
                          style={{
                            marginTop: "10px",
                            display: "inline-block",
                            padding: "6px 10px",
                            borderRadius: "999px",
                            background: "#fef3c7",
                            color: "#92400e",
                            fontSize: "0.8rem",
                            fontWeight: 700,
                          }}
                        >
                          Best Match
                        </div>
                      ) : null}
                    </div>

                    <div className="offer-side">
                      <div className="offer-rate">{renderRate(offer)}</div>
                      <div className="offer-meta">{offer.speed}</div>

                      <button
                        className={`btn ${side === "buy" ? "btn-success" : "btn-dark"}`}
                        style={{ marginTop: "14px" }}
                      >
                        {buttonLabel}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">Verification Policy</h2>
          <p className="card-subtitle">
            Traders should complete identity and bank account verification before their payment
            details are shared. Account names must match the registered identity to improve trust
            and reduce fraud.
          </p>
        </div>

        <div className="nav">
          <Link href="/">Home</Link>
          <Link href="/market" className="active">
            Market
          </Link>
          <Link href="/profile">Profile</Link>
        </div>
      </div>
    </main>
  );
}