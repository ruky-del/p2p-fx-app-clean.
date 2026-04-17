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
  const [loadingPage, setLoadingPage] = useState(true);

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
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("loadProfile error:", error);
        return null;
      }

      return (data as UserProfile | null) || null;
    } catch (error) {
      console.error("loadProfile catch error:", error);
      return null;
    }
  };

  const loadRequests = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("exchange_requests")
        .select("id, send_currency, receive_currency, send_amount, receive_amount, status, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("loadRequests error:", error);
        setRequests([]);
        return;
      }

      setRequests((data as ExchangeRequest[]) || []);
    } catch (error) {
      console.error("loadRequests catch error:", error);
      setRequests([]);
    }
  };

  const syncCurrentUser = async () => {
    try {
      setLoadingPage(true);

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("getSession error:", error);
        setUser(null);
        applyProfile(null);
        setRequests([]);
        return;
      }

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
    } catch (error) {
      console.error("syncCurrentUser error:", error);
      setUser(null);
      applyProfile(null);
      setRequests([]);
    } finally {
      setLoadingPage(false);
    }
  };

  useEffect(() => {
    syncCurrentUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
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
      } catch (error) {
        console.error("auth state change error:", error);
      }
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
      setMessage("");

      const payload = {
        id: user.id,
        full_name: fullName.trim(),
        phone: phone.trim(),
        email: user.email,
      };

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout. Please try again.")), 10000)
      );

      const requestPromise = supabase
        .from("profiles")
        .upsert(payload, { onConflict: "id" });

      const result = (await Promise.race([requestPromise, timeoutPromise])) as {
        data?: any;
        error?: { message?: string } | null;
      };

      if (result?.error) {
        setMessage(result.error.message || "Could not save profile.");
        setMessageType("warn");
        return;
      }

      applyProfile({
        id: user.id,
        full_name: payload.full_name,
        phone: payload.phone,
        credits: profile?.credits || 0,
        email: user.email,
      });

      setMessage("Profile saved successfully.");
      setMessageType("success");
    } catch (error: any) {
      console.error("saveProfile error:", error);
      setMessage(error?.message || "Could not save profile.");
      setMessageType("warn");
    } finally {
      setSavingProfile(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      applyProfile(null);
      setRequests([]);
      setMessage("You have been logged out.");
      setMessageType("info");
    } catch (error) {
      console.error("logout error:", error);
      setMessage("Could not log out. Please try again.");
      setMessageType("warn");
    }
  };

  if (loadingPage) {
    return (
      <main className="page">
        <div className="container">
          <div className="card">
            <h1 className="card-title">Loading...</h1>
            <p className="card-subtitle">Please wait while we load your profile.</p>
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
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </label>

            <div className="helper-text">Credits Balance: {profile?.credits || 0}</div>

            <button
              className="btn btn-primary"
              onClick={saveProfile}
              disabled={savingProfile}
              type="button"
            >
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
                    {request.send_amount} {request.send_currency} → {request.receive_amount}{" "}
                    {request.receive_currency}
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