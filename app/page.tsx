"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Offer = {
  id?: string;
  user_id?: string;
  email?: string;
  name: string;
  phone?: string;
  from_currency: string;
  to_currency: string;
  rate: number;
  amount: number;
  created_at?: string;
};

type Profile = {
  id: string;
  email?: string;
  name?: string;
  phone?: string;
};

export default function Home() {
  const [session, setSession] = useState<any>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authLoading, setAuthLoading] = useState(false);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [fromCurrency, setFromCurrency] = useState("TZS");
  const [toCurrency, setToCurrency] = useState("GBP");
  const [rate, setRate] = useState(3600);
  const [amount, setAmount] = useState(0);

  const [offers, setOffers] = useState<Offer[]>([]);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (!error && data) {
      setProfile(data);
      setProfileName(data.name || "");
      setProfilePhone(data.phone || "");
    } else {
      setProfile(null);
      setProfileName("");
      setProfilePhone("");
    }
  }

  useEffect(() => {
    if (session?.user?.id) {
      fetchProfile(session.user.id);
    } else {
      setProfile(null);
      setProfileName("");
      setProfilePhone("");
    }
  }, [session]);

  async function handleAuth() {
    if (!email || !password) {
      alert("Enter email and password");
      return;
    }

    setAuthLoading(true);

    if (authMode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        alert(error.message);
      } else {
        alert("Account created. Now login.");
        setAuthMode("login");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        alert("Invalid login credentials");
      } else {
        alert("Login successful");
      }
    }

    setAuthLoading(false);
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  async function saveProfile() {
    if (!session?.user?.id) {
      alert("Login first");
      return;
    }

    if (!profileName || !profilePhone) {
      alert("Enter your name and phone");
      return;
    }

    setSavingProfile(true);

    const { error } = await supabase.from("profiles").upsert({
      id: session.user.id,
      email: session.user.email,
      name: profileName,
      phone: profilePhone,
    });

    setSavingProfile(false);

    if (error) {
      alert("Failed to save profile");
      return;
    }

    await fetchProfile(session.user.id);
    alert("Profile saved");
  }

  async function fetchOffers() {
    const { data, error } = await supabase
      .from("offers")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setOffers(data as Offer[]);
    }
  }

  useEffect(() => {
    fetchOffers();
  }, []);

  const previewTotal =
    fromCurrency === "TZS" && toCurrency === "GBP"
      ? amount / rate
      : fromCurrency === "GBP" && toCurrency === "TZS"
      ? amount * rate
      : amount;

  async function postOffer() {
    if (!session) {
      alert("Login first");
      return;
    }

    if (!profile?.name || !profile?.phone) {
      alert("Save profile first");
      return;
    }

    if (!amount || !rate) {
      alert("Enter amount and rate");
      return;
    }

    setPosting(true);

    const { error } = await supabase.from("offers").insert([
      {
        user_id: session.user.id,
        email: session.user.email,
        name: profile.name,
        phone: profile.phone,
        from_currency: fromCurrency,
        to_currency: toCurrency,
        rate,
        amount,
      },
    ]);

    setPosting(false);

    if (error) {
      alert("Failed to post offer");
      return;
    }

    setAmount(0);
    setRate(3600);
    fetchOffers();
    alert("Offer posted successfully");
  }

  const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #eef4ff 0%, #f8fbff 45%, #ffffff 100%)",
    padding: "24px 16px 60px",
    fontFamily: "Arial, sans-serif",
    color: "#0f172a",
  };

  const containerStyle: React.CSSProperties = {
    maxWidth: 1150,
    margin: "0 auto",
  };

  const heroStyle: React.CSSProperties = {
    background: "linear-gradient(135deg, #1d4ed8 0%, #0f172a 100%)",
    color: "white",
    borderRadius: 24,
    padding: 28,
    marginBottom: 20,
    boxShadow: "0 18px 40px rgba(29, 78, 216, 0.22)",
  };

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "380px 1fr",
    gap: 20,
    alignItems: "start",
  };

  const cardStyle: React.CSSProperties = {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 20,
    padding: 22,
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 14,
    border: "1px solid #dbe2ea",
    fontSize: 15,
    boxSizing: "border-box",
    background: "#fff",
    outline: "none",
    color: "#0f172a",
  };

  const labelStyle: React.CSSProperties = {
    margin: "0 0 8px",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "#64748b",
  };

  const buttonStyle: React.CSSProperties = {
    width: "100%",
    padding: "13px 18px",
    border: "none",
    borderRadius: 14,
    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    color: "#ffffff",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 10px 20px rgba(37, 99, 235, 0.18)",
  };

  const secondaryButton: React.CSSProperties = {
    width: "100%",
    padding: "13px 18px",
    border: "none",
    borderRadius: 14,
    background: "#0f172a",
    color: "#ffffff",
    fontWeight: 700,
    cursor: "pointer",
  };

  const offersWithTotal = useMemo(() => {
    return offers.map((offer) => {
      const total =
        offer.from_currency === "TZS" && offer.to_currency === "GBP"
          ? offer.amount / offer.rate
          : offer.from_currency === "GBP" && offer.to_currency === "TZS"
          ? offer.amount * offer.rate
          : offer.amount;

      return { ...offer, total };
    });
  }, [offers]);

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <div style={heroStyle}>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: 1,
              opacity: 0.85,
              fontWeight: 700,
            }}
          >
            Live Marketplace
          </p>

          <h1
            style={{
              margin: "10px 0 12px",
              fontSize: 48,
              lineHeight: 1.02,
            }}
          >
            P2P FX Marketplace
          </h1>

          <p
            style={{
              margin: 0,
              fontSize: 17,
              maxWidth: 760,
              color: "rgba(255,255,255,0.88)",
            }}
          >
            Buy and sell foreign currency with live offers, fast posting, and
            direct WhatsApp contact.
          </p>
        </div>

        <div style={gridStyle}>
          <div style={{ display: "grid", gap: 20 }}>
            {!session && (
              <div style={cardStyle}>
                <h2 style={{ margin: "0 0 16px", fontSize: 30 }}>
                  Authentication
                </h2>

                <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                  <button
                    style={buttonStyle}
                    onClick={() => setAuthMode("signup")}
                  >
                    Sign Up
                  </button>
                  <button
                    style={secondaryButton}
                    onClick={() => setAuthMode("login")}
                  >
                    Login
                  </button>
                </div>

                <div style={{ display: "grid", gap: 12 }}>
                  <input
                    style={inputStyle}
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />

                  <input
                    style={inputStyle}
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />

                  <button style={buttonStyle} onClick={handleAuth}>
                    {authLoading
                      ? "Loading..."
                      : authMode === "signup"
                      ? "Create Account"
                      : "Login"}
                  </button>
                </div>
              </div>
            )}

            {session && (
              <div style={cardStyle}>
                <h2 style={{ margin: "0 0 16px", fontSize: 30 }}>
                  Profile Setup
                </h2>

                <div style={{ display: "grid", gap: 12 }}>
                  <div>
                    <p style={labelStyle}>Name</p>
                    <input
                      style={inputStyle}
                      placeholder="Your full name"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                    />
                  </div>

                  <div>
                    <p style={labelStyle}>Phone</p>
                    <input
                      style={inputStyle}
                      placeholder="Your phone number"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                    />
                  </div>

                  <button style={buttonStyle} onClick={saveProfile}>
                    {savingProfile ? "Saving..." : "Save Profile"}
                  </button>

                  <button style={secondaryButton} onClick={logout}>
                    Logout
                  </button>
                </div>
              </div>
            )}

            <div style={cardStyle}>
              <h2 style={{ margin: "0 0 16px", fontSize: 30 }}>Post Offer</h2>

              {session ? (
                <>
                  <div
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: 16,
                      padding: 14,
                      marginBottom: 14,
                    }}
                  >
                    <p style={{ margin: 0, color: "#475569", fontSize: 14 }}>
                      Posting as <strong>{profile?.name || "No profile name"}</strong>
                    </p>
                    <p style={{ margin: "6px 0 0", color: "#475569", fontSize: 14 }}>
                      Phone: <strong>{profile?.phone || "No profile phone"}</strong>
                    </p>
                  </div>

                  <div style={{ display: "grid", gap: 12 }}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 12,
                      }}
                    >
                      <div>
                        <p style={labelStyle}>From</p>
                        <select
                          style={inputStyle}
                          value={fromCurrency}
                          onChange={(e) => setFromCurrency(e.target.value)}
                        >
                          <option>TZS</option>
                          <option>GBP</option>
                        </select>
                      </div>

                      <div>
                        <p style={labelStyle}>To</p>
                        <select
                          style={inputStyle}
                          value={toCurrency}
                          onChange={(e) => setToCurrency(e.target.value)}
                        >
                          <option>GBP</option>
                          <option>TZS</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <p style={labelStyle}>Rate</p>
                      <input
                        style={inputStyle}
                        type="number"
                        placeholder="Rate"
                        value={rate}
                        onChange={(e) => setRate(Number(e.target.value))}
                      />
                    </div>

                    <div>
                      <p style={labelStyle}>Amount</p>
                      <input
                        style={inputStyle}
                        type="number"
                        placeholder="Amount"
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                      />
                    </div>

                    <div
                      style={{
                        background: "linear-gradient(135deg, #eef2ff, #f8fafc)",
                        border: "1px solid #c7d2fe",
                        borderRadius: 16,
                        padding: 16,
                        color: "#312e81",
                      }}
                    >
                      <p
                        style={{
                          margin: "0 0 8px",
                          fontSize: 12,
                          fontWeight: 700,
                          letterSpacing: 0.6,
                          textTransform: "uppercase",
                          color: "#4338ca",
                        }}
                      >
                        Live Preview
                      </p>

                      <p style={{ margin: 0, fontWeight: 800, fontSize: 20 }}>
                        {amount} {fromCurrency} → {previewTotal.toFixed(2)}{" "}
                        {toCurrency}
                      </p>
                    </div>

                    <button style={buttonStyle} onClick={postOffer}>
                      {posting ? "Posting..." : "Post Offer"}
                    </button>
                  </div>
                </>
              ) : (
                <p style={{ margin: 0, color: "#64748b" }}>
                  Login first to post an offer.
                </p>
              )}
            </div>
          </div>

          <div style={cardStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
                marginBottom: 18,
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: 32 }}>Marketplace</h2>
                <p style={{ margin: "6px 0 0", color: "#6b7280" }}>
                  {offersWithTotal.length} live offer
                  {offersWithTotal.length === 1 ? "" : "s"}
                </p>
              </div>

              <div
                style={{
                  background: "#f1f5f9",
                  border: "1px solid #e2e8f0",
                  borderRadius: 999,
                  padding: "8px 12px",
                  fontSize: 13,
                  color: "#334155",
                  fontWeight: 700,
                }}
              >
                Live listings
              </div>
            </div>

            {offersWithTotal.length === 0 ? (
              <div
                style={{
                  border: "1px dashed #d1d5db",
                  borderRadius: 16,
                  padding: 26,
                  color: "#6b7280",
                  background: "#f9fafb",
                  textAlign: "center",
                }}
              >
                No offers yet.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 14 }}>
                {offersWithTotal.map((offer) => (
                  <div
                    key={offer.id}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 18,
                      padding: 18,
                      background: "#f9fafb",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "start",
                        gap: 16,
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 220 }}>
                        <div
                          style={{
                            display: "flex",
                            gap: 10,
                            alignItems: "center",
                            flexWrap: "wrap",
                            marginBottom: 10,
                          }}
                        >
                          <p
                            style={{
                              margin: 0,
                              fontWeight: 800,
                              fontSize: 24,
                              color: "#111827",
                            }}
                          >
                            {offer.name}
                          </p>

                          <span
                            style={{
                              padding: "6px 10px",
                              borderRadius: 999,
                              background: "#dbeafe",
                              color: "#1d4ed8",
                              fontSize: 12,
                              fontWeight: 800,
                            }}
                          >
                            {offer.from_currency} → {offer.to_currency}
                          </span>
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 12,
                          }}
                        >
                          <div
                            style={{
                              background: "#ffffff",
                              borderRadius: 14,
                              padding: 12,
                              border: "1px solid #edf2f7",
                            }}
                          >
                            <p style={labelStyle}>Amount</p>
                            <p
                              style={{
                                margin: "8px 0 0",
                                fontWeight: 800,
                                color: "#0f172a",
                              }}
                            >
                              {offer.amount.toLocaleString()} {offer.from_currency}
                            </p>
                          </div>

                          <div
                            style={{
                              background: "#ffffff",
                              borderRadius: 14,
                              padding: 12,
                              border: "1px solid #edf2f7",
                            }}
                          >
                            <p style={labelStyle}>Total</p>
                            <p
                              style={{
                                margin: "8px 0 0",
                                fontWeight: 800,
                                color: "#0f172a",
                              }}
                            >
                              {offer.total.toFixed(2)} {offer.to_currency}
                            </p>
                          </div>

                          <div
                            style={{
                              background: "#ffffff",
                              borderRadius: 14,
                              padding: 12,
                              border: "1px solid #edf2f7",
                            }}
                          >
                            <p style={labelStyle}>Rate</p>
                            <p
                              style={{
                                margin: "8px 0 0",
                                fontWeight: 800,
                                color: "#0f172a",
                              }}
                            >
                              {offer.rate}
                            </p>
                          </div>

                          <div
                            style={{
                              background: "#ffffff",
                              borderRadius: 14,
                              padding: 12,
                              border: "1px solid #edf2f7",
                            }}
                          >
                            <p style={labelStyle}>Phone</p>
                            <p
                              style={{
                                margin: "8px 0 0",
                                fontWeight: 800,
                                color: "#0f172a",
                              }}
                            >
                              {offer.phone}
                            </p>
                          </div>
                        </div>
                      </div>

                      <a
                        href={`https://wa.me/${String(offer.phone).replace(
                          /\D/g,
                          ""
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "inline-block",
                          padding: "12px 16px",
                          background: "#22c55e",
                          color: "#fff",
                          borderRadius: 14,
                          textDecoration: "none",
                          fontWeight: 800,
                          whiteSpace: "nowrap",
                          boxShadow: "0 10px 20px rgba(34,197,94,0.18)",
                        }}
                      >
                        Contact Seller
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}