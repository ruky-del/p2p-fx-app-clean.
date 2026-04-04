"use client";

import Link from "next/link";

const offers = [
  {
    id: 1,
    title: "Sell GBP for TZS",
    description: "Reliable seller in London. Fast response and same-day transfer.",
    rate: "1 GBP = 3,150 TZS",
    amount: "£2,000 available",
  },
  {
    id: 2,
    title: "Buy GBP with TZS",
    description: "Buyer based in Dar es Salaam looking for quick exchange.",
    rate: "1 GBP = 3,120 TZS",
    amount: "Need £1,500",
  },
  {
    id: 3,
    title: "Sell TZS for GBP",
    description: "Trusted trader with repeat transactions and flexible timing.",
    rate: "1 GBP = 3,140 TZS",
    amount: "TZS 8,000,000 available",
  },
];

export default function MarketPage() {
  return (
    <main className="page">
      <div className="container">
        <div className="hero-card">
          <div className="eyebrow">Live exchange board</div>
          <h1>Marketplace</h1>
          <p>Browse sample live offers and compare rates before unlocking contact details.</p>
        </div>

        <div className="card">
          <h2 className="card-title">Available offers</h2>
          <p className="card-subtitle">
            These are example offers to keep the marketplace structure complete.
          </p>

          <div className="offer-list top-space">
            {offers.map((offer) => (
              <div key={offer.id} className="offer-item">
                <div className="offer-main">
                  <h3>{offer.title}</h3>
                  <p>{offer.description}</p>
                </div>

                <div className="offer-side">
                  <div className="offer-rate">{offer.rate}</div>
                  <div className="offer-meta">{offer.amount}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">Need more access?</h2>
          <p className="card-subtitle">
            Return to the home page and use Buy Credits to unlock contact details.
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