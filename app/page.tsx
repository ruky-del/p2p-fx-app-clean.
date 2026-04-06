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
  const [messageType, setMessageType] = useState<"success" | "warn" | "info">("info");
  const [loadingUser, setLoadingUser] = useState(true);

  const [authEmail, setAuthEmail] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [authStep, setAuthStep] = useState<"email" | "code">("email");
  const [authLoading, setAuthLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

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
          setMessage("Payment successful. Your credits have been added to your account.");
          setMessageType("success");
        }

        if (params.get("canceled") === "true") {
          setMessage("Payment was cancelled. You can try again any time.");
          setMessageType("warn");
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

        setMessage("You are now logged in successfully.");
        setMessageType("success");
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

  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  const saveProfile = async () => {
    if (!user) {
      setMessage("Please log in first before updating your profile.");
      setMessageType("warn");
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
        setMessage(error.message);
        setMessageType("warn");
        return;
      }

      setProfile((prev) => ({
        id: user.id,
        full_name: fullName,
        phone,
        credits: prev?.credits || 0,
        email: user.email,
      }));

      setMessage("Profile saved successfully.");
      setMessageType("success");
    } catch (error) {
      console.error(error);
      setMessage("We could not save your profile. Please try again.");
      setMessageType("warn");
    } finally {
      setSavingProfile(false);
    }
  };

  const startCheckout = async (amount: number) => {
    if (!user) {
      setMessage("Please log in to purchase credits and unlock trader contacts.");
      setMessageType("warn");
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
        setMessage(data.error || "Checkout failed.");
        setMessageType("warn");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      setMessage("Checkout link was not returned. Please try again.");
      setMessageType("warn");
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong while starting checkout.");
      setMessageType("warn");
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleSendCode = async () => {
    if (!authEmail.trim()) {
      setMessage("Please enter your email address.");
      setMessageType("warn");
      return;
    }

    if (cooldown > 0) {
      setMessage(`Please wait ${cooldown} seconds before requesting another code.`);
      setMessageType("info");
      return;
    }

    try {
      setAuthLoading(true);

      const { error } = await supabase.auth.signInWithOtp({
        email: authEmail.trim(),
      });

      if (error) {
        setMessage(
          error.message === "email rate limit exceeded"
            ? "Too many login requests were made. Please wait a short moment and try again."
            : error.message
        );
        setMessageType("warn");
        return;
      }

      setAuthStep("code");
      setCooldown(30);
      setMessage("We sent a secure login code to your email. Enter it below to continue.");
      setMessageType("info");
    } catch (error) {
      console.error(error);
      setMessage("We could not send your login code. Please try again.");
      setMessageType("warn");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!authEmail.trim() || !authCode.trim()) {
      setMessage("Please enter both your email address and the login code.");
      setMessageType("warn");
      return;
    }

    try {
      setAuthLoading(true);

      const { error } = await supabase.auth.verifyOtp({
        email: authEmail.trim(),
        token: authCode.trim(),
        type: "email",
      });

      if (error) {
        setMessage("The code is invalid or has expired. Please request a new one.");
        setMessageType("warn");
        return;
      }

      setMessage("Login successful.");
      setMessageType("success");
      window.location.reload();
    } catch (error) {
      console.error(error);
      setMessage("We could not verify your code. Please try again.");
      setMessageType("warn");
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
            <p className="card-subtitle">Please wait while we load your dashboard.</p>
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
              messageType === "success"
                ? "message-success"
                : messageType === "warn"
                ? "message-warn"
                : ""
            }`}
          >
            <h2 className="card-title">
              {messageType === "success"
                ? "Success"
                : messageType === "warn"
                ? "Notice"
                : "Update"}
            </h2>
            <p className="card-subtitle">{message}</p>
          </div>
        )}

        <div className="card">
          <h2 className="card-title">How it works</h2>
          <div className="section-grid">
            <div className="info-card">
              <h3>1. Browse live offers</h3>
              <p>See who is buying or selling currency and compare rates instantly.</p>
            </div>

            <div className="info-card">
              <h3>2. Use credits to unlock</h3>
              <p>Buy credits to reveal contact details and connect directly with traders.</p>
            </div>

            <div className="info-card">
              <h3>3. Agree and exchange</h3>
              <p>Discuss the transaction directly and complete the exchange safely.</p>
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

              {authStep === "code" && (
                <label className="input-label">
                  Login code
                  <input
                    className="input"
                    type="text"
                    placeholder="Enter the code from your email"
                    value={authCode}
                    onChange={(e) => setAuthCode(e.target.value)}
                  />
                </label>
              )}

              {authStep === "email" ? (
                <button
                  className="btn btn-primary"
                  onClick={handleSendCode}
                  disabled={authLoading || cooldown > 0}
                >
                  {authLoading
                    ? "Sending code..."
                    : cooldown > 0
                    ? `Please wait ${cooldown}s`
                    : "Send Login Code"}
                </button>
              ) : (
                <>
                  <button
                    className="btn btn-primary"
                    onClick={handleVerifyCode}
                    disabled={authLoading}
                  >
                    {authLoading ? "Verifying..." : "Verify Code & Login"}
                  </button>

                  <button
                    className="btn btn-outline"
                    onClick={() => {
                      setAuthStep("email");
                      setAuthCode("");
                      setMessage("You can enter a different email address below.");
                      setMessageType("info");
                    }}
                    disabled={authLoading}
                  >
                    Change Email
                  </button>

                  <button
                    className="btn btn-outline"
                    onClick={handleSendCode}
                    disabled={authLoading || cooldown > 0}
                  >
                    {cooldown > 0 ? `Resend available in ${cooldown}s` : "Resend Code"}
                  </button>
                </>
              )}

              <div className="helper-text">
                {authStep === "email"
                  ? "We will send a secure login code to your email."
                  : "Check your email, copy the code, and enter it above."}
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