"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTrades = async () => {
      const { data } = await supabase
        .from("exchange_requests")
        .select("*")
        .order("created_at", { ascending: false });

      setTrades(data || []);
      setLoading(false);
    };

    loadTrades();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <main className="page">
      <div className="container">

        <div className="card">
          <h1 className="card-title">Dashboard</h1>
          <p className="card-subtitle">
            Manage your exchange requests and activity.
          </p>
        </div>

        <div className="card top-space">
          <h2 className="card-title">Summary</h2>
          <div className="helper-text">
            Total trades: {trades.length}
          </div>
        </div>

        <div className="card top-space">
          <h2 className="card-title">All Trades</h2>

          {trades.length === 0 ? (
            <p className="card-subtitle">No trades yet.</p>
          ) : (
            <div className="stack top-space">
              {trades.map((t) => (
                <div key={t.id} className="info-card">
                  <h3>
                    {t.send_amount} {t.send_currency} →{" "}
                    {t.receive_amount} {t.receive_currency}
                  </h3>
                  <p>Status: {t.status}</p>

                  <Link href={`/trades/${t.id}`} className="btn btn-outline">
                    Open Trade
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}