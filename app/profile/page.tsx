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

  useEffect(() => {
    const loadPage = async () => {
      try {
        setLoadingPage(true);

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

        // PROFILE
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .maybeSingle();

        applyProfile((profileData as UserProfile | null) || null);

        // REQUESTS
        const { data: requestData } = await supabase
          .from("exchange_requests")
          .select(
            "id, send_currency, receive_currency, send_amount, receive_amount, status, created_at"
          )
          .eq("user_id", currentUser.id)
          .order("created_at", { ascending: false })
          .limit(10);

        setRequests((requestData as ExchangeRequest[]) || []);
      } catch (error) {
        console.error("profile load error:", error);
        setMessage("Could not load profile.");
        setMessageType("warn");
      } finally {
        setLoadingPage(false);
      }
    };

    loadPage();
  }, []);

  const saveProfile = async () => {
    if (!user) {
      setMessage("Please log in first.");
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

      const { error } = await supabase
        .from("profiles")
        .upsert(payload, { onConflict: "id" });

      if (error) {
        setMessage(error.message);
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
      setMessage(error?.message || "Error saving profile.");
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
  };

  if (loadingPage) {
    return (
      <main className="page">
        <div className="container">
          <div className="card">
            <h1>Loading...</h1>
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
            <h1>Please log in</h1>
            <Link href="/?login=1" className="btn btn-primary">
              Login
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="container">
        {message && <div className="card">{message}</div>}

        <div className="card">
          <h1>Profile</h1>

          <input
            className="input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full name"
          />

          <input
            className="input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone"
          />

          <p>Credits: {profile?.credits || 0}</p>

          <button className="btn btn-primary" onClick={saveProfile}>
            Save
          </button>

          <button className="btn btn-dark" onClick={logout}>
            Logout
          </button>
        </div>

        <div className="card">
          <h2>My Requests</h2>

          {requests.map((r) => (
            <div key={r.id}>
              {r.send_amount} {r.send_currency} →{" "}
              {Number(r.receive_amount).toLocaleString()} {r.receive_currency}
              <Link href={`/trades/${r.id}`}>Open</Link>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}