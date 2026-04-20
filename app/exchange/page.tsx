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

        if (!currentUser) {
          setLoadingUser(false);
          return;
        }

        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .maybeSingle();

        const profileData = (data as UserProfile | null) || null;
        setProfile(profileData);
        setFullName(profileData?.full_name || "");
        setPhone(profileData?.phone || "");
      } catch (error) {
        console.error("exchange page user sync error:", error);
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

      await supabase.from("profiles").upsert({
        id: user.id,
        full_name: fullName.trim(),
        phone: phone.trim(),
        email: user.email,
      });

      await supabase.from("exchange_requests").insert({
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
      });

      setNotes("");
      setMessage("Exchange request submitted successfully.");
      setMessageType("success");
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong.");
      setMessageType("warn");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingUser) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return (
      <div>
        <p>Please log in</p>
        <Link href={`/?login=1&next=${encodeURIComponent(nextUrl)}`}>
          Login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1>Exchange</h1>
      <p>You send: {sendAmount} {sendCurrency}</p>
      <p>You receive: {formattedReceive}</p>

      <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" />
      <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />

      <button onClick={saveAndSubmit}>
        {submitting ? "Submitting..." : "Submit"}
      </button>

      {message && <p>{message}</p>}
    </div>
  );
}

export default function ExchangePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ExchangeContent />
    </Suspense>
  );
}