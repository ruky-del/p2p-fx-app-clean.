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
  const [sortBy, setSortBy] = useState<"closest" | "best_rate" | "most_active">(
    "closest"
  );
  const [bestMatchesOnly, setBestMatchesOnly] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<(typeof offersData)[number] | null>(
    null
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

      if (sortBy === "best_rate") {
        return side === "buy" ? a.rate - b.rate : b.rate - a.rate;
      }

      return b.trades - a.trades;
    });

    if (bestMatchesOnly) {
      return ranked.slice(0, 3);
    }

    return ranked;
  }, [side, currency, area, sortBy, numericAmount, bestMatchesOnly]);

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

  const unlockCost = 1;

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
                I want to buy
              </button>

              <button
                className={`btn ${side === "sell" ? "btn-dark" : "btn-outline"}`}
                onClick={() => setSide("sell")}
              >
                I want to sell
              </button>
            </div>

            <label className="input-label">
              Currency you are exchanging
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
                  setSortBy(e.target.value as "closest" | "best_rate" | "most_active")
                }
              >
                <option value="closest">Closest amount match</option>
                <option value="best_rate">Best rate</option>
                <option value="most_active">Most active traders</option>
              </select>
            </label>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontWeight: 600,
                color: "#334155",
              }}
            >
              <input
                type="checkbox"
                checked={bestMatchesOnly}
                onChange={(e) => setBestMatchesOnly(e.target.checked)}
              />
              Show best matches only
            </label>
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">Available Offers</h2>
          <p className="card-subtitle">
            Open an offer to review trader details and unlock contact information when you are ready.
          </p>

          <div className="offer-list top-space">
            {filteredOffers.length === 0 ? (
              <p className="empty-state">
                No offers match your current filters. Try changing the amount, area or currency.
              </p>
            ) : (
              filteredOffers.map((offer) => {
                const isBestMatch = offer.id === bestOfferId;

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
                        className="btn btn-success"
                        style={{ marginTop: "14px" }}
                        onClick={() => setSelectedOffer(offer)}
                      >
                        Unlock Contact
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
            Traders should complete identity and bank account verification before their details are
            shared. Account names must match the registered identity to improve trust and reduce
            fraud.
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

      {selectedOffer && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 50,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "520px",
              background: "#ffffff",
              borderRadius: "22px",
              padding: "24px",
              boxShadow: "0 25px 80px rgba(15, 23, 42, 0.25)",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "1.6rem", color: "#0f172a" }}>
              Offer Details
            </h2>

            <p style={{ marginTop: "10px", color: "#475569", lineHeight: 1.6 }}>
              Review this trader before unlocking contact information.
            </p>

            <div style={{ marginTop: "18px", display: "grid", gap: "10px" }}>
              <div><strong>Trader:</strong> {selectedOffer.trader}</div>
              <div><strong>Area:</strong> {selectedOffer.area}</div>
              <div><strong>Trades:</strong> {selectedOffer.trades}</div>
              <div><strong>Rating:</strong> {selectedOffer.rating}</div>
              <div><strong>Rate:</strong> {renderRate(selectedOffer)}</div>
              <div>
                <strong>Available:</strong>{" "}
                {formatAmount(selectedOffer.available, selectedOffer.fromCurrency)}
              </div>
              <div>
                <strong>Verification:</strong>{" "}
                {selectedOffer.verified
                  ? "Verified account details matched"
                  : "Pending verification"}
              </div>
              <div><strong>Response speed:</strong> {selectedOffer.speed}</div>
            </div>

            <div
              style={{
                marginTop: "18px",
                padding: "14px 16px",
                borderRadius: "14px",
                background: "#f8fafc",
                color: "#334155",
                lineHeight: 1.6,
              }}
            >
              You need <strong>{unlockCost} credit</strong> to unlock this trader’s contact details.
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                marginTop: "20px",
              }}
            >
              <button className="btn btn-outline" onClick={() => setSelectedOffer(null)}>
                Close
              </button>

              <Link href="/" className="btn btn-success" style={{ textAlign: "center" }}>
                Buy Credits
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}