"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [session, setSession] = useState<any>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState("login");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [rate, setRate] = useState("");
  const [amount, setAmount] = useState("");

  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 🔥 AUTH
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });
  }, []);

  // 🔥 TOASTS
  const success = (msg: string) =>
    toast.success(msg, {
      style: { background: "#16a34a", color: "#fff" },
    });

  const error = (msg: string) =>
    toast.error(msg, {
      style: { background: "#dc2626", color: "#fff" },
    });

  // 🔥 LOGIN / SIGNUP
  const handleAuth = async () => {
    if (!email || !password) return error("Enter email & password");

    if (authMode === "signup") {
      const { error: err } = await supabase.auth.signUp({ email, password });
      if (err) return error(err.message);
      success("Account created 🎉");
      setAuthMode("login");
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (err) return error("Invalid login");
      success("Logged in ✅");
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    success("Logged out");
  };

  // 🔥 FETCH OFFERS
  const fetchOffers = async () => {
    const { data } = await supabase.from("offers").select("*");
    setOffers(data || []);
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  // 🔥 POST OFFER (NO ALERT)
  const handlePost = async () => {
    if (!session) return error("Login first");
    if (!name || !phone || !rate || !amount)
      return error("Fill all fields");

    setLoading(true);

    const { error: err } = await supabase.from("offers").insert([
      {
        name,
        phone,
        rate: Number(rate),
        amount: Number(amount),
        email: session.user.email,
      },
    ]);

    if (err) {
      error("Failed to post");
      setLoading(false);
      return;
    }

    success("Offer posted successfully 🎉");

    setName("");
    setPhone("");
    setRate("");
    setAmount("");

    fetchOffers();
    setLoading(false);
  };

  return (
    <main style={{ padding: 20 }}>
      <h1>P2P FX Marketplace</h1>

      {!session && (
        <>
          <h3>{authMode === "signup" ? "Sign Up" : "Login"}</h3>

          <input
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
          />
          <br />

          <input
            type="password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />
          <br />

          <button onClick={handleAuth}>
            {authMode === "signup" ? "Sign Up" : "Login"}
          </button>

          <br />
          <button
            onClick={() =>
              setAuthMode(authMode === "signup" ? "login" : "signup")
            }
          >
            Switch
          </button>
        </>
      )}

      {session && (
        <>
          <p>Logged in: {session.user.email}</p>
          <button onClick={logout}>Logout</button>

          <h3>Post Offer</h3>

          <input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <br />

          <input
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <br />

          <input
            placeholder="Rate"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
          <br />

          <input
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <br />

          <button onClick={handlePost}>
            {loading ? "Posting..." : "Post Offer"}
          </button>
        </>
      )}

      <h3>Marketplace</h3>

      {offers.map((o, i) => (
        <div key={i} style={{ border: "1px solid #ccc", margin: 10 }}>
          <p>{o.name}</p>
          <p>{o.amount}</p>
          <p>{o.rate}</p>
          <p>{o.phone}</p>
        </div>
      ))}
    </main>
  );
}