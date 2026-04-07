"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

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
  const [user, setUser] = useState<any>(null);
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
  const [notice, setNotice] = useState("");
  const [showCreditNotice, setShowCreditNotice] = useState(false);

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setUser(session?.user ?? null);
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

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

  const handleNeedCredits = () => {
    if (!user) {
      setShowCreditNotice(true);
      setNotice("You need to log in first before buying credits.");
      return;
    }

    window.location.href = "/#buy-credits";
  };

  return (
    <main className="page">
      <div className="container">
        <div className="market-header-card">
          <div className="market-topbar">
            <Link href="/" className="market-back">
              ←
            </Link>

            <div className="market-tabs">
              <button className="market-tab">Express</button>
              <button className="market-tab market-tab-active">P2P</button>
              <button className="market-tab">Block Trade</button>
            </div>

            <div className="market-currency-pill">{currency}</div>
          </div>

          <div className="market-side-switch">
            <button
              className={side === "buy" ? "market-switch-btn active buy" : "market-switch-btn"}
              onClick={() => setSide("buy")}
            >
              Buy
            </button>

            <button
              className={side === "sell" ? "market-switch-btn active sell" : "market-switch-btn"}
              onClick={() => setSide("sell")}
            >
              Sell
            </button>
          </div>

          <div className="market-filter-row">
            <select
              className="market-select"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="GBP">GBP</option>
              <option value="TZS">TZS</option>
            </select>

            <input
              className="market-input"
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />

            <select
              className="market-select"
              value={area}
              onChange={(e) => setArea(e.target.value)}
            >
              <option value="All">All areas</option>
              <option value="London">London</option>
              <option value="Dar es Salaam">Dar es Salaam</option>
              <option value="Birmingham">Birmingham</option>
              <option value="Mwanza">Mwanza</option>
            </select>

            <select
              className="market-select"
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "closest" | "best_rate" | "most_active")
              }
            >
              <option value="closest">Closest amount</option>
              <option value="best_rate">Best rate</option>
              <option value="most_active">Most active</option>
            </select>
          </div>

          <label className="market-check-row">
            <input
              type="checkbox"
              checked={bestMatchesOnly}
              onChange={(e) => setBestMatchesOnly(e.target.checked)}
            />
            <span>Show best matches only</span>
          </label>
        </div>

        {notice && (
          <div className="market-notice-card">
            <h2 className="card-title">Notice</h2>
            <p className="card-subtitle">{notice}</p>
          </div>
        )}

        <div className="market-section-card">
          <h2 className="market-section-title">Available Offers</h2>
          <p className="market-section-subtitle">
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
                const actionLabel = offer.side === "buy" ? "Buy" : "Sell";
                const buttonClass =
                  offer.side === "buy" ? "market-action-btn buy" : "market-action-btn sell";

                return (
                  <div key={offer.id} className="market-offer-card">
                    <div className="market-offer-left">
                      <div className="market-offer-top">
                        <div className="market-avatar">
                          {offer.trader.charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <div className="market-trader-name">
                            {offer.trader}
                            {offer.verified ? (
                              <span className="market-verified-badge">Verified Trader</span>
                            ) : null}
                          </div>

                          <div className="market-trader-meta">
                            Trades {offer.trades} <span>•</span> Rating {offer.rating}{" "}
                            <span>•</span> Area {offer.area}
                          </div>
                        </div>
                      </div>

                      <div className="market-rate">{renderRate(offer)}</div>

                      <div className="market-detail-line">
                        <span className="market-detail-label">Available</span>
                        <span className="market-detail-value">
                          {formatAmount(offer.available, offer.fromCurrency)}
                        </span>
                      </div>

                      <div className="market-detail-line">
                        <span className="market-detail-label">Account status</span>
                        <span className="market-detail-value muted">
                          {offer.verified
                            ? "Verified account details matched"
                            : "Pending verification"}
                        </span>
                      </div>

                      {isBestMatch ? <div className="market-best-match">Best Match</div> : null}
                    </div>

                    <div className="market-offer-right">
                      <div className="market-speed">{offer.speed}</div>

                      <button
                        className={buttonClass}
                        onClick={() => setSelectedOffer(offer)}
                      >
                        {actionLabel}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="market-section-card">
          <h2 className="market-section-title">Verification Policy</h2>
          <p className="market-section-subtitle">
            Traders should complete identity and bank account verification before their details are
            shared. Account names should match the registered identity to improve trust and reduce
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
        <div className="market-modal-overlay">
          <div className="market-modal">
            <h2 className="market-modal-title">Offer Details</h2>
            <p className="market-modal-subtitle">
              Review this trader before unlocking contact information.
            </p>

            <div className="market-modal-grid">
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

            <div className="market-credit-box">
              You need <strong>1 credit</strong> to unlock this trader’s contact details.
            </div>

            <div className="market-modal-actions">
              <button className="btn btn-outline" onClick={() => setSelectedOffer(null)}>
                Close
              </button>

              <button className="market-action-btn buy" onClick={handleNeedCredits}>
                Buy Credits
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreditNotice && (
        <div className="market-modal-overlay">
          <div className="market-modal small">
            <h2 className="market-modal-title">Login Required</h2>
            <p className="market-modal-subtitle">
              You need to log in first before buying credits or unlocking trader contacts.
            </p>

            <div className="market-modal-actions">
              <button
                className="btn btn-outline"
                onClick={() => setShowCreditNotice(false)}
              >
                Close
              </button>

              <Link
                href="/"
                className="btn btn-primary"
                style={{ textAlign: "center" }}
                onClick={() => setShowCreditNotice(false)}
              >
                Go to Login
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}