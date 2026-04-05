"use client";

import Link from "next/link";
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

  const [authEmail, setAuthEmail] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

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
          setMessage("Payment successful. Your credits have been added.");
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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .single();

        if (data) {
          setProfile(data);
          setFullName(data.full_name || "");
          setPhone(data.phone || "");
        }
      } else {
        setProfile(null);
        setFullName("");
        setPhone("");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const saveProfile = async () => {
    if (!user) {
      alert("Please log in first.");
      return;
    }

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

      alert("Profile saved successfully.");
    } catch (error) {
      console.error(error);
      alert("Failed to save profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const startCheckout = async (amount: number) => {
    if (!user) {
      alert("Please log in to purchase credits and unlock trader contacts.");
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

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      alert("Checkout link not returned.");
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleMagicLinkLogin = async () => {
    if (!authEmail.trim()) {
      alert("Please enter your email address.");
      return;
    }

    try {
      setAuthLoading(true);

      const { error } = await supabase.auth.signInWithOtp({
        email: authEmail.trim(),
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        alert(error.message);
        return;
      }

      alert("Check your email for your secure login link.");
    } catch (error) {
      console.error(error);
      alert("Could not send login link.");
    } finally {
      setAuthLoading(false);
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
            <p className="card-subtitle">
              Please wait while we load your dashboard.
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
          <div className="eyebrow">Tanzania ↔ UK Exchange Network</div>
          <h1>P2P FX Marketplace</h1>
          <p>
            A trusted peer-to-peer platform connecting people who need to exchange
            money between Tanzania and the UK — without bank limits, delays, or
            unnecessary restrictions.
          </p>
          <p>
            Built to solve real problems: sending large amounts, avoiding banking
            issues, and finding reliable exchange partners in one secure place.
          </p>
          <p className="hero-small">
            Always verify before exchanging. This platform connects users, and users
            remain responsible for their transactions.
          </p>

          <div className="stats-grid">
            <Link href="/market" className="stat-box">
              <span className="stat-label">Live Offers</span>
              <strong>4</strong>
            </Link>

            <Link href="/market" className="stat-box">
              <span className="stat-label">My Listings</span>
              <strong>{user ? "3" : "0"}</strong>
            </Link>

            <Link href="/profile" className="stat-box">
              <span className="stat-label">Unlocked Contacts</span>
              <strong>{profile?.credits ? Math.min(profile.credits, 1) : 0}</strong>
            </Link>

            <Link href="/profile" className="stat-box">
              <span className="stat-label">Credits</span>
              <strong>{profile?.credits || 0}</strong>
            </Link>
          </div>
        </div>

        {message && (
          <div
            className={`card ${
              message.includes("successful") ? "message-success" : "message-warn"
            }`}
          >
            <h2 className="card-title">Status</h2>
            <p className="card-subtitle">{message}</p>
          </div>
        )}

        <div className="card">
          <h2 className="card-title">How it works</h2>
          <div className="section-grid">
            <div className="info-card">
              <h3>1. Browse live offers</h3>
              <p>
                See who is buying or selling currency and compare rates instantly.
              </p>
            </div>

            <div className="info-card">
              <h3>2. Use credits to unlock</h3>
              <p>
                Buy credits to reveal contact details and connect directly with
                traders.
              </p>
            </div>

            <div className="info-card">
              <h3>3. Agree and exchange</h3>
              <p>
                Discuss the transaction directly and complete the exchange safely.
              </p>
            </div>
          </div>
        </div>

        {!user && (
          <div className="card">
            <h2 className="card-title">Welcome to P2P FX</h2>
            <p className="card-subtitle">
              Log in or create your account to manage your profile, unlock trader
              contacts, and complete secure transactions.
            </p>

            <div className="form-stack top-space">
              <label className="input-label">
                Email address
                <input
                  className="input"
                  type="email"
                  placeholder="Enter your email address"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                />
              </label>

              <button
                className="btn btn-primary"
                onClick={handleMagicLinkLogin}
                disabled={authLoading}
              >
                {authLoading ? "Sending login link..." : "Login / Create Account"}
              </button>

              <div className="helper-text">
                We will send a secure login link to your email.
              </div>
            </div>
          </div>
        )}

        <div className="card">
          <h2 className="card-title">Unlock Seller Contacts</h2>
          <p className="card-subtitle">
            Access verified trader contact details instantly. Choose a credit pack
            below to start connecting with exchange partners and complete
            transactions securely.
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

        {user && (
          <>
            <div className="card">
              <h2 className="card-title">Profile</h2>
              <p className="card-subtitle">
                Manage your identity, phone number and available credits.
              </p>

              <div className="form-stack top-space">
                <label className="input-label">
                  Name
                  <input
                    className="input"
                    placeholder="Full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </label>

                <label className="input-label">
                  Phone
                  <input
                    className="input"
                    placeholder="Local number? Just type 07... and the app will convert it."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </label>

                <div className="helper-text">
                  Credits Balance: {profile?.credits || 0}
                </div>

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
          </>
        )}

        <div className="card">
          <h2 className="card-title">Trust & Safety</h2>
          <p className="card-subtitle">
            Always verify rates, identity, and payment details before exchanging
            money. This platform connects users, but responsibility remains with
            participants.
          </p>
        </div>

        <div className="nav">
          <Link href="/" className="active">
            Home
          </Link>
          <Link href="/market">Market</Link>
          <Link href="/profile">Profile</Link>
        </div>
      </div>
    </main>
  );
}