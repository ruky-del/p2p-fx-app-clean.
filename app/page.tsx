"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type UserProfile = {
  id: string;
  full_name: string;
  phone: string;
  credits: number;
  email?: string;
};

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        setUser(user);

        if (user) {
          const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (data) {
            setProfile(data);
            setFullName(data.full_name || "");
            setPhone(data.phone || "");
          }
        }

        const params = new URLSearchParams(window.location.search);

        if (params.get("success") === "true") {
          setMessage("Payment successful ✅ Your credits have been added.");
        }

        if (params.get("canceled") === "true") {
          setMessage("Payment cancelled. No problem — you can try again anytime.");
        }
      } finally {
        setLoadingUser(false);
      }
    };

    loadUser();
  }, []);

  const saveProfile = async () => {
    if (!user) return;

    try {
      setSavingProfile(true);

      const payload = {
        id: user.id,
        full_name: fullName,
        phone,
        email: user.email,
      };

      const { error } = await supabase.from("profiles").upsert(payload);

      if (error) {
        alert(error.message);
        return;
      }

      setProfile((prev) => ({
        id: user.id,
        full_name: fullName,
        phone,
        credits: prev?.credits || 0,
        email: user.email,
      }));

      alert("Profile saved");
    } catch (error) {
      console.error(error);
      alert("Failed to save profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const startCheckout = async (amount: number) => {
    if (!user) {
      alert("Please log in first");
      return;
    }

    try {
      setCheckoutLoading(amount);

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          userId: user.id,
          email: user.email,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Checkout failed");
        return;
      }

      window.location.href = data.url;
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    } finally {
      setCheckoutLoading(null);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (loadingUser) {
    return (
      <main style={{ padding: "24px", fontFamily: "sans-serif" }}>
        <h1>Loading...</h1>
      </main>
    );
  }

  if (!user) {
    return (
      <main style={{ padding: "24px", fontFamily: "sans-serif" }}>
        <h1>P2P FX Marketplace</h1>
        <p>Please log in to manage your profile and buy credits.</p>
        <p style={{ color: "red", fontWeight: "bold" }}>
          Debug: No logged-in user found
        </p>
      </main>
    );
  }

  return (
    <main style={{ padding: "24px", fontFamily: "sans-serif" }}>
      <h1>P2P FX Marketplace</h1>

      <p style={{ color: "green", fontWeight: "bold" }}>
        Debug: Logged in as {user.email}
      </p>

      <div style={{ marginTop: "20px", padding: "16px", border: "1px solid #ccc", borderRadius: "12px" }}>
        <h2>Stats</h2>
        <p>Credits: {profile?.credits || 0}</p>
      </div>

      {message && (
        <div style={{ marginTop: "20px", padding: "16px", border: "1px solid #ccc", borderRadius: "12px" }}>
          <h2>Status</h2>
          <p>{message}</p>
        </div>
      )}

      <div style={{ marginTop: "20px", padding: "16px", border: "1px solid #ccc", borderRadius: "12px" }}>
        <h2>Profile</h2>

        <div style={{ display: "grid", gap: "12px" }}>
          <input
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            style={{ padding: "12px", border: "1px solid #ccc", borderRadius: "8px" }}
          />

          <input
            placeholder="Local number? Just type 07..."
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{ padding: "12px", border: "1px solid #ccc", borderRadius: "8px" }}
          />

          <button
            onClick={saveProfile}
            disabled={savingProfile}
            style={{ padding: "12px", borderRadius: "8px", background: "black", color: "white" }}
          >
            {savingProfile ? "Saving..." : "Save Profile"}
          </button>

          <button
            onClick={logout}
            style={{ padding: "12px", borderRadius: "8px", background: "#444", color: "white" }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ marginTop: "20px", padding: "16px", border: "2px solid green", borderRadius: "12px", background: "#f6fff6" }}>
        <h2>Buy Credits</h2>
        <p>Choose a credit pack to unlock seller contact details quickly.</p>

        <div style={{ display: "grid", gap: "12px", marginTop: "12px" }}>
          <button
            onClick={() => startCheckout(2)}
            disabled={checkoutLoading !== null}
            style={{ padding: "14px", borderRadius: "8px", background: "green", color: "white", fontWeight: "bold" }}
          >
            {checkoutLoading === 2 ? "Please wait..." : "Buy 1 Credit — £2"}
          </button>

          <button
            onClick={() => startCheckout(5)}
            disabled={checkoutLoading !== null}
            style={{ padding: "14px", borderRadius: "8px", background: "green", color: "white", fontWeight: "bold" }}
          >
            {checkoutLoading === 5 ? "Please wait..." : "Buy 3 Credits — £5"}
          </button>

          <button
            onClick={() => startCheckout(15)}
            disabled={checkoutLoading !== null}
            style={{ padding: "14px", borderRadius: "8px", background: "green", color: "white", fontWeight: "bold" }}
          >
            {checkoutLoading === 15 ? "Please wait..." : "Buy 10 Credits — £15"}
          </button>
        </div>
      </div>
    </main>
  );
}