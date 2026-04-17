"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FiHome, FiTrendingUp, FiUser } from "react-icons/fi";
import { supabase } from "@/lib/supabase";

type UserProfile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  credits: number | null;
  email?: string | null;
};

type ExchangeRequest = {
  id: string;
  send_currency: string;
  receive_currency: string;
  send_amount: number;
  receive_amount: number;
  status: string;
  created_at: string;
};

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [requests, setRequests] = useState<ExchangeRequest[]>([]);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "warn" | "info">("info");

  const applyProfile = (data: UserProfile | null) => {
    setProfile(data);
    setFullName(data?.full_name || "");
    setPhone(data?.phone || "");
  };

  const loadProfile = async (userId: string) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    return (data as UserProfile | null) || null;
  };

  const loadRequests = async (userId: string) => {
    const { data } = await supabase
      .from("exchange_requests")
      .select("id, send_currency, receive_currency, send_amount, receive_amount, status, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    setRequests((data as ExchangeRequest[]) || []);
  };

  const syncCurrentUser = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const currentUser = session?.user ?? null;
    setUser(currentUser);

    if (!currentUser) {
      applyProfile(null);
      setRequests([]);
      return;
    }

    const profileData = await loadProfile(currentUser.id);
    applyProfile(profileData);
    await loadRequests(currentUser.id);
  };

  useEffect(() => {
    syncCurrentUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (!currentUser) {
        applyProfile(null);
        setRequests([]);
        return;
      }

      const profileData = await loadProfile(currentUser.id);
      applyProfile(profileData);
      await loadRequests(currentUser.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const saveProfile = async () => {
    if (!user) {
      setMessage("Please log in first before updating your profile.");
      setMessageType("warn");
      return;
    }

    try {
      setSavingProfile(true);

      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        full_name: fullName,
        phone,
        email: user.email,
      });

      if (error) {
        setMessage(error.message);
        setMessageType("warn");
        return;
      }

      applyProfile({
        id: user.id,
        full_name: fullName,
        phone,
        credits: profile?.credits || 0,
        email: user.email,
      });

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

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    applyProfile(null);
    setRequests([]);
    setMessage("You have been logged out.");
    setMessageType("info");
  };

  if (!user) {
    return (
      <main className="page">
        <div className="container">
          <div className="card">
            <h1 className="card-title">Please log in</h1>
            <p className="card-subtitle">
              You need to log in before viewing your profile and exchange requests.
            </p>

            <div className="stack top-space">
              <Link href="/?login=1" className="btn btn-primary" style={{ textAlign: "center" }}>
                Log in / Create account
              </Link>

              <Link href="/express" className="btn btn-outline" style={{ textAlign: "center" }}>
                Continue to Express Exchange
              </Link>
            </div>
          </div>

          <div className="nav">
            <Link href="/">
              <FiHome />
              <span>Home</span>
            </Link>

            <Link href="/market">
              <FiTrendingUp />
              <span>Market</span>
            </Link>

            <Link href="/profile" className="active">
              <FiUser />
              <span>Profile</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="container">
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
          <h1 className="card-title">Profile</h1>
          <p className="card-subtitle">Manage your identity, phone number and available credits.</p>

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
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </label>

            <div className="helper-text">Credits Balance: {profile?.credits || 0}</div>

            <button className="btn btn-primary" onClick={saveProfile} disabled={savingProfile} type="button">
              {savingProfile ? "Saving..." : "Save Profile"}
            </button>

            <button className="btn btn-dark" onClick={logout} type="button">
              Logout
            </button>
          </div>
        </div>

        <div className="card top-space">
          <h2 className="card-title">My exchange requests</h2>

          {requests.length === 0 ? (
            <p className="card-subtitle">No exchange requests yet.</p>
          ) : (
            <div className="stack top-space">
              {requests.map((request) => (
                <div key={request.id} className="info-card">
                  <h3>
                    {request.send_amount} {request.send_currency} → {request.receive_amount} {request.receive_currency}
                  </h3>
                  <p>Status: {request.status}</p>
                  <p>{new Date(request.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card top-space">
          <h2 className="card-title">Verification Status</h2>
          <p className="card-subtitle">
            Not verified yet. Complete verification later to build more buyer trust.
          </p>
        </div>
      </div>

      <div className="nav">
        <Link href="/">
          <FiHome />
          <span>Home</span>
        </Link>

        <Link href="/market">
          <FiTrendingUp />
          <span>Market</span>
        </Link>

        <Link href="/profile" className="active">
          <FiUser />
          <span>Profile</span>
        </Link>
      </div>
    </main>
  );
}