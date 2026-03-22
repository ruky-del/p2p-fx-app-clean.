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

export default function Home() {
  const [session, setSession] = useState<any>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authLoading, setAuthLoading] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("TZS");
  const [rate, setRate] = useState("");
  const [amount, setAmount] = useState("");

  const [offers, setOffers] = useState<Offer[]>([]);
  const [posting, setPosting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filterFrom, setFilterFrom] = useState("ALL");
  const [filterTo, setFilterTo] = useState("ALL");

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

  const handleAuth = async () => {
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
        alert("Account created. You can now log in.");
        setAuthMode("login");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        alert("Invalid login credentials");
      }
    }

    setAuthLoading(false);
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const fetchOffers = async () => {
    const { data, error } = await supabase
      .from("offers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch offers error:", error);
      return;
    }

    setOffers((data as Offer[]) || []);
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const totalPreview = Number(amount || 0) * Number(rate || 0);

  const handlePost = async () => {
    if (!session) {
      alert("Login first");
      return;
    }

    if (!name || !phone || !rate || !amount) {
      alert("Please fill all fields");
      return;
    }

    setPosting(true);

    const { error } = await supabase.from("offers").insert([
      {
        user_id: session.user.id,
        email: session.user.email,
        name,
        phone,
        from_currency: fromCurrency,
        to_currency: toCurrency,
        rate: Number(rate),
        amount: Number(amount),
      },
    ]);

    if (error) {
      console.error("Insert error:", error);
      alert("Failed to save offer");
    } else {
      alert("Offer saved successfully");
      setName("");
      setPhone("");
      setRate("");
      setAmount("");
      fetchOffers();
    }

    setPosting(false);
  };

  const handleDelete = async (offerId?: string) => {
    if (!offerId) return;

    const confirmed = window.confirm("Delete this offer?");
    if (!confirmed) return;

    setDeletingId(offerId);

    const { error } = await supabase.from("offers").delete().eq("id", offerId);

    if (error) {
      console.error("Delete error:", error);
      alert("Failed to delete offer");
    } else {
      fetchOffers();
    }

    setDeletingId(null);
  };

  const filteredOffers = useMemo(() => {
    return offers.filter((offer) => {
      const matchesSearch =
        search.trim() === "" ||
        offer.name?.toLowerCase().includes(search.toLowerCase()) ||
        offer.phone?.toLowerCase().includes(search.toLowerCase()) ||
        offer.from_currency?.toLowerCase().includes(search.toLowerCase()) ||
        offer.to_currency?.toLowerCase().includes(search.toLowerCase());

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

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: 14,
    borderRadius: 12,
    border: "1px solid #d1d5db",
    fontSize: 16,
    boxSizing: "border-box",
    background: "#ffffff",
    outline: "none",
  };

  const cardStyle: React.CSSProperties = {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 20,
    boxShadow: "0 6px 20px rgba(0,0,0,0.04)",
  };

  const primaryButton: React.CSSProperties = {
    padding: "12px 18px",
    border: "none",
    borderRadius: 12,
    background: "#2563eb",
    color: "#ffffff",
    fontWeight: 700,
    cursor: "pointer",
  };

  const secondaryButton: React.CSSProperties = {
    padding: "12px 18px",
    border: "none",
    borderRadius: 12,
    background: "#e5e7eb",
    color: "#111827",
    fontWeight: 700,
    cursor: "pointer",
  };

  const dangerButton: React.CSSProperties = {
    padding: "10px 14px",
    border: "none",
    borderRadius: 12,
    background: "#dc2626",
    color: "#ffffff",
    fontWeight: 700,
    cursor: "pointer",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #eef4ff 0%, #f8fbff 45%, #f3f6fb 100%)",
        padding: "32px 16px 60px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1050, margin: "0 auto" }}>
        <div
          style={{
            background: "linear-gradient(135deg, #1d4ed8 0%, #111827 100%)",
            color: "#ffffff",
            borderRadius: 24,
            padding: 28,
            boxShadow: "0 18px 40px rgba(37, 99, 235, 0.20)",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 20,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  opacity: 0.8,
                }}
              >
                Live Marketplace
              </p>
              <h1
                style={{
                  margin: "8px 0 10px",
                  fontSize: 38,
                  lineHeight: 1.1,
                }}
              >
                P2P FX Marketplace
              </h1>
              <p
                style={{
                  margin: 0,
                  maxWidth: 620,
                  color: "rgba(255,255,255,0.85)",
                  fontSize: 16,
                }}
              >
                Buy and sell foreign currency with account login, clean search,
                live offer posting, and instant seller contact.
              </p>
            </div>

            <div
              style={{
                minWidth: 220,
                background: "rgba(255,255,255,0.10)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 18,
                padding: 16,
              }}
            >
              <p style={{ margin: "0 0 8px", opacity: 0.8 }}>Status</p>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 18 }}>
                {session ? "Logged In ✅" : "Guest Mode"}
              </p>
              <p style={{ margin: "8px 0 0", opacity: 0.8, fontSize: 14 }}>
                {session ? session.user.email : "Sign in to post offers"}
              </p>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.05fr 1.35fr",
            gap: 20,
            alignItems: "start",
          }}
        >
          <div style={{ display: "grid", gap: 20 }}>
            {!session && (
              <div style={cardStyle}>
                <h2 style={{ marginTop: 0, marginBottom: 14 }}>
                  Authentication
                </h2>

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    marginBottom: 14,
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    onClick={() => setAuthMode("signup")}
                    style={
                      authMode === "signup"
                        ? primaryButton
                        : secondaryButton
                    }
                  >
                    Sign Up
                  </button>

                  <button
                    onClick={() => setAuthMode("login")}
                    style={
                      authMode === "login" ? primaryButton : secondaryButton
                    }
                  >
                    Login
                  </button>
                </div>

                <div style={{ display: "grid", gap: 12 }}>
                  <input
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={inputStyle}
                  />

                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={inputStyle}
                  />

                  <button
                    onClick={handleAuth}
                    disabled={authLoading}
                    style={primaryButton}
                  >
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
              <div
                style={{
                  ...cardStyle,
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                }}
              >
                <h2 style={{ marginTop: 0, marginBottom: 10 }}>Your Session</h2>
                <p style={{ margin: "0 0 14px", color: "#1e3a8a" }}>
                  Logged in as <strong>{session.user.email}</strong>
                </p>
                <button
                  onClick={logout}
                  style={{
                    ...secondaryButton,
                    background: "#111827",
                    color: "#ffffff",
                  }}
                >
                  Logout
                </button>
              </div>
            )}

            {session && (
              <div style={cardStyle}>
                <h2 style={{ marginTop: 0, marginBottom: 14 }}>Post Offer</h2>

                <div style={{ display: "grid", gap: 12 }}>
                  <input
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={inputStyle}
                  />

                  <input
                    placeholder="Phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={inputStyle}
                  />

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                    }}
                  >
                    <select
                      value={fromCurrency}
                      onChange={(e) => setFromCurrency(e.target.value)}
                      style={inputStyle}
                    >
                      <option>USD</option>
                      <option>GBP</option>
                      <option>EUR</option>
                      <option>TZS</option>
                    </select>

                    <select
                      value={toCurrency}
                      onChange={(e) => setToCurrency(e.target.value)}
                      style={inputStyle}
                    >
                      <option>TZS</option>
                      <option>USD</option>
                      <option>GBP</option>
                      <option>EUR</option>
                    </select>
                  </div>

                  <input
                    placeholder="Rate"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    style={inputStyle}
                  />

                  <input
                    placeholder="Amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    style={inputStyle}
                  />

                  <div
                    style={{
                      background: "#eef2ff",
                      border: "1px solid #c7d2fe",
                      borderRadius: 14,
                      padding: 14,
                      color: "#312e81",
                    }}
                  >
                    <strong>Preview:</strong> {amount || 0} {fromCurrency} →{" "}
                    {totalPreview.toLocaleString()} {toCurrency}
                  </div>

                  <button
                    onClick={handlePost}
                    disabled={posting}
                    style={primaryButton}
                  >
                    {posting ? "Posting..." : "Post Offer"}
                  </button>
                </div>
              </div>
            )}

            {session && (
              <div style={cardStyle}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "center",
                    flexWrap: "wrap",
                    marginBottom: 14,
                  }}
                >
                  <div>
                    <h2 style={{ margin: 0 }}>My Offers</h2>
                    <p style={{ margin: "6px 0 0", color: "#6b7280" }}>
                      {myOffers.length} offer{myOffers.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>

                {myOffers.length === 0 ? (
                  <div
                    style={{
                      border: "1px dashed #d1d5db",
                      borderRadius: 14,
                      padding: 18,
                      color: "#6b7280",
                      background: "#f9fafb",
                    }}
                  >
                    You have not posted any offers yet.
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 12 }}>
                    {myOffers.map((offer) => (
                      <div
                        key={offer.id}
                        style={{
                          border: "1px solid #e5e7eb",
                          borderRadius: 14,
                          padding: 16,
                          background: "#f9fafb",
                        }}
                      >
                        <p
                          style={{
                            margin: "0 0 8px",
                            fontWeight: 700,
                            fontSize: 20,
                            color: "#111827",
                          }}
                        >
                          {offer.name}
                        </p>

                        <p style={{ margin: "6px 0", color: "#374151" }}>
                          {offer.amount} {offer.from_currency} →{" "}
                          {(offer.amount * offer.rate).toLocaleString()}{" "}
                          {offer.to_currency}
                        </p>

                        <p style={{ margin: "6px 0", color: "#374151" }}>
                          Rate: {offer.rate}
                        </p>

                        <button
                          onClick={() => handleDelete(offer.id)}
                          disabled={deletingId === offer.id}
                          style={dangerButton}
                        >
                          {deletingId === offer.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={cardStyle}>
              <h2 style={{ marginTop: 0, marginBottom: 14 }}>Search & Filter</h2>

              <div style={{ display: "grid", gap: 12 }}>
                <input
                  placeholder="Search by name, phone, or currency"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={inputStyle}
                />

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                  }}
                >
                  <select
                    value={filterFrom}
                    onChange={(e) => setFilterFrom(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="ALL">All From</option>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                    <option value="EUR">EUR</option>
                    <option value="TZS">TZS</option>
                  </select>

                  <select
                    value={filterTo}
                    onChange={(e) => setFilterTo(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="ALL">All To</option>
                    <option value="TZS">TZS</option>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "center",
                flexWrap: "wrap",
                marginBottom: 16,
              }}
            >
              <div>
                <h2 style={{ margin: 0 }}>Marketplace</h2>
                <p style={{ margin: "6px 0 0", color: "#6b7280" }}>
                  {filteredOffers.length} matching offer
                  {filteredOffers.length === 1 ? "" : "s"}
                </p>
              </div>

              <div
                style={{
                  background: "#f3f4f6",
                  borderRadius: 999,
                  padding: "8px 12px",
                  fontSize: 14,
                  color: "#374151",
                }}
              >
                Live search enabled
              </div>
            </div>

            {filteredOffers.length === 0 ? (
              <div
                style={{
                  border: "1px dashed #d1d5db",
                  borderRadius: 14,
                  padding: 22,
                  color: "#6b7280",
                  background: "#f9fafb",
                  textAlign: "center",
                }}
              >
                No matching offers.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 14 }}>
                {filteredOffers.map((offer) => (
                  <div
                    key={offer.id}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 16,
                      padding: 18,
                      background: "#f9fafb",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        alignItems: "start",
                        flexWrap: "wrap",
                      }}
                    >
                      <div>
                        <p
                          style={{
                            margin: "0 0 8px",
                            fontWeight: 700,
                            fontSize: 22,
                            color: "#111827",
                          }}
                        >
                          {offer.name}
                        </p>

                        <p style={{ margin: "6px 0", color: "#374151" }}>
                          <strong>Pair:</strong> {offer.from_currency} →{" "}
                          {offer.to_currency}
                        </p>

                        <p style={{ margin: "6px 0", color: "#374151" }}>
                          <strong>Amount:</strong> {offer.amount}{" "}
                          {offer.from_currency}
                        </p>

                        <p style={{ margin: "6px 0", color: "#374151" }}>
                          <strong>Total:</strong>{" "}
                          {(offer.amount * offer.rate).toLocaleString()}{" "}
                          {offer.to_currency}
                        </p>

                        <p style={{ margin: "6px 0", color: "#374151" }}>
                          <strong>Rate:</strong> {offer.rate}
                        </p>

                        <p style={{ margin: "6px 0", color: "#374151" }}>
                          <strong>Phone:</strong> {offer.phone}
                        </p>
                      </div>

                      {offer.phone && (
                        <a
                          href={`https://wa.me/${String(offer.phone).replace(
                            /\D/g,
                            ""
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: "inline-block",
                            padding: "10px 14px",
                            background: "#25D366",
                            color: "#fff",
                            borderRadius: 12,
                            textDecoration: "none",
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                          }}
                        >
                          Contact Seller
                        </a>
                      )}
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