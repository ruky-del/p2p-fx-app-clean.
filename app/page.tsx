"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
      setLoadingUser(false);
    };

    loadUser();
  }, []);

  const startCheckout = async (amount: number) => {
    if (!user) {
      alert("Please log in first");
      return;
    }

    const res = await fetch("/api/checkout", {
      method: "POST",
      body: JSON.stringify({
        amount,
        userId: user.id,
        email: user.email,
      }),
    });

    const data = await res.json();
    window.location.href = data.url;
  };

  if (loadingUser) return <div>Loading...</div>;

  return (
    <main className="page">
      <div className="container">
        <h1>P2P FX Marketplace</h1>

        {!user && (
          <div className="card">
            <h2>Please log in</h2>
            <p>You need to log in before making a payment.</p>
          </div>
        )}

        <div className="card">
          <h2>Buy Credits</h2>

          <button onClick={() => startCheckout(2)}>
            Buy 1 Credit — £2
          </button>

          <button onClick={() => startCheckout(5)}>
            Buy 3 Credits — £5
          </button>

          <button onClick={() => startCheckout(15)}>
            Buy 10 Credits — £15
          </button>
        </div>
      </div>
    </main>
  );
}