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
      } catch (error) {
        console.error(error);
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
      <main className="page">
        <div className="container">
          <div className="card">
            <h2 className="card-title">Loading...</h2>
            <p className="card-subtitle">Please wait while we load your dashboard.</p>
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="page">
        <div className="container">
          <div className="hero-card">
            <h1>P2P FX Marketplace</h1>
            <p>
              A trusted peer-to-peer platform connecting people who need to
              exchange money quickly and safely.
            </p>
          </div>

          <div className="card">
            <h2 className="card-title">Please log in</h2>
            <p className="card-subtitle">
              You need to log in to manage your profile and buy credits.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="container">
        <div className="hero-card">
          <h1>P2P FX Marketplace</h1>
          <p>
            A trusted peer-to-peer platform connecting people who need to
            exchange money quickly and safely.
          </p>

          <div className="stats-grid">
            <div className="stat-box">
              <span className="stat-label">Live Offers</span>
              <strong>4</strong>
            </div>
            <div className="stat-box">
              <span className="stat-label">My Listings</span>
              <strong>1</strong>
            </div>
            <div className="stat-box">
              <span className="stat-label">Unlocked Contacts</span>
              <strong>{profile?.credits || 0}</strong>
            </div>
            <div className="stat-box">
              <span className="stat-label">Credits</span>
              <strong>{profile?.credits || 0}</strong>
            </div>
          </div>
        </div>

        {message && (
          <div className="card">
            <h2 className="card-title">Status</h2>
            <p className="card-subtitle">{message}</p>
          </div>
        )}

        <div className="card">
          <h2 className="card-title">Profile</h2>
          <p className="card-subtitle">
            Update your details to build a stronger trader profile.
          </p>

          <div className="form-stack">
            <input
              className="input"
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <input
              className="input"
              placeholder="Local number? Just type 07... and the app will convert it."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <button
              className="btn btn-primary"
              onClick={saveProfile}
              disabled={savingProfile}
            >
              {savingProfile ? "Saving..." : "Save Profile"}
            </button>

            <button className="btn btn-dark" onClick={logout}>
              Logout
            </button>
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">Verification Status</h2>
          <p className="card-subtitle">
            Not verified yet. Complete verification in the future to build more
            buyer trust and qualify for a stronger trader profile.
          </p>
        </div>

        <div className="card">
          <h2 className="card-title">Buy Credits</h2>
          <p className="card-subtitle">
            Choose a credit pack to unlock seller contact details quickly and continue trading.
          </p>

          <div className="stack top-space">
            <button
              className="btn btn-success"
              onClick={() => startCheckout(2)}
              disabled={checkoutLoading !== null}
            >
              {checkoutLoading === 2 ? "Please wait..." : "Buy 1 Credit — £2"}
            </button>

            <button
              className="btn btn-success"
              onClick={() => startCheckout(5)}
              disabled={checkoutLoading !== null}
            >
              {checkoutLoading === 5 ? "Please wait..." : "Buy 3 Credits — £5"}
            </button>

            <button
              className="btn btn-success"
              onClick={() => startCheckout(15)}
              disabled={checkoutLoading !== null}
            >
              {checkoutLoading === 15 ? "Please wait..." : "Buy 10 Credits — £15"}
            </button>
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">Trust & Safety</h2>
          <p className="card-subtitle">
            Always verify rates, identity, and payment details before exchanging money.
            This platform connects users, but responsibility remains with participants.
          </p>
        </div>
      </div>
    </main>
  );
}
}