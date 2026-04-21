"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const [trades, setTrades] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("exchange_requests")
        .select("*")
        .order("created_at", { ascending: false });

      setTrades(data || []);
    };

    load();
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>

      <p>Total trades: {trades.length}</p>

      {trades.map((t) => (
        <div key={t.id}>
          <p>
            {t.send_amount} {t.send_currency} → {t.receive_amount}{" "}
            {t.receive_currency}
          </p>
          <p>Status: {t.status}</p>
          <a href={`/trades/${t.id}`}>Open</a>
        </div>
      ))}
    </div>
  );
}