"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { FiHome, FiTrendingUp, FiUser } from "react-icons/fi";
import { supabase } from "@/lib/supabase";

type UserProfile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  credits: number | null;
  email?: string | null;
};

function ExchangeContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const nextUrl = `${pathname}?${searchParams.toString()}`;

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "warn" | "info">("info");

  const sendCurrency = searchParams.get("sendCurrency") || "GBP";
  const receiveCurrency = searchParams.get("receiveCurrency") || "TZS";
  const sendAmount = Number(searchParams.get("sendAmount") || "0");
  const receiveAmount = Number(searchParams.get("receiveAmount") || "0");
  const rateUsed = Number(searchParams.get("rateUsed") || "0");
  const tradeLabel = searchParams.get("tradeLabel") || "Exchange";

  useEffect(() => {
  const syncCurrentUser = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (!currentUser) return;

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .maybeSingle();

      const profileData = data || null;
      setProfile(profileData);
      setFullName(profileData?.full_name || "");
      setPhone(profileData?.phone || "");
    } catch (error) {
      console.error("exchange page error:", error);
    } finally {
      setLoadingUser(false);
    }
  };

  syncCurrentUser();
}, []);
  const formattedReceive = useMemo(() => {
    if (!receiveAmount) return `0 ${receiveCurrency}`;

    if (receiveCurrency === "TZS") {
      return `${receiveAmount.toLocaleString()} TZS`;
    }

    return `${receiveAmount.toFixed(6)} GBP`;
  }, [receiveAmount, receiveCurrency]);

  const formattedRate = useMemo(() => {
    if (!rateUsed) return "--";

    if (sendCurrency === "GBP") {
      return `1 GBP = ${rateUsed.toLocaleString()} TZS`;
    }

    return `1 TZS = ${rateUsed.toFixed(6)} GBP`;
  }, [rateUsed, sendCurrency]);

  const saveAndSubmit = async () => {
    if (!user) {
      setMessage("Please log in first before submitting an exchange request.");
      setMessageType("warn");
      return;
    }

    if (!fullName.trim() || !phone.trim()) {
      setMessage("Please enter your full name and phone number.");
      setMessageType("warn");
      return;
    }

    if (!sendAmount || !receiveAmount || !rateUsed) {
      setMessage("Exchange details are incomplete.");
      setMessageType("warn");
      return;
    }

    try {
      setSubmitting(true);
      setMessage("");

      const { error: profileError } = await supabase.from("profiles").upsert({
        id: user.id,
        full_name: fullName.trim(),
        phone: phone.trim(),
        email: user.email,
      });

      if (profileError) {
        setMessage(profileError.message || "Could not save profile.");
        setMessageType("warn");
        return;
      }

      const { data, error } = await supabase
  .from("exchange_requests")
  .insert({
    user_id: user.id,
    full_name: fullName.trim(),
    phone: phone.trim(),
    send_currency: sendCurrency,
    receive_currency: receiveCurrency,
    send_amount: sendAmount,
    receive_amount: receiveAmount,
    rate_used: rateUsed,
    trade_label: tradeLabel,
    notes: notes.trim(),
    status: "pending",
  })
  .select()
  .single();

if (data?.id) {
  window.location.href = `/trades/${data.id}`;
}

      setNotes("");
      setMessage("Exchange request submitted successfully.");
      setMessageType("success");
    } catch (error) {
      console.error("exchange submit error:", error);
      setMessage("Something went wrong.");
      setMessageType("warn");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingUser) {
  return (
    <div className="page">
      <div className="container">
        <h2>Preparing your exchange...</h2>
      </div>
    </div>
  );
}

  if (!user) {
    return (
      <main className="page">
        <div className="container">
          <div className="card">
            <h1 className="card-title">Please log in</h1>
            <p className="card-subtitle">
              You need to log in before continuing with your exchange request.
            </p>

            <div className="stack top-space">
              <Link
                href={`/?login=1&next=${encodeURIComponent(nextUrl)}`}
                className="btn btn-primary"
                style={{ textAlign: "center" }}
              >
                Log in / Create account
              </Link>

              <Link
                href="/express"
                className="btn btn-outline"
                style={{ textAlign: "center" }}
              >
                Back to Express
              </Link>
            </div>
          </div>
        </div>

        <div className="nav">
          <Link href="/">
            <FiHome />
            <span>Home</span>
          </Link>

          <Link href="/market" className="active">
            <FiTrendingUp />
            <span>Market</span>
          </Link>

          <Link href="/profile">
            <FiUser />
            <span>Profile</span>
          </Link>
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
          <h1 className="card-title">Exchange Request</h1>
          <p className="card-subtitle">{tradeLabel}</p>

          <div className="stack top-space">
            <div className="helper-text">
              You send: {sendAmount} {sendCurrency}
            </div>
            <div className="helper-text">You receive: {formattedReceive}</div>
            <div className="helper-text">Rate used: {formattedRate}</div>
          </div>
        </div>

        <div className="card top-space">
          <h2 className="card-title">Your details</h2>

          <div className="form-stack top-space">
            <label className="input-label">
              Full name
              <input
                className="input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
              />
            </label>

            <label className="input-label">
              Phone number
              <input
                className="input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
              />
            </label>

            <label className="input-label">
              Notes
              <textarea
                className="input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes about your exchange"
                rows={4}
              />
            </label>

            <button
              className="btn btn-primary"
              type="button"
              onClick={saveAndSubmit}
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit Exchange Request"}
            </button>
          </div>
        </div>
      </div>

      <div className="nav">
        <Link href="/">
          <FiHome />
          <span>Home</span>
        </Link>

        <Link href="/market" className="active">
          <FiTrendingUp />
          <span>Market</span>
        </Link>

        <Link href="/profile">
          <FiUser />
          <span>Profile</span>
        </Link>
      </div>
    </main>
  );
}

export default function ExchangePage() {
  return (
    <Suspense
      fallback={
        <main className="page">
          <div className="container">
            <div className="card">
              <h1 className="card-title">Loading...</h1>
              <p className="card-subtitle">Please wait...</p>
            </div>
          </div>
        </main>
      }
    >
      <ExchangeContent />
    </Suspense>
  );
}