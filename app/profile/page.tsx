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

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

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
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Profile load error:", error.message);
      return null;
    }

    return data as UserProfile | null;
  };

  const syncCurrentUser = async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Session error:", error.message);
        setUser(null);
        applyProfile(null);
        return;
      }

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (!currentUser) {
        applyProfile(null);
        return;
      }

      const profileData = await loadProfile(currentUser.id);
      applyProfile(profileData);
    } catch (error) {
      console.error("syncCurrentUser error:", error);
      setUser(null);
      applyProfile(null);
    }
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
        return;
      }

      const profileData = await loadProfile(currentUser.id);
      applyProfile(profileData);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const saveProfile = async () => {
    if (!user) {
      setMessage("Please log in first before updating your profile.");
      setMessageType("warn");
      return;
    }

    try {
      setSavingProfile(true);

      const payload = {
        id: user.id,
        full_name: fullName,
        phone,
        email: user.email,
      };

      const { error } = await supabase.from("profiles").upsert(payload);

      if (error) {
        setMessage(error.message);
        setMessageType("warn");
        return;
      }

      const updatedProfile = {
        id: user.id,
        full_name: fullName,
        phone,
        credits: profile?.credits || 0,
        email: user.email,
      };

      applyProfile(updatedProfile);

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
              You need to log in before viewing your profile and verification details.
            </p>

            <div className="stack top-space">
              <Link href="/?login=1"
    </main>
  );
}