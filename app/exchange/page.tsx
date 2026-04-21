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
      return `${receiveAmount.toLocaleString()} TZS