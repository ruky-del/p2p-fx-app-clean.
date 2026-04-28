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

const withTimeout = async <T,>(promise: Promise<T>, ms = 8000): Promise<T> => {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), ms)
    ),
  ]);
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

  useEffect(() => {
    const loadPage = async () => {
      try {
        setLoadingPage(true);

        const {
          data: { session },
          error: sessionError,
        } = await withTimeout(supabase.auth.getSession(), 8000);

        if (sessionError) throw sessionError;

        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (!currentUser) {
          applyProfile(null);
          setRequests([]);
          return;
        }

const profileResult: any = await withTimeout(
  supabase
    .from("profiles")
    .select("*")
    .eq("id", currentUser.id)
    .maybeSingle(),
  8000
);

const profileData = profileResult?.data;

        applyProfile((profileData as UserProfile | null) || null);

        const requestResult: any = await withTimeout(
  supabase
    .from("exchange_requests")
    .select("id, send_currency, receive_currency, send_amount, receive_amount, status, created_at")
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false })
    .limit(10),
  8000
);

const requestData = requestResult?.data;
        setRequests((requestData as ExchangeRequest[]) || []);
      } catch (error) {
        console.error("profile load error:", error);
        setMessage("Could not load profile. Please refresh.");
        setMessageType("warn");
      } finally {
        setLoadingPage(false);
      }
    };

    loadPage();
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

      const { error } = await withTimeout(
        supabase.from("profiles").upsert(payload, { onConflict: "id" }),
        8000
      );

      if (error) {
        setMessage(error.message || "Could not save profile.");
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
      setMessage(error?.message || "Could not save profile.");
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

  if (loadingPage) {
    return (
      <main className="page">
        <div className="container">
          <div className="card">
            <h1 className="card-title">Loading...</h1>
            <p className="card-subtitle">Please wait while we load your profile.</p>
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
              You need to log in before viewing your profile.
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
              {messageType === "success" ? "Success" : messageType === "warn" ? "Notice" : "Update"}
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
                    {request.send_amount} {request.send_currency} →{" "}
                    {Number(request.receive_amount).toLocaleString()} {request.receive_currency}
                  </h3>
                  <p>Status: {request.status}</p>
                  <p>{new Date(request.created_at).toLocaleString()}</p>
                  <Link href={`/trades/${request.id}`} className="btn btn-outline">
                    Open Trade
                  </Link>
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