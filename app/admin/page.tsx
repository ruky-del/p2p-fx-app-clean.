"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FiHome, FiTrendingUp, FiUser } from "react-icons/fi";
import { supabase } from "@/lib/supabase";

export default function AdminPage() {
  const [sellMargin, setSellMargin] = useState("0.02");
  const [buyMargin, setBuyMargin] = useState("0.04");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadConfig = async () => {
      const { data } = await supabase
        .from("exchange_config")
        .select("gbp_sell_margin, gbp_buy_margin")
        .eq("id", 1)
        .single();

      if (data) {
        setSellMargin(String(data.gbp_sell_margin));
        setBuyMargin(String(data.gbp_buy_margin));
      }
    };

    loadConfig();
  }, []);

  const saveConfig = async () => {
    try {
      setSaving(true);
      setMessage("");

      const { error } = await supabase
        .from("exchange_config")
        .update({
          gbp_sell_margin: Number(sellMargin),
          gbp_buy_margin: Number(buyMargin),
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1);

      if (error) {
        setMessage(error.message);
        return;
      }

      await fetch("/api/update-rates");
      setMessage("Margins saved and rates updated.");
    } catch (error) {
      console.error(error);
      setMessage("Could not save margins.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="page">
      <div className="container">
        <div className="card">
          <h1 className="card-title">Admin Margin Control</h1>
          <p className="card-subtitle">Set buy and sell margins, then update rates instantly.</p>

          <div className="form-stack top-space">
            <label className="input-label">
              GBP Sell Margin
              <input
                className="input"
                value={sellMargin}
                onChange={(e) => setSellMargin(e.target.value)}
                placeholder="0.02"
              />
            </label>

            <label className="input-label">
              GBP Buy Margin
              <input
                className="input"
                value={buyMargin}
                onChange={(e) => setBuyMargin(e.target.value)}
                placeholder="0.04"
              />
            </label>

            <button className="btn btn-primary" type="button" onClick={saveConfig} disabled={saving}>
              {saving ? "Saving..." : "Save Margins"}
            </button>

            {message ? <div className="helper-text">{message}</div> : null}
          </div>
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