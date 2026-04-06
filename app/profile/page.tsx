"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type ProfileRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  credits: number | null;
  country: string | null;
  city: string | null;
  bank_name: string | null;
  account_number: string | null;
  account_holder_name: string | null;
  verification_status: string | null;
};

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [submittingVerification, setSubmittingVerification] = useState(false);

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "warn" | "info">("info");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");

  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");

  const applyProfile = (data: ProfileRow | null, currentUser?: any) => {
    setProfile(data);

    setFullName(data?.full_name || "");
    setPhone(data?.phone || "");
    setCountry(data?.country || "");
    setCity(data?.city || "");

    setBankName(data?.bank_name || "");
    setAccountNumber(data?.account_number || "");
    setAccountHolderName(data?.account_holder_name || currentUser?.email || "");
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

    return data as ProfileRow | null;
  };

  const syncUserAndProfile = async () => {
    try {
      setLoading(true);

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error(error);
        setUser(null);
        setProfile(null);
        return;
      }

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (!currentUser) {
        setProfile(null);
        return;
      }

      const existingProfile = await loadProfile(currentUser.id);

      if (existingProfile) {
        applyProfile(existingProfile, currentUser);
        return;
      }

      const starterProfile: Partial<ProfileRow> = {
        id: currentUser.id,
        email: currentUser.email,
        full_name: "",
        phone: "",
        credits: 0,
        country: "",
        city: "",
        bank_name: "",
        account_number: "",
        account_holder_name: "",
        verification_status: "not_submitted",
      };

      const { error: upsertError } = await supabase.from("profiles").upsert(starterProfile);

      if (upsertError) {
        console.error(upsertError);
      }

      const refreshed = await loadProfile(currentUser.id);
      applyProfile(refreshed, currentUser);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    syncUserAndProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (!currentUser) {
        setProfile(null);
        return;
      }

      const latest = await loadProfile(currentUser.id);
      applyProfile(latest, currentUser);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const verificationLabel = useMemo(() => {
    const status = profile?.verification_status || "not_submitted";

    if (status === "verified") return "Verified";
    if (status === "pending") return "Pending Review";
    if (status === "rejected") return "Rejected";
    return "Not Submitted";
  }, [profile?.verification_status]);

  const saveBasicProfile = async () => {
    if (!user) {
      setMessage("Please log in first.");
      setMessageType("warn");
      return;
    }

    try {
      setSavingProfile(true);

      const payload = {
        id: user.id,
        full_name: fullName.trim(),
        phone: phone.trim(),
        email: user.email,
        country: country.trim(),
        city: city.trim(),
      };

      const { error } = await supabase.from("profiles").upsert(payload);

      if (error) {
        setMessage(error.message);
        setMessageType("warn");
        return;
      }

      const latest = await loadProfile(user.id);
      applyProfile(latest, user);

      setMessage("Profile saved successfully.");
      setMessageType("success");
    } catch (error) {
      console.error(error);
      setMessage("Could not save profile.");
      setMessageType("warn");
    } finally {
      setSavingProfile(false);
    }
  };

  const submitVerification = async () => {
    if (!user) {
      setMessage("Please log in first.");
      setMessageType("warn");
      return;
    }

    if (!fullName.trim()) {
      setMessage("Enter your full legal name before submitting verification.");
      setMessageType("warn");
      return;
    }

    if (!country.trim() || !city.trim()) {
      setMessage("Enter your country and city before submitting verification.");
      setMessageType("warn");
      return;
    }

    if (!bankName.trim() || !accountNumber.trim() || !accountHolderName.trim()) {
      setMessage("Complete all bank verification fields first.");
      setMessageType("warn");
      return;
    }

    try {
      setSubmittingVerification(true);

      const normalizedProfileName = fullName.trim().toLowerCase();
      const normalizedAccountName = accountHolderName.trim().toLowerCase();

      const autoMismatch = normalizedProfileName !== normalizedAccountName;

      const nextStatus = autoMismatch ? "rejected" : "pending";

      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          full_name: fullName.trim(),
          phone: phone.trim(),
          email: user.email,
          country: country.trim(),
          city: city.trim(),
          bank_name: bankName.trim(),
          account_number: accountNumber.trim(),
          account_holder_name: accountHolderName.trim(),
          verification_status: nextStatus,
        });

      if (error) {
        setMessage(error.message);
        setMessageType("warn");
        return;
      }

      const latest = await loadProfile(user.id);
      applyProfile(latest, user);

      if (autoMismatch) {
        setMessage(
          "Verification could not move forward because the account holder name does not match the full legal name on the profile."
        );
        setMessageType("warn");
      } else {
        setMessage(
          "Verification submitted successfully. Your account is now pending manual review."
        );
        setMessageType("success");
      }
    } catch (error) {
      console.error(error);
      setMessage("Could not submit verification.");
      setMessageType("warn");
    } finally {
      setSubmittingVerification(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (loading) {
    return (
      <main className="page">
        <div className="container">
          <div className="card">
            <h2 className="card-title">Loading profile...</h2>
            <p className="card-subtitle">Please wait while we prepare your account.</p>
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
            <h2 className="card-title">Please log in</h2>
            <p className="card-subtitle">
              You need to log in before viewing your profile and verification details.
            </p>
          </div>

          <div className="nav">
            <Link href="/">Home</Link>
            <Link href="/market">Market</Link>
            <Link href="/profile" className="active">
              Profile
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="container">
        <div className="hero-card">
          <div className="eyebrow">Profile & Verification</div>
          <h1>Account Centre</h1>
          <p>
            Complete your identity and bank verification details to improve trust and
            qualify as a verified trader.
          </p>

          <div className="stats-grid">
            <div className="stat-box">
              <span className="stat-label">Credits</span>
              <strong>{profile?.credits || 0}</strong>
            </div>
            <div className="stat-box">
              <span className="stat-label">Verification</span>
              <strong>{verificationLabel}</strong>
            </div>
            <div className="stat-box">
              <span className="stat-label">Country</span>
              <strong>{profile?.country || "-"}</strong>
            </div>
            <div className="stat-box">
              <span className="stat-label">City</span>
              <strong>{profile?.city || "-"}</strong>
            </div>
          </div>
        </div>

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
          <h2 className="card-title">Personal Details</h2>
          <p className="card-subtitle">
            Enter your real identity details. These should match your bank account
            details for verification purposes.
          </p>

          <div className="form-stack top-space">
            <label className="input-label">
              Full legal name
              <input
                className="input"
                placeholder="Enter your full legal name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </label>

            <label className="input-label">
              Phone number
              <input
                className="input"
                placeholder="Enter your phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </label>

            <label className="input-label">
              Country
              <input
                className="input"
                placeholder="e.g. United Kingdom or Tanzania"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </label>

            <label className="input-label">
              City
              <input
                className="input"
                placeholder="e.g. London or Dar es Salaam"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </label>

            <button
              className="btn btn-primary"
              onClick={saveBasicProfile}
              disabled={savingProfile}
            >
              {savingProfile ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">Bank Verification</h2>
          <p className="card-subtitle">
            Your bank account name should match your full legal name exactly before
            your trader account can be approved.
          </p>

          <div className="form-stack top-space">
            <label className="input-label">
              Bank name
              <input
                className="input"
                placeholder="e.g. CRDB, NMB, Barclays, Lloyds"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
            </label>

            <label className="input-label">
              Account number
              <input
                className="input"
                placeholder="Enter your account number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
            </label>

            <label className="input-label">
              Account holder name
              <input
                className="input"
                placeholder="Must match full legal name"
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)}
              />
            </label>

            <div className="helper-text">
              Current verification status: <strong>{verificationLabel}</strong>
            </div>

            <button
              className="btn btn-success"
              onClick={submitVerification}
              disabled={submittingVerification}
            >
              {submittingVerification ? "Submitting..." : "Submit For Verification"}
            </button>
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">How verification works</h2>
          <p className="card-subtitle">
            1. You submit your legal identity and bank details.
            <br />
            2. Your bank account holder name must match your profile name.
            <br />
            3. Matching submissions move to pending review.
            <br />
            4. After manual review, your trader status can be marked as verified.
          </p>
        </div>

        <div className="card">
          <h2 className="card-title">Session</h2>
          <p className="card-subtitle">
            Signed in as: <strong>{user.email}</strong>
          </p>

          <div className="top-space">
            <button className="btn btn-dark" onClick={logout}>
              Logout
            </button>
          </div>
        </div>

        <div className="nav">
          <Link href="/">Home</Link>
          <Link href="/market">Market</Link>
          <Link href="/profile" className="active">
            Profile
          </Link>
        </div>
      </div>
    </main>
  );
}