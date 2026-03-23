"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Offer = {
  id: string;
  user_id: string;
  email?: string;
  name: string;
  phone: string;
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

type Notice = {
  type: "success" | "error";
  text: string;
} | null;

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
  const [rate, setRate] = useState("3600");
  const [amount, setAmount] = useState("");

  const [offers, setOffers] = useState<Offer[]>([]);
  const [posting, setPosting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filterFrom, setFilterFrom] = useState("ALL");
  const [filterTo, setFilterTo] = useState("ALL");

  const [notice, setNotice] = useState<Notice>(null);

  const showNotice = (type: "success" | "error", text: string) => {
    setNotice({ type, text });
    window.clearTimeout((window as any).__noticeTimer);
    (window as any).__noticeTimer = window.setTimeout(() => {
      setNotice(null);
    }, 3000);
  };

  const normalizePhone = (value: string) => {
    return value.replace(/\s+/g, "");
  };

  const isValidInternationalPhone = (value: string) => {
    const phone = normalizePhone(value);
    return /^\+[1-9]\d{7,14}$/.test(phone);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
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

    if (error || !data) {
      setProfile(null);
      setProfileName("");
      setProfilePhone("");
      return;
    }

    setProfile(data as Profile);
    setProfileName(data.name || "");
    setProfilePhone(data.phone || "");
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
      showNotice("error", "Enter email and password");
      return;
    }

    setAuthLoading(true);

    if (authMode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      setAuthLoading(false);

      if (error) {
        showNotice("error", error.message);
        return;
      }

      showNotice("success", "Account created. Now log in.");
      setAuthMode("login");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setAuthLoading(false);

    if (error) {
      showNotice("error", "Invalid login credentials");
      return;
    }

    showNotice("success", "Login successful");
  }

  async function logout() {
    await supabase.auth.signOut();
    showNotice("success", "Logged out");
  }

  async function saveProfile() {
    if (!session?.user?.id) {
      showNotice("error", "Login first");
      return;
    }

    if (!profileName || !profilePhone) {
      showNotice("error", "Enter your name and phone");
      return;
    }

    const cleanedPhone = normalizePhone(profilePhone);

    if (!isValidInternationalPhone(cleanedPhone)) {
      showNotice("error", "Phone must include country code, e.g. +255... or +44...");
      return;
    }

    setSavingProfile(true);

    const payload = {
      id: session.user.id,
      email: session.user.email,
      name: profileName.trim(),
      phone: cleanedPhone,
    };

    const { error } = await supabase.from("profiles").upsert(payload);

    setSavingProfile(false);

    if (error) {
      console.error(error);
      showNotice("error", "Failed to save profile");
      return;
    }

    await fetchProfile(session.user.id);
    showNotice("success", "Profile saved successfully");
  }

  async function fetchOffers() {
    const { data, error } = await supabase
      .from("offers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setOffers((data || []) as Offer[]);
  }

  useEffect(() => {
    fetchOffers();
  }, []);

  const numRate = Number(rate || 0);
  const numAmount = Number(amount || 0);

  function calculateConvertedAmount(
    rawAmount: number,
    rawRate: number,
    from: string,
    to: string
  ) {
    if (!rawAmount || !rawRate) return 0;

    if (from === "TZS" && to === "GBP") return rawAmount / rawRate;
    if (from === "GBP" && to === "TZS") return rawAmount * rawRate;

    if (from === "TZS" && to === "USD") return rawAmount / rawRate;
    if (from === "USD" && to === "TZS") return rawAmount * rawRate;

    if (from === "TZS" && to === "EUR") return rawAmount / rawRate;
    if (from === "EUR" && to === "TZS") return rawAmount * rawRate;

    return rawAmount * rawRate;
  }

  const previewTotal = calculateConvertedAmount(
    numAmount,
    numRate,
    fromCurrency,
    toCurrency
  );

  async function postOffer() {
    if (!session?.user?.id) {
      showNotice("error", "Login first");
      return;
    }

    if (!profile?.name || !profile?.phone) {
      showNotice("error", "Save profile first");
      return;
    }

    if (!isValidInternationalPhone(profile.phone)) {
      showNotice("error", "Update your profile phone with country code first");
      return;
    }

    if (!numAmount || !numRate) {
      showNotice("error", "Enter amount and rate");
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
        rate: numRate,
        amount: numAmount,
      },
    ]);

    setPosting(false);

    if (error) {
      console.error(error);
      showNotice("error", "Failed to post offer");
      return;
    }

    setAmount("");
    setRate("3600");
    await fetchOffers();
    showNotice("success", "Offer posted successfully");
  }

  async function deleteOffer(offerId: string) {
    const confirmed = window.confirm("Delete this offer?");
    if (!confirmed) return;

    setDeletingId(offerId);

    const { error } = await supabase.from("offers").delete().eq("id", offerId);

    setDeletingId(null);

    if (error) {
      console.error(error);
      showNotice("error", "Failed to delete offer");
      return;
    }

    await fetchOffers();
    showNotice("success", "Offer deleted");
  }

  const filteredOffers = useMemo(() => {
    return offers.filter((offer) => {
      const q = search.trim().toLowerCase();

      const matchesSearch =
        q === "" ||
        offer.name.toLowerCase().includes(q) ||
        offer.phone.toLowerCase().includes(q) ||
        offer.from_currency.toLowerCase().includes(q) ||
        offer.to_currency.toLowerCase().includes(q);

      const matchesFrom =
        filterFrom === "ALL" || offer.from_currency === filterFrom;
      const matchesTo = filterTo === "ALL" || offer.to_currency === filterTo;

      return matchesSearch && matchesFrom && matchesTo;
    });
  }, [offers, search, filterFrom, filterTo]);

  const myOffers = useMemo(() => {
    if (!session?.user?.id) return [];
    return offers.filter((offer) => offer.user_id === session.user.id);
  }, [offers, session]);

  const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #eef4ff 0%, #f8fbff 45%, #ffffff 100%)",
    padding: "24px 16px 60px",
    fontFamily: "Arial, sans-serif",
    color: "#0f172a",
  };

  const containerStyle: React.CSSProperties = {
    maxWidth: 1180,
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

  const primaryButton: React.CSSProperties = {
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

  const darkButton: React.CSSProperties = {
    width: "100%",
    padding: "13px 18px",
    border: "none",
    borderRadius: 14,
    background: "#0f172a",
    color: "#ffffff",
    fontWeight: 700,
    cursor: "pointer",
  };

  const noticeStyle: React.CSSProperties = {
    position: "fixed",
    top: 18,
    right: 18,
    zIndex: 9999,
    padding: "12px 16px",
    borderRadius: 14,
    color: "#fff",
    fontWeight: 700,
    boxShadow: "0 10px 24px rgba(15,23,42,0.18)",
    background: notice?.type === "success" ? "#16a34a" : "#dc2626",
  };

  return (
    <main style={pageStyle}>
      {notice && <div style={noticeStyle}>{notice.text}</div>}

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
                    style={authMode === "signup" ? primaryButton : darkButton}
                    onClick={() => setAuthMode("signup")}
                  >
                    Sign Up
                  </button>
                  <button
                    style={authMode === "login" ? primaryButton : darkButton}
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

                  <button style={primaryButton} onClick={handleAuth}>
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
                      placeholder="Phone with country code, e.g. +255712345678"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                    />
                    <p style={{ margin: "8px 0 0", fontSize: 13, color: "#64748b" }}>
                      Use international format: +255... or +44...
                    </p>
                  </div>

                  <button style={primaryButton} onClick={saveProfile}>
                    {savingProfile ? "Saving..." : "Save Profile"}
                  </button>

                  <button style={darkButton} onClick={logout}>
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
                          <option>USD</option>
                          <option>EUR</option>
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
                          <option>USD</option>
                          <option>EUR</option>
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
                        onChange={(e) => setRate(e.target.value)}
                      />
                    </div>

                    <div>
                      <p style={labelStyle}>Amount</p>
                      <input
                        style={inputStyle}
                        type="number"
                        placeholder="Amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
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
                        {numAmount} {fromCurrency} → {previewTotal.toFixed(2)}{" "}
                        {toCurrency}
                      </p>
                    </div>

                    <button style={primaryButton} onClick={postOffer}>
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

            {session && (
              <div style={cardStyle}>
                <h2 style={{ margin: "0 0 16px", fontSize: 28 }}>My Offers</h2>

                {myOffers.length === 0 ? (
                  <div
                    style={{
                      border: "1px dashed #d1d5db",
                      borderRadius: 16,
                      padding: 20,
                      color: "#6b7280",
                      background: "#f9fafb",
                    }}
                  >
                    You have not posted any offers yet.
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 12 }}>
                    {myOffers.map((offer) => {
                      const total = calculateConvertedAmount(
                        offer.amount,
                        offer.rate,
                        offer.from_currency,
                        offer.to_currency
                      );

                      return (
                        <div
                          key={offer.id}
                          style={{
                            border: "1px solid #e5e7eb",
                            borderRadius: 16,
                            padding: 16,
                            background: "#f9fafb",
                          }}
                        >
                          <p
                            style={{
                              margin: "0 0 8px",
                              fontWeight: 800,
                              fontSize: 20,
                              color: "#111827",
                            }}
                          >
                            {offer.name}
                          </p>

                          <p style={{ margin: "6px 0", color: "#374151" }}>
                            {offer.amount.toLocaleString()} {offer.from_currency} →{" "}
                            {total.toFixed(2)} {offer.to_currency}
                          </p>

                          <p style={{ margin: "6px 0", color: "#374151" }}>
                            Rate: {offer.rate}
                          </p>

                          <button
                            style={{
                              ...darkButton,
                              background: "#dc2626",
                              marginTop: 8,
                            }}
                            onClick={() => deleteOffer(offer.id)}
                          >
                            {deletingId === offer.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
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
                  {filteredOffers.length} live offer
                  {filteredOffers.length === 1 ? "" : "s"}
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

            <div style={{ display: "grid", gap: 12, marginBottom: 18 }}>
              <input
                style={inputStyle}
                placeholder="Search by name, phone, or currency"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <select
                  style={inputStyle}
                  value={filterFrom}
                  onChange={(e) => setFilterFrom(e.target.value)}
                >
                  <option value="ALL">All From</option>
                  <option value="TZS">TZS</option>
                  <option value="GBP">GBP</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>

                <select
                  style={inputStyle}
                  value={filterTo}
                  onChange={(e) => setFilterTo(e.target.value)}
                >
                  <option value="ALL">All To</option>
                  <option value="GBP">GBP</option>
                  <option value="TZS">TZS</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>

            {filteredOffers.length === 0 ? (
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
                No offers found.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 14 }}>
                {filteredOffers.map((offer) => {
                  const message = encodeURIComponent(
                    `Hi ${offer.name}, I'm interested in your ${offer.from_currency} to ${offer.to_currency} offer on P2P FX Marketplace.`
                  );

                  const total = calculateConvertedAmount(
                    offer.amount,
                    offer.rate,
                    offer.from_currency,
                    offer.to_currency
                  );

                  return (
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
                                {total.toFixed(2)} {offer.to_currency}
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
                          )}?text=${message}`}
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
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}