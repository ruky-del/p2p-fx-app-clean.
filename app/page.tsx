"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
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

  const showSuccess = (message: string) => {
    toast.success(message, {
      duration: 3000,
      style: {
        background: "#16a34a",
        color: "#fff",
        padding: "12px 16px",
        borderRadius: "12px",
        fontWeight: "700",
      },
    });
  };

  const showError = (message: string) => {
    toast.error(message, {
      duration: 3500,
      style: {
        background: "#dc2626",
        color: "#fff",
        padding: "12px 16px",
        borderRadius: "12px",
        fontWeight: "700",
      },
    });
  };

  const handleAuth = async () => {
    if (!email || !password) {
      showError("Enter email and password");
      return;
    }

    setAuthLoading(true);

    if (authMode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        showError(error.message);
      } else {
        showSuccess("Account created. You can now log in 🎉");
        setAuthMode("login");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        showError("Invalid login credentials");
      } else {
        showSuccess("Login successful ✅");
      }
    }

    setAuthLoading(false);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    showSuccess("Logged out");
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
      showError("Login first");
      return;
    }

    if (!name || !phone || !rate || !amount) {
      showError("Please fill all fields");
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
      showError("Failed to save offer");
      setPosting(false);
      return;
    }

    showSuccess("Offer posted successfully 🎉");
    setName("");
    setPhone("");
    setRate("");
    setAmount("");
    fetchOffers();
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
      showError("Failed to delete offer");
    } else {
      showSuccess("Offer deleted");
      fetchOffers();
    }

    setDeletingId(null);
  };

  const filteredOffers = useMemo(() => {
    return offers.filter((offer) => {
      const q = search.toLowerCase().trim();

      const matchesSearch =
        q === "" ||
        offer.name?.toLowerCase().includes(q) ||
        offer.phone?.toLowerCase().includes(q) ||
        offer.from_currency?.toLowerCase().includes(q) ||
        offer.to_currency?.toLowerCase().includes(q);

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

  const formatNumber = (value: number) => {
    return Number(value || 0).toLocaleString();
  };

  const getCurrencySymbol = (currency: string) => {
    if (currency === "USD") return "$";
    if (currency === "GBP") return "£";
    if (currency === "EUR") return "€";
    if (currency === "TZS") return "TZS ";
    return "";
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 14,
    border: "1px solid #dbe2ea",
    fontSize: 15,
    boxSizing: "border-box",
    background: "#ffffff",
    outline: "none",
    color: "#0f172a",
  };

  const cardStyle: React.CSSProperties = {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 20,
    padding: 22,
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
  };

  const primaryButton: React.CSSProperties = {
    padding: "12px 18px",
    border: "none",
    borderRadius: 14,
    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    color: "#ffffff",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 10px 20px rgba(37, 99, 235, 0.18)",
  };

  const secondaryButton: React.CSSProperties = {
    padding: "12px 18px",
    border: "none",
    borderRadius: 14,
    background: "#eef2f7",
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

  const smallLabel: React.CSSProperties = {
    margin: 0,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    color: "#64748b",
    fontWeight: 700,
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, #dbeafe 0%, #eff6ff 30%, #f8fbff 55%, #f3f6fb 100%)",
        padding: "28px 14px 60px",
        fontFamily:
          "Inter, Arial, Helvetica, ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div
          style={{
            background: "linear-gradient(135deg, #1d4ed8 0%, #0f172a 100%)",
            color: "#ffffff",
            borderRadius: 28,
            padding: 28,
            boxShadow: "0 20px 50px rgba(29, 78, 216, 0.22)",
            marginBottom: 22,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 20,
              flexWrap: "wrap",
            }}
          >
            <div style={{ maxWidth: 720 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  opacity: 0.85,
                  fontWeight: 700,
                }}
              >
                Live Marketplace
              </p>

              <h1
                style={{
                  margin: "10px 0 12px",
                  fontSize: 46,
                  lineHeight: 1.02,
                }}
              >
                P2P FX Marketplace
              </h1>

              <p
                style={{
                  margin: 0,
                  color: "rgba(255,255,255,0.86)",
                  fontSize: 17,
                  maxWidth: 680,
                }}
              >
                Buy and sell foreign currency with account login, clean search,
                professional offer cards, and instant seller contact.
              </p>
            </div>

            <div
              style={{
                minWidth: 240,
                background: "rgba(255,255,255,0.10)",
                border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: 22,
                padding: 18,
                backdropFilter: "blur(6px)",
              }}
            >
              <p style={{ margin: "0 0 8px", opacity: 0.8 }}>Status</p>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 20 }}>
                {session ? "Logged In ✅" : "Guest Mode"}
              </p>
              <p style={{ margin: "8px 0 0", opacity: 0.82, fontSize: 14 }}>
                {session ? session.user.email : "Sign in to post offers"}
              </p>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "380px 1fr",
            gap: 20,
            alignItems: "start",
          }}
        >
          <div style={{ display: "grid", gap: 20 }}>
            {!session && (
              <div style={cardStyle}>
                <h2 style={{ margin: "0 0 14px", fontSize: 30 }}>
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
                    style={{
                      ...primaryButton,
                      opacity: authLoading ? 0.7 : 1,
                    }}
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
                  background: "linear-gradient(180deg, #eff6ff 0%, #ffffff 100%)",
                  border: "1px solid #bfdbfe",
                }}
              >
                <h2 style={{ margin: "0 0 12px", fontSize: 30 }}>
                  Your Session
                </h2>

                <div
                  style={{
                    padding: 14,
                    background: "#ffffff",
                    border: "1px solid #dbeafe",
                    borderRadius: 16,
                    marginBottom: 14,
                  }}
                >
                  <p style={smallLabel}>Logged in as</p>
                  <p
                    style={{
                      margin: "8px 0 0",
                      color: "#1e3a8a",
                      fontWeight: 700,
                      wordBreak: "break-word",
                    }}
                  >
                    {session.user.email}
                  </p>
                </div>

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
                <h2 style={{ margin: "0 0 14px", fontSize: 30 }}>Post Offer</h2>

                <div style={{ display: "grid", gap: 12 }}>
                  <div>
                    <p style={{ ...smallLabel, marginBottom: 8 }}>Seller name</p>
                    <input
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <p style={{ ...smallLabel, marginBottom: 8 }}>Phone number</p>
                    <input
                      placeholder="Phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      style={inputStyle}
                    />
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                    }}
                  >
                    <div>
                      <p style={{ ...smallLabel, marginBottom: 8 }}>From</p>
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
                    </div>

                    <div>
                      <p style={{ ...smallLabel, marginBottom: 8 }}>To</p>
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
                  </div>

                  <div>
                    <p style={{ ...smallLabel, marginBottom: 8 }}>Rate</p>
                    <input
                      placeholder="Rate"
                      value={rate}
                      onChange={(e) => setRate(e.target.value)}
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <p style={{ ...smallLabel, marginBottom: 8 }}>Amount</p>
                    <input
                      placeholder="Amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      style={inputStyle}
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
                    <p style={{ ...smallLabel, marginBottom: 8, color: "#4338ca" }}>
                      Live preview
                    </p>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: 18 }}>
                      {getCurrencySymbol(fromCurrency)}
                      {formatNumber(Number(amount || 0))} {fromCurrency} →{" "}
                      {getCurrencySymbol(toCurrency)}
                      {formatNumber(totalPreview)} {toCurrency}
                    </p>
                  </div>

                  <button
                    onClick={handlePost}
                    disabled={posting}
                    style={{
                      ...primaryButton,
                      width: "100%",
                      opacity: posting ? 0.7 : 1,
                    }}
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
                    <h2 style={{ margin: 0, fontSize: 30 }}>My Offers</h2>
                    <p style={{ margin: "6px 0 0", color: "#6b7280" }}>
                      {myOffers.length} offer{myOffers.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>

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
                    {myOffers.map((offer) => (
                      <div
                        key={offer.id}
                        style={{
                          border: "1px solid #e5e7eb",
                          borderRadius: 16,
                          padding: 16,
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
                                fontWeight: 800,
                                fontSize: 20,
                                color: "#111827",
                              }}
                            >
                              {offer.name}
                            </p>

                            <p style={{ margin: "6px 0", color: "#374151" }}>
                              {offer.from_currency} → {offer.to_currency}
                            </p>

                            <p style={{ margin: "6px 0", color: "#374151" }}>
                              Amount: {formatNumber(offer.amount)}{" "}
                              {offer.from_currency}
                            </p>

                            <p style={{ margin: "6px 0", color: "#374151" }}>
                              Total:{" "}
                              {formatNumber(offer.amount * offer.rate)}{" "}
                              {offer.to_currency}
                            </p>

                            <p style={{ margin: "6px 0", color: "#374151" }}>
                              Rate: {formatNumber(offer.rate)}
                            </p>
                          </div>

                          <button
                            onClick={() => handleDelete(offer.id)}
                            disabled={deletingId === offer.id}
                            style={dangerButton}
                          >
                            {deletingId === offer.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={cardStyle}>
              <h2 style={{ margin: "0 0 14px", fontSize: 30 }}>
                Search & Filter
              </h2>

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
                marginBottom: 18,
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: 32 }}>Marketplace</h2>
                <p style={{ margin: "6px 0 0", color: "#6b7280" }}>
                  {filteredOffers.length} matching offer
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
                Live search enabled
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
                No matching offers.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 14 }}>
                {filteredOffers.map((offer) => {
                  const whatsappMessage = encodeURIComponent(
                    `Hi ${offer.name}, I saw your ${offer.from_currency} to ${offer.to_currency} offer on P2P FX Marketplace. I'm interested in your rate ${offer.rate}.`
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
                          gap: 16,
                          alignItems: "start",
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
                                textTransform: "capitalize",
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
                              <p style={smallLabel}>Amount</p>
                              <p
                                style={{
                                  margin: "8px 0 0",
                                  fontWeight: 800,
                                  color: "#0f172a",
                                }}
                              >
                                {getCurrencySymbol(offer.from_currency)}
                                {formatNumber(offer.amount)} {offer.from_currency}
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
                              <p style={smallLabel}>Total</p>
                              <p
                                style={{
                                  margin: "8px 0 0",
                                  fontWeight: 800,
                                  color: "#0f172a",
                                }}
                              >
                                {getCurrencySymbol(offer.to_currency)}
                                {formatNumber(offer.amount * offer.rate)}{" "}
                                {offer.to_currency}
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
                              <p style={smallLabel}>Rate</p>
                              <p
                                style={{
                                  margin: "8px 0 0",
                                  fontWeight: 800,
                                  color: "#0f172a",
                                }}
                              >
                                {formatNumber(offer.rate)}
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
                              <p style={smallLabel}>Phone</p>
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

                        {offer.phone && (
                          <a
                            href={`https://wa.me/${String(offer.phone).replace(
                              /\D/g,
                              ""
                            )}?text=${whatsappMessage}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: "inline-block",
                              padding: "12px 16px",
                              background: "#25D366",
                              color: "#fff",
                              borderRadius: 14,
                              textDecoration: "none",
                              fontWeight: 800,
                              whiteSpace: "nowrap",
                              boxShadow: "0 10px 20px rgba(37,211,102,0.18)",
                            }}
                          >
                            Contact Seller
                          </a>
                        )}
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