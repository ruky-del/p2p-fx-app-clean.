"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Offer = {
  id: string;
  user_id: string;
  email?: string;
  name: string;
  phone: string;
  from_currency: string;
  to_currency: string;
  rate: number;
  amount: number;
  created_at?: string;
};

type Profile = {
  id: string;
  email?: string;
  name?: string;
  phone?: string;
  coins?: number;
};

type Notice = {
  type: "success" | "error";
  text: string;
} | null;

type Tab = "home" | "market" | "listings" | "contacts" | "profile";
type SortMode = "newest" | "best_rate";

export default function Page() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [session, setSession] = useState<any>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authLoading, setAuthLoading] = useState(false);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [offers, setOffers] = useState<Offer[]>([]);
  const [offersLoading, setOffersLoading] = useState(true);

  const [notice, setNotice] = useState<Notice>(null);

  const [search, setSearch] = useState("");
  const [filterFrom, setFilterFrom] = useState("ALL");
  const [filterTo, setFilterTo] = useState("ALL");
  const [sortMode, setSortMode] = useState<SortMode>("newest");

  const [unlockedOfferIds, setUnlockedOfferIds] = useState<string[]>([]);
  const [unlockingId, setUnlockingId] = useState<string | null>(null);

  const [listingFromCurrency, setListingFromCurrency] = useState("TZS");
  const [listingToCurrency, setListingToCurrency] = useState("GBP");
  const [listingRate, setListingRate] = useState("3600");
  const [listingAmount, setListingAmount] = useState("");
  const [posting, setPosting] = useState(false);

  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [editFromCurrency, setEditFromCurrency] = useState("TZS");
  const [editToCurrency, setEditToCurrency] = useState("GBP");
  const [editRate, setEditRate] = useState("3600");
  const [editAmount, setEditAmount] = useState("");
  const [updatingOffer, setUpdatingOffer] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const UNLOCK_COST = 2;

  const showNotice = (type: "success" | "error", text: string) => {
    setNotice({ type, text });
    window.clearTimeout((window as any).__noticeTimer);
    (window as any).__noticeTimer = window.setTimeout(() => {
      setNotice(null);
    }, 3000);
  };

  const normalizePhone = (value: string) => value.replace(/\s+/g, "");

  const isValidInternationalPhone = (value: string) => {
    return /^\+[1-9]\d{7,14}$/.test(value);
  };

  function smartPhoneFormat(value: string) {
    let cleanedPhone = normalizePhone(value);

    if (!cleanedPhone.startsWith("+")) {
      if (cleanedPhone.startsWith("0")) {
        cleanedPhone = cleanedPhone.slice(1);
      }
      cleanedPhone = "+255" + cleanedPhone;
    }

    return cleanedPhone;
  }

  function maskPhone(phone: string) {
    const cleaned = normalizePhone(phone);

    if (cleaned.startsWith("+255") && cleaned.length >= 10) {
      return `${cleaned.slice(0, 7)} *** ***`;
    }

    if (cleaned.startsWith("+44") && cleaned.length >= 8) {
      return `${cleaned.slice(0, 6)} *** ***`;
    }

    if (cleaned.length <= 6) return "******";

    return `${cleaned.slice(0, 4)}***${cleaned.slice(-3)}`;
  }

  function calculateConvertedAmount(
    rawAmount: number,
    rawRate: number,
    from: string,
    to: string
  ) {
    if (!rawAmount || !rawRate) return 0;

    if (from === "TZS" && to === "GBP") return rawAmount / rawRate;
    if (from === "GBP" && to === "TZS") return rawAmount * rawRate;

    if (from === "TZS" && to === "USD") return rawAmount / rawRate;
    if (from === "USD" && to === "TZS") return rawAmount * rawRate;

    if (from === "TZS" && to === "EUR") return rawAmount / rawRate;
    if (from === "EUR" && to === "TZS") return rawAmount * rawRate;

    return rawAmount * rawRate;
  }

  function sellerBadge(userId: string) {
    const count = offers.filter((o) => o.user_id === userId).length;
    if (count >= 5) {
      return { text: "Trusted Seller", tone: "success" as const };
    }
    if (count >= 2) {
      return { text: "Active Seller", tone: "info" as const };
    }
    return { text: "New Seller", tone: "neutral" as const };
  }

  function getVisiblePhone(offer: Offer) {
    const isOwner = offer.user_id === session?.user?.id;
    const isUnlocked = unlockedOfferIds.includes(offer.id);
    if (isOwner || isUnlocked) return offer.phone;
    return maskPhone(offer.phone);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !data) {
      setProfile(null);
      setProfileName("");
      setProfilePhone("");
      return;
    }

    setProfile(data as Profile);
    setProfileName(data.name || "");
    setProfilePhone(data.phone || "");
  }

  async function fetchUnlockedContacts(userId: string) {
    const { data, error } = await supabase
      .from("unlocked_contacts")
      .select("offer_id")
      .eq("user_id", userId);

    if (error) {
      console.error(error);
      setUnlockedOfferIds([]);
      return;
    }

    setUnlockedOfferIds((data || []).map((row: any) => row.offer_id));
  }

  async function fetchOffers() {
    setOffersLoading(true);

    const { data, error } = await supabase
      .from("offers")
      .select("*")
      .order("created_at", { ascending: false });

    setOffersLoading(false);

    if (error) {
      console.error(error);
      return;
    }

    setOffers((data || []) as Offer[]);
  }

  useEffect(() => {
    fetchOffers();
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      fetchProfile(session.user.id);
      fetchUnlockedContacts(session.user.id);
    } else {
      setProfile(null);
      setProfileName("");
      setProfilePhone("");
      setUnlockedOfferIds([]);
    }
  }, [session]);

  async function handleAuth() {
    if (!email || !password) {
      showNotice("error", "Enter email and password");
      return;
    }

    setAuthLoading(true);

    if (authMode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      setAuthLoading(false);

      if (error) {
        showNotice("error", error.message);
        return;
      }

      setEmail("");
      setPassword("");
      showNotice(
        "success",
        "Account created. Check your email if confirmation is enabled, then log in."
      );
      setAuthMode("login");
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setAuthLoading(false);

    if (error) {
      showNotice(
        "error",
        error.message ||
          "Login failed. Check your email/password or confirm your email first."
      );
      return;
    }

    setSession(data.session);
    setEmail("");
    setPassword("");
    setActiveTab("market");
    showNotice("success", "Login successful");
  }

  async function logout() {
    await supabase.auth.signOut();
    setSession(null);
    setEmail("");
    setPassword("");
    setActiveTab("home");
    showNotice("success", "Logged out");
  }

  async function saveProfile() {
    if (!session?.user?.id) {
      showNotice("error", "Login first");
      return;
    }

    if (!profileName || !profilePhone) {
      showNotice("error", "Enter your name and phone");
      return;
    }

    const cleanedPhone = smartPhoneFormat(profilePhone);

    if (!isValidInternationalPhone(cleanedPhone)) {
      showNotice("error", "Phone must include a valid country code, e.g. +255...");
      return;
    }

    setSavingProfile(true);

    const payload = {
      id: session.user.id,
      email: session.user.email,
      name: profileName.trim(),
      phone: cleanedPhone,
      coins: profile?.coins ?? 0,
    };

    const { error } = await supabase.from("profiles").upsert(payload);

    setSavingProfile(false);

    if (error) {
      console.error(error);
      showNotice("error", "Failed to save profile");
      return;
    }

    await fetchProfile(session.user.id);
    showNotice("success", "Profile saved successfully");
  }
  async function postOffer() {
    if (!session?.user?.id) {
      showNotice("error", "Login first");
      return;
    }

    if (!profile?.name || !profile?.phone) {
      showNotice("error", "Save profile first");
      return;
    }

    const amountNum = Number(listingAmount || 0);
    const rateNum = Number(listingRate || 0);

    if (!amountNum || !rateNum) {
      showNotice("error", "Enter amount and rate");
      return;
    }

    setPosting(true);

    const { error } = await supabase.from("offers").insert([
      {
        user_id: session.user.id,
        email: session.user.email,
        name: profile.name,
        phone: profile.phone,
        from_currency: listingFromCurrency,
        to_currency: listingToCurrency,
        rate: rateNum,
        amount: amountNum,
      },
    ]);

    setPosting(false);

    if (error) {
      console.error(error);
      showNotice("error", "Failed to create listing");
      return;
    }

    setListingAmount("");
    setListingRate("3600");
    await fetchOffers();
    showNotice("success", "Listing created successfully");
  }

  function startEditOffer(offer: Offer) {
    setEditingOfferId(offer.id);
    setEditFromCurrency(offer.from_currency);
    setEditToCurrency(offer.to_currency);
    setEditRate(String(offer.rate));
    setEditAmount(String(offer.amount));
    setActiveTab("listings");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEditOffer() {
    setEditingOfferId(null);
    setEditFromCurrency("TZS");
    setEditToCurrency("GBP");
    setEditRate("3600");
    setEditAmount("");
  }

  async function updateOffer() {
    if (!editingOfferId) return;

    const editRateNum = Number(editRate || 0);
    const editAmountNum = Number(editAmount || 0);

    if (!editRateNum || !editAmountNum) {
      showNotice("error", "Enter amount and rate");
      return;
    }

    setUpdatingOffer(true);

    const { error } = await supabase
      .from("offers")
      .update({
        from_currency: editFromCurrency,
        to_currency: editToCurrency,
        rate: editRateNum,
        amount: editAmountNum,
      })
      .eq("id", editingOfferId)
      .eq("user_id", session?.user?.id);

    setUpdatingOffer(false);

    if (error) {
      console.error(error);
      showNotice("error", "Failed to update listing");
      return;
    }

    await fetchOffers();
    cancelEditOffer();
    showNotice("success", "Listing updated successfully");
  }

  async function deleteOffer(offerId: string) {
    const confirmed = window.confirm("Delete this listing?");
    if (!confirmed) return;

    setDeletingId(offerId);

    const { error } = await supabase
      .from("offers")
      .delete()
      .eq("id", offerId)
      .eq("user_id", session?.user?.id);

    setDeletingId(null);

    if (error) {
      console.error(error);
      showNotice("error", "Failed to delete listing");
      return;
    }

    await fetchOffers();

    if (editingOfferId === offerId) {
      cancelEditOffer();
    }

    showNotice("success", "Listing deleted");
  }

  async function unlockContact(offer: Offer) {
    if (!session?.user?.id) {
      showNotice("error", "Login first to unlock contact");
      return;
    }

    if (offer.user_id === session.user.id) {
      showNotice("success", "This is your own listing");
      return;
    }

    if (unlockedOfferIds.includes(offer.id)) {
      showNotice("success", "Contact already unlocked");
      return;
    }

    const currentCredits = Number(profile?.coins || 0);

    if (currentCredits < UNLOCK_COST) {
      showNotice("error", `You need ${UNLOCK_COST} credits to unlock this contact`);
      return;
    }

    setUnlockingId(offer.id);

    const { error: insertError } = await supabase
      .from("unlocked_contacts")
      .insert([
        {
          user_id: session.user.id,
          offer_id: offer.id,
        },
      ]);

    if (insertError) {
      setUnlockingId(null);
      console.error(insertError);
      showNotice("error", "Failed to unlock contact");
      return;
    }

    const { error: updateProfileError } = await supabase
      .from("profiles")
      .update({
        coins: currentCredits - UNLOCK_COST,
      })
      .eq("id", session.user.id);

    setUnlockingId(null);

    if (updateProfileError) {
      console.error(updateProfileError);
      showNotice("error", "Contact unlocked, but credit update failed");
      await fetchUnlockedContacts(session.user.id);
      return;
    }

    await fetchProfile(session.user.id);
    await fetchUnlockedContacts(session.user.id);
    showNotice("success", `Contact unlocked. ${UNLOCK_COST} credits used.`);
  }

  const listingPreview = calculateConvertedAmount(
    Number(listingAmount || 0),
    Number(listingRate || 0),
    listingFromCurrency,
    listingToCurrency
  );

  const editPreview = calculateConvertedAmount(
    Number(editAmount || 0),
    Number(editRate || 0),
    editFromCurrency,
    editToCurrency
  );

  const sortedFilteredOffers = useMemo(() => {
    const filtered = offers.filter((offer) => {
      const q = search.trim().toLowerCase();

      const matchesSearch =
        q === "" ||
        offer.name.toLowerCase().includes(q) ||
        offer.phone.toLowerCase().includes(q) ||
        offer.from_currency.toLowerCase().includes(q) ||
        offer.to_currency.toLowerCase().includes(q);

      const matchesFrom =
        filterFrom === "ALL" || offer.from_currency === filterFrom;
      const matchesTo = filterTo === "ALL" || offer.to_currency === filterTo;

      return matchesSearch && matchesFrom && matchesTo;
    });

    if (sortMode === "best_rate") {
      return [...filtered].sort((a, b) => {
        if (a.from_currency === "TZS" && a.to_currency !== "TZS") {
          return a.rate - b.rate;
        }
        return b.rate - a.rate;
      });
    }

    return filtered;
  }, [offers, search, filterFrom, filterTo, sortMode]);

  const myOffers = useMemo(() => {
    if (!session?.user?.id) return [];
    return offers.filter((offer) => offer.user_id === session.user.id);
  }, [offers, session]);

  const unlockedOffers = useMemo(() => {
    if (!session?.user?.id) return [];
    return offers.filter(
      (offer) =>
        unlockedOfferIds.includes(offer.id) && offer.user_id !== session.user.id
    );
  }, [offers, unlockedOfferIds, session]);

  const stats = {
    liveOffers: offers.length,
    myListings: myOffers.length,
    contacts: unlockedOffers.length,
    credits: Number(profile?.coins || 0),
  };

  const NavButton = ({
    id,
    label,
  }: {
    id: Tab;
    label: string;
  }) => (
    <button
      className={`nav-chip ${activeTab === id ? "active" : ""}`}
      onClick={() => setActiveTab(id)}
      type="button"
    >
      {label}
    </button>
  );

  return (
    <main className="app-shell">
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          background: #eff6ff;
          color: #0f172a;
          font-family: Inter, Arial, sans-serif;
        }

        button,
        input,
        select,
        a {
          font: inherit;
        }

        .app-shell {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, #dbeafe 0%, #eff6ff 35%, #f8fbff 72%, #ffffff 100%);
          padding: 16px 14px 110px;
        }

        .container {
          max-width: 1180px;
          margin: 0 auto;
        }

        .desktop-nav {
          display: none;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 18px;
        }

        .nav-chip {
          border: 1px solid #d7e3f3;
          background: #ffffff;
          color: #0f172a;
          padding: 10px 14px;
          border-radius: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .nav-chip.active {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          border-color: #2563eb;
          color: #fff;
          box-shadow: 0 10px 22px rgba(37, 99, 235, 0.2);
        }

        .mobile-bottom-nav {
          position: fixed;
          left: 12px;
          right: 12px;
          bottom: 12px;
          z-index: 60;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(12px);
          border: 1px solid #dbe7f5;
          border-radius: 22px;
          padding: 10px;
          box-shadow: 0 18px 50px rgba(15, 23, 42, 0.14);
        }

        .mobile-nav-btn {
          border: none;
          background: transparent;
          border-radius: 14px;
          padding: 10px 6px;
          color: #475569;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .mobile-nav-btn.active {
          background: #e8f0ff;
          color: #1d4ed8;
        }
        .hero {
          background: linear-gradient(135deg, #1d4ed8 0%, #0f172a 100%);
          color: white;
          border-radius: 24px;
          padding: 20px;
          box-shadow: 0 18px 40px rgba(29, 78, 216, 0.22);
          margin-bottom: 18px;
        }

        .hero-kicker {
          margin: 0 0 8px;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          opacity: 0.8;
          font-weight: 700;
        }

        .hero-title {
          margin: 0;
          font-size: 34px;
          line-height: 1.02;
          font-weight: 900;
        }

        .hero-subtitle {
          margin: 12px 0 0;
          max-width: 760px;
          color: rgba(255, 255, 255, 0.9);
          font-size: 14px;
          line-height: 1.5;
        }

        .hero-small {
          margin: 10px 0 0;
          max-width: 760px;
          font-size: 12px;
          line-height: 1.5;
          color: rgba(255, 255, 255, 0.7);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-top: 18px;
        }

        .stat-box {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 16px;
          padding: 14px;
        }

        .stat-label {
          margin: 0;
          font-size: 12px;
          opacity: 0.75;
        }

        .stat-value {
          margin: 8px 0 0;
          font-size: 22px;
          font-weight: 900;
        }

        .grid-3,
        .stack {
          display: grid;
          gap: 16px;
        }

        .card {
          background: rgba(255, 255, 255, 0.96);
          border: 1px solid #e5edf7;
          border-radius: 22px;
          padding: 18px;
          box-shadow: 0 14px 34px rgba(15, 23, 42, 0.06);
        }

        .card-title {
          margin: 0;
          font-size: 26px;
          line-height: 1.1;
        }

        .card-subtitle {
          margin: 8px 0 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.5;
        }

        .label {
          margin: 0 0 8px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.7px;
          text-transform: uppercase;
          color: #64748b;
        }

        .field,
        .select {
          width: 100%;
          border: 1px solid #dbe6f2;
          background: #fff;
          color: #0f172a;
          border-radius: 14px;
          padding: 13px 14px;
          outline: none;
        }

        .btn {
          border: none;
          border-radius: 14px;
          padding: 13px 16px;
          font-weight: 800;
          cursor: pointer;
          transition: 0.2s ease;
          text-decoration: none;
          display: inline-block;
          text-align: center;
        }

        .btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .btn-primary {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: white;
          box-shadow: 0 10px 20px rgba(37, 99, 235, 0.18);
        }

        .btn-dark {
          background: #0f172a;
          color: white;
        }

        .btn-light {
          background: #fff;
          border: 1px solid #d7e3f3;
          color: #0f172a;
        }

        .btn-danger {
          background: #dc2626;
          color: white;
        }

        .btn-success {
          background: #22c55e;
          color: white;
        }

        .button-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .offer-card {
          border: 1px solid #e4edf5;
          border-radius: 20px;
          padding: 16px;
          background: #f9fbff;
        }

        .offer-head {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }

        .offer-name {
          margin: 0;
          font-size: 22px;
          font-weight: 900;
          color: #111827;
        }

        .badge {
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
        }

        .badge.info {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .badge.success {
          background: #dcfce7;
          color: #15803d;
        }

        .badge.neutral {
          background: #f1f5f9;
          color: #475569;
        }

        .offer-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 12px;
        }

        .mini-box {
          background: #fff;
          border: 1px solid #edf2f7;
          border-radius: 14px;
          padding: 12px;
        }

        .mini-label {
          margin: 0;
          font-size: 10px;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.7px;
        }

        .mini-value {
          margin: 8px 0 0;
          font-size: 15px;
          font-weight: 900;
          color: #0f172a;
          line-height: 1.3;
          word-break: break-word;
        }

        .offer-actions {
          display: grid;
          gap: 10px;
        }

        .small-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 10px;
        }

        .empty-state,
        .loading-state {
          border: 1px dashed #d1d9e5;
          border-radius: 18px;
          padding: 22px;
          background: #f9fbff;
          color: #64748b;
          text-align: center;
        }

        .info-strip {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1d4ed8;
          border-radius: 16px;
          padding: 14px;
        }

        .warning-strip {
          background: #fff7ed;
          border: 1px solid #fed7aa;
          color: #9a3412;
          border-radius: 14px;
          padding: 12px;
          font-size: 13px;
          font-weight: 700;
          text-align: center;
        }

        .preview-box {
          background: linear-gradient(135deg, #eef2ff, #f8fafc);
          border: 1px solid #c7d2fe;
          border-radius: 16px;
          padding: 16px;
          color: #312e81;
        }

        .section-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 14px;
        }

        .notice {
          position: fixed;
          top: 14px;
          right: 14px;
          z-index: 100;
          max-width: calc(100vw - 28px);
          padding: 12px 14px;
          border-radius: 14px;
          color: #fff;
          font-size: 14px;
          font-weight: 800;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.18);
        }

        .notice.success {
          background: #16a34a;
        }

        .notice.error {
          background: #dc2626;
        }

        .top-space {
          margin-top: 8px;
        }

        @media (min-width: 768px) {
          .app-shell {
            padding: 24px 18px 36px;
          }

          .desktop-nav {
            display: flex;
          }

          .mobile-bottom-nav {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
          }

          .hero {
            padding: 28px;
            border-radius: 28px;
          }

          .hero-title {
            font-size: 52px;
          }

          .hero-subtitle {
            font-size: 17px;
          }

          .stats-grid {
            grid-template-columns: repeat(4, 1fr);
          }

          .grid-3 {
            grid-template-columns: repeat(3, 1fr);
          }

          .offer-main-row {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 18px;
            align-items: start;
          }
        }
      `}</style>

      {notice && <div className={`notice ${notice.type}`}>{notice.text}</div>}

      <div className="container">
        <div className="desktop-nav">
          <NavButton id="home" label="Home" />
          <NavButton id="market" label="Marketplace" />
          {session && (
            <>
              <NavButton id="listings" label="My Listings" />
              <NavButton id="contacts" label="Contacts" />
              <NavButton id="profile" label="Profile" />
            </>
          )}
        </div>

        <section
          className="hero"
          onClick={() => setActiveTab("market")}
          style={{ cursor: "pointer" }}
        >
          <p className="hero-kicker">Tanzania ↔ UK Exchange Network</p>
        <h1 className="hero-title">P2P FX Marketplace</h1>
          <p className="hero-subtitle">
            A trusted peer-to-peer platform connecting people who need to exchange
            money between Tanzania and the UK — without bank limits, delays, or
            unnecessary restrictions.
          </p>
          <p
            style={{
              margin: "10px 0 0",
              fontSize: 14,
              lineHeight: 1.5,
              color: "rgba(255,255,255,0.82)",
              maxWidth: 760,
            }}
          >
            Built to solve real problems: sending large amounts, avoiding banking
            issues, and finding reliable exchange partners in one secure place.
          </p>
          <p className="hero-small">
            Always verify before exchanging. This platform connects users, and users
            remain responsible for their transactions.
          </p>

          <div className="stats-grid">
            <div
              className="stat-box"
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab("market");
              }}
              style={{ cursor: "pointer" }}
            >
              <p className="stat-label">Live Offers</p>
              <p className="stat-value">{stats.liveOffers}</p>
            </div>

            <div
              className="stat-box"
              onClick={(e) => {
                e.stopPropagation();
                if (session) setActiveTab("listings");
              }}
              style={{ cursor: session ? "pointer" : "default" }}
            >
              <p className="stat-label">My Listings</p>
              <p className="stat-value">{session ? stats.myListings : "-"}</p>
            </div>

            <div className="stat-box">
              <p className="stat-label">Unlocked Contacts</p>
              <p className="stat-value">{session ? stats.contacts : "-"}</p>
            </div>

            <div
              className="stat-box"
              onClick={(e) => {
                e.stopPropagation();
                if (session) setActiveTab("profile");
              }}
              style={{ cursor: session ? "pointer" : "default" }}
            >
              <p className="stat-label">Credits</p>
              <p className="stat-value">{session ? stats.credits : "-"}</p>
            </div>
          </div>
        </section>
        {activeTab === "home" && (
          <div className="stack">
            <div className="grid-3">
              <div className="card">
                <h2 className="card-title">How it works</h2>
                <p className="card-subtitle">
                  1. Browse FX offers from buyers and sellers.<br />
                  2. Unlock contact details using credits.<br />
                  3. Connect directly and complete your exchange securely.
                </p>
              </div>

              <div className="card">
                <h2 className="card-title">Why this platform exists</h2>
                <p className="card-subtitle">
                  • Sending large amounts between Tanzania and the UK is difficult.<br />
                  • Banks often question or restrict high-value transactions.<br />
                  • Many users cannot keep large balances comfortably.<br />
                  • Most exchanges happen informally via WhatsApp, without structure or trust.
                </p>
              </div>

              <div className="card">
                <h2 className="card-title">What this platform helps with</h2>
                <p className="card-subtitle">
                  • Connect buyers and sellers directly.<br />
                  • Make it easier to know who has what available.<br />
                  • Reduce banking stress for large exchanges.<br />
                  • Support future invoice and high-value payment services between Tanzania and the UK.
                </p>
              </div>
            </div>

            {!session && (
              <div className="card">
                <h2 className="card-title">Get started</h2>
                <p className="card-subtitle">
                  Create an account or log in to unlock contacts and manage listings.
                </p>

                <div className="button-row top-space">
                  <button
                    className={`btn ${authMode === "signup" ? "btn-primary" : "btn-dark"}`}
                    onClick={() => setAuthMode("signup")}
                    type="button"
                  >
                    Sign Up
                  </button>
                  <button
                    className={`btn ${authMode === "login" ? "btn-primary" : "btn-dark"}`}
                    onClick={() => setAuthMode("login")}
                    type="button"
                  >
                    Login
                  </button>
                </div>

                <div className="stack top-space">
                  <input
                    className="field"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <input
                    className="field"
                    placeholder="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={handleAuth}
                    disabled={authLoading}
                    type="button"
                  >
                    {authLoading
                      ? "Loading..."
                      : authMode === "signup"
                      ? "Create Account"
                      : "Login"}
                  </button>
                </div>
              </div>
            )}

            <div className="card">
              <div className="section-row">
                <div>
                  <h2 className="card-title">Marketplace Preview</h2>
                  <p className="card-subtitle">
                    Public users can browse live offers before logging in.
                  </p>
                </div>
                <button
                  className="btn btn-light"
                  onClick={() => setActiveTab("market")}
                  type="button"
                >
                  Open Marketplace
                </button>
              </div>

              {offersLoading ? (
                <div className="loading-state">Loading live offers...</div>
              ) : offers.length === 0 ? (
                <div className="empty-state">No live offers yet.</div>
              ) : (
                <div className="stack">
                  {offers.slice(0, 3).map((offer) => {
                    const total = calculateConvertedAmount(
                      offer.amount,
                      offer.rate,
                      offer.from_currency,
                      offer.to_currency
                    );
                    const badge = sellerBadge(offer.user_id);

                    return (
                      <div className="offer-card" key={offer.id}>
                        <div className="offer-head">
                          <p className="offer-name">{offer.name}</p>
                          <span className={`badge ${badge.tone}`}>{badge.text}</span>
                          <span className="badge info">
                            {offer.from_currency} → {offer.to_currency}
                          </span>
                        </div>
                        <div className="offer-grid">
                          <div className="mini-box">
                            <p className="mini-label">Amount</p>
                            <p className="mini-value">
                              {offer.amount.toLocaleString()} {offer.from_currency}
                            </p>
                          </div>
                          <div className="mini-box">
                            <p className="mini-label">Total</p>
                            <p className="mini-value">
                              {total.toFixed(2)} {offer.to_currency}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "market" && (
          <div className="stack">
            <div className="card">
              <div className="section-row">
                <div>
                  <h2 className="card-title">Marketplace</h2>
                  <p className="card-subtitle">
                    {sortedFilteredOffers.length} live offer
                    {sortedFilteredOffers.length === 1 ? "" : "s"} available.
                  </p>
                </div>
                <span className="badge neutral">Public Listings</span>
              </div>

              <div className="stack">
                <input
                  className="field"
                  placeholder="Search by currency, amount, location, or seller..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

                <div className="button-row">
                  <select
                    className="select"
                    value={filterFrom}
                    onChange={(e) => setFilterFrom(e.target.value)}
                  >
                    <option value="ALL">All From</option>
                    <option value="TZS">TZS</option>
                    <option value="GBP">GBP</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>

                  <select
                    className="select"
                    value={filterTo}
                    onChange={(e) => setFilterTo(e.target.value)}
                  >
                    <option value="ALL">All To</option>
                    <option value="GBP">GBP</option>
                    <option value="TZS">TZS</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>

                <select
                  className="select"
                  value={sortMode}
                  onChange={(e) => setSortMode(e.target.value as SortMode)}
                >
                  <option value="newest">Sort: Newest</option>
                  <option value="best_rate">Sort: Best Rate</option>
                </select>

                <div className="info-strip">
                  Always verify rates, identity, and payment details before exchanging funds.
                </div>
              </div>
            </div>

            {offersLoading ? (
              <div className="loading-state">Loading marketplace...</div>
            ) : sortedFilteredOffers.length === 0 ? (
              <div className="empty-state">
                No offers found. Try changing filters or search.
              </div>
            ) : (
              <div className="stack">
                {sortedFilteredOffers.map((offer) => {
                  const isOwner = offer.user_id === session?.user?.id;
                  const isUnlocked = unlockedOfferIds.includes(offer.id);
                  const canSeeFullContact = isOwner || isUnlocked;
                  const badge = sellerBadge(offer.user_id);

                  const total = calculateConvertedAmount(
                    offer.amount,
                    offer.rate,
                    offer.from_currency,
                    offer.to_currency
                  );

                  const message = encodeURIComponent(
                    `Hi ${offer.name}, I'm interested in your ${offer.from_currency} to ${offer.to_currency} offer on P2P FX Marketplace.`
                  );

                  return (
                    <div className="offer-card" key={offer.id}>
                      <div className="offer-main-row">
                        <div>
                          <div className="offer-head">
                            <p className="offer-name">{offer.name}</p>
                            <span className={`badge ${badge.tone}`}>{badge.text}</span>
                            <span className="badge info">
                              {offer.from_currency} → {offer.to_currency}
                            </span>
                          </div>

                          <div className="offer-grid">
                            <div className="mini-box">
                              <p className="mini-label">Amount</p>
                              <p className="mini-value">
                                {offer.amount.toLocaleString()} {offer.from_currency}
                              </p>
                            </div>

                            <div className="mini-box">
                              <p className="mini-label">Total</p>
                              <p className="mini-value">
                                {total.toFixed(2)} {offer.to_currency}
                              </p>
                            </div>

                            <div className="mini-box">
                              <p className="mini-label">Rate</p>
                              <p className="mini-value">{offer.rate}</p>
                            </div>

                            <div className="mini-box">
                              <p className="mini-label">Phone</p>
                              <p className="mini-value">{getVisiblePhone(offer)}</p>
                            </div>
                          </div>

                          {isOwner && (
                            <div className="small-actions">
                              <button
                                className="btn btn-primary"
                                onClick={() => startEditOffer(offer)}
                                type="button"
                              >
                                Edit
                              </button>
                              <button
                                className="btn btn-danger"
                                onClick={() => deleteOffer(offer.id)}
                                disabled={deletingId === offer.id}
                                type="button"
                              >
                                {deletingId === offer.id ? "Deleting..." : "Delete"}
                              </button>
                            </div>
                          )}

                          {!isOwner && session && (
                            <p className="card-subtitle">
                              Your credits: {Number(profile?.coins || 0)}
                            </p>
                          )}
                        </div>

                        <div className="offer-actions">
                          {canSeeFullContact ? (
                            <a
                              className="btn btn-success"
                              href={`https://wa.me/${String(offer.phone).replace(
                                /\D/g,
                                ""
                              )}?text=${message}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Chat on WhatsApp
                            </a>
                          ) : !session ? (
                            <button
                              className="btn btn-primary"
                              onClick={() => setActiveTab("home")}
                              type="button"
                            >
                              Login to unlock
                            </button>
                          ) : (
                            <button
                              className="btn btn-dark"
                              onClick={() => unlockContact(offer)}
                              disabled={unlockingId === offer.id}
                              type="button"
                            >
                              {unlockingId === offer.id
                                ? "Unlocking..."
                                : Number(profile?.coins || 0) >= UNLOCK_COST
                                ? `Unlock Contact (${UNLOCK_COST} credits)`
                                : `Need ${UNLOCK_COST} credits`}
                            </button>
                          )}

                          {!canSeeFullContact && (
                            <div className="warning-strip">
                              Contact hidden until unlock
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "listings" && (
          <div className="stack">
            {session ? (
              <>
                <div className="card">
                  <div className="section-row">
                    <div>
                      <h2 className="card-title">My Listings</h2>
                      <p className="card-subtitle">
                        Create and manage your own marketplace offers.
                      </p>
                    </div>
                    <span className="badge neutral">{myOffers.length} active</span>
                  </div>

                  <div className="info-strip">
                    Posting as <strong>{profile?.name || "No profile name"}</strong>
                    <br />
                    Phone: <strong>{profile?.phone || "No profile phone"}</strong>
                  </div>

                  <div className="stack top-space">
                    <div className="button-row">
                      <div>
                        <p className="label">From</p>
                        <select
                          className="select"
                          value={listingFromCurrency}
                          onChange={(e) => setListingFromCurrency(e.target.value)}
                        >
                          <option>TZS</option>
                          <option>GBP</option>
                          <option>USD</option>
                          <option>EUR</option>
                        </select>
                      </div>

                      <div>
                        <p className="label">To</p>
                        <select
                          className="select"
                          value={listingToCurrency}
                          onChange={(e) => setListingToCurrency(e.target.value)}
                        >
                          <option>GBP</option>
                          <option>TZS</option>
                          <option>USD</option>
                          <option>EUR</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <p className="label">Rate</p>
                      <input
                        className="field"
                        type="number"
                        placeholder="Rate"
                        value={listingRate}
                        onChange={(e) => setListingRate(e.target.value)}
                      />
                    </div>

                    <div>
                      <p className="label">Amount</p>
                      <input
                        className="field"
                        type="number"
                        placeholder="Amount"
                        value={listingAmount}
                        onChange={(e) => setListingAmount(e.target.value)}
                      />
                    </div>

                    <div className="preview-box">
                      <p className="label">Live Preview</p>
                      <div style={{ fontWeight: 900, fontSize: 20 }}>
                        {Number(listingAmount || 0)} {listingFromCurrency} →{" "}
                        {listingPreview.toFixed(2)} {listingToCurrency}
                      </div>
                    </div>

                    <button
                      className="btn btn-primary"
                      onClick={postOffer}
                      disabled={posting}
                      type="button"
                    >
                      {posting ? "Creating..." : "Create Listing"}
                    </button>
                  </div>
                </div>

                {editingOfferId && (
                  <div className="card">
                    <h2 className="card-title">Edit Listing</h2>

                    <div className="stack top-space">
                      <div className="button-row">
                        <div>
                          <p className="label">From</p>
                          <select
                            className="select"
                            value={editFromCurrency}
                            onChange={(e) => setEditFromCurrency(e.target.value)}
                          >
                            <option>TZS</option>
                            <option>GBP</option>
                            <option>USD</option>
                            <option>EUR</option>
                          </select>
                        </div>

                        <div>
                          <p className="label">To</p>
                          <select
                            className="select"
                            value={editToCurrency}
                            onChange={(e) => setEditToCurrency(e.target.value)}
                          >
                            <option>GBP</option>
                            <option>TZS</option>
                            <option>USD</option>
                            <option>EUR</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <p className="label">Rate</p>
                        <input
                          className="field"
                          type="number"
                          value={editRate}
                          onChange={(e) => setEditRate(e.target.value)}
                        />
                      </div>

                      <div>
                        <p className="label">Amount</p>
                        <input
                          className="field"
                          type="number"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                        />
                      </div>

                      <div className="preview-box">
                        <p className="label">Edit Preview</p>
                        <div style={{ fontWeight: 900, fontSize: 20 }}>
                          {Number(editAmount || 0)} {editFromCurrency} →{" "}
                          {editPreview.toFixed(2)} {editToCurrency}
                        </div>
                      </div>

                      <div className="button-row">
                        <button
                          className="btn btn-primary"
                          onClick={updateOffer}
                          disabled={updatingOffer}
                          type="button"
                        >
                          {updatingOffer ? "Saving..." : "Save Changes"}
                        </button>
                        <button
                          className="btn btn-light"
                          onClick={cancelEditOffer}
                          type="button"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="card">
                  <h2 className="card-title">Your Active Listings</h2>
                  <p className="card-subtitle">
                    Edit or remove listings anytime.
                  </p>

                  {myOffers.length === 0 ? (
                    <div className="empty-state top-space">
                      You have not posted any listings yet. Create your first offer to start getting discovered.
                    </div>
                  ) : (
                    <div className="stack top-space">
                      {myOffers.map((offer) => {
                        const total = calculateConvertedAmount(
                          offer.amount,
                          offer.rate,
                          offer.from_currency,
                          offer.to_currency
                        );

                        return (
                          <div className="offer-card" key={offer.id}>
                            <div className="offer-head">
                              <p className="offer-name">{offer.name}</p>
                              <span className="badge info">
                                {offer.from_currency} → {offer.to_currency}
                              </span>
                            </div>

                            <div className="offer-grid">
                              <div className="mini-box">
                                <p className="mini-label">Amount</p>
                                <p className="mini-value">
                                  {offer.amount.toLocaleString()} {offer.from_currency}
                                </p>
                              </div>
                              <div className="mini-box">
                                <p className="mini-label">Total</p>
                                <p className="mini-value">
                                  {total.toFixed(2)} {offer.to_currency}
                                </p>
                              </div>
                            </div>

                            <div className="small-actions">
                              <button
                                className="btn btn-primary"
                                onClick={() => startEditOffer(offer)}
                                type="button"
                              >
                                Edit
                              </button>
                              <button
                                className="btn btn-danger"
                                onClick={() => deleteOffer(offer.id)}
                                disabled={deletingId === offer.id}
                                type="button"
                              >
                                {deletingId === offer.id ? "Deleting..." : "Delete"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="card">
                <h2 className="card-title">Start listing your exchange offers</h2>
                <p className="card-subtitle">
                  Create an account or log in to post your own FX listings, manage rates,
                  and reach buyers directly.
                </p>
                <div className="top-space">
                  <button
                    className="btn btn-primary"
                    onClick={() => setActiveTab("home")}
                    type="button"
                  >
                    Go to Login / Sign Up
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "contacts" && (
          <div className="stack">
            {session ? (
              <div className="card">
                <div className="section-row">
                  <div>
                    <h2 className="card-title">Unlocked Contacts</h2>
                    <p className="card-subtitle">
                      Sellers whose details you have already unlocked.
                    </p>
                  </div>
                  <span className="badge info">
                    Credits: {Number(profile?.coins || 0)}
                  </span>
                </div>

                {unlockedOffers.length === 0 ? (
                  <div className="empty-state">
                    You have not unlocked any contacts yet. Browse the marketplace and unlock sellers to see them here.
                  </div>
                ) : (
                  <div className="stack">
                    {unlockedOffers.map((offer) => {
                      const message = encodeURIComponent(
                        `Hi ${offer.name}, I'm interested in your ${offer.from_currency} to ${offer.to_currency} offer on P2P FX Marketplace.`
                      );

                      const total = calculateConvertedAmount(
                        offer.amount,
                        offer.rate,
                        offer.from_currency,
                        offer.to_currency
                      );

                      return (
                        <div className="offer-card" key={offer.id}>
                          <div className="offer-head">
                            <p className="offer-name">{offer.name}</p>
                            <span className="badge info">
                              {offer.from_currency} → {offer.to_currency}
                            </span>
                          </div>

                          <div className="offer-grid">
                            <div className="mini-box">
                              <p className="mini-label">Amount</p>
                              <p className="mini-value">
                                {offer.amount.toLocaleString()} {offer.from_currency}
                              </p>
                            </div>
                            <div className="mini-box">
                              <p className="mini-label">Total</p>
                              <p className="mini-value">
                                {total.toFixed(2)} {offer.to_currency}
                              </p>
                            </div>
                            <div className="mini-box">
                              <p className="mini-label">Rate</p>
                              <p className="mini-value">{offer.rate}</p>
                            </div>
                            <div className="mini-box">
                              <p className="mini-label">Phone</p>
                              <p className="mini-value">{offer.phone}</p>
                            </div>
                          </div>

                          <div className="top-space">
                            <a
                              className="btn btn-success"
                              href={`https://wa.me/${String(offer.phone).replace(
                                /\D/g,
                                ""
                              )}?text=${message}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Chat on WhatsApp
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="card">
                <h2 className="card-title">Keep your unlocked contacts in one place</h2>
                <p className="card-subtitle">
                  Log in to view sellers you have already unlocked and continue your
                  conversations from one clean dashboard.
                </p>
                <div className="top-space">
                  <button
                    className="btn btn-primary"
                    onClick={() => setActiveTab("home")}
                    type="button"
                  >
                    Go to Login / Sign Up
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "profile" && (
          <div className="stack">
            {session ? (
              <>
                <div className="card">
                  <h2 className="card-title">Profile</h2>
                  <p className="card-subtitle">
                    Manage your identity, phone number, and available credits.
                  </p>

                  <div className="info-strip top-space">
                    Credits Balance: <strong>{Number(profile?.coins || 0)}</strong>
                    <br />
                    Your phone number is hidden from other users until they unlock your contact.
                  </div>

                  <div className="stack top-space">
                    <div>
                      <p className="label">Name</p>
                      <input
                        className="field"
                        placeholder="Your full name"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                      />
                    </div>

                    <div>
                      <p className="label">Phone</p>
                      <input
                        className="field"
                        placeholder="Phone with country code, e.g. +255712345678"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                      />
                      <p className="card-subtitle">
                        Local number? Just type 07... and the app will convert it.
                      </p>
                    </div>

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

                <div className="card">
                  <h2 className="card-title">Verification Status</h2>
                  <p className="card-subtitle">
                    Not verified yet. Complete verification in the future to build more buyer
                    trust and qualify for a stronger trader profile.
                  </p>
                </div>

                <div className="card">
                  <h2 className="card-title">Trust & Safety</h2>
                  <p className="card-subtitle">
                    Always verify rates, identity, and payment details before exchanging money.
                    This platform connects users, but responsibility remains with participants.
                  </p>
                </div>
              </>
            ) : (
              <div className="card">
                <h2 className="card-title">Create your account profile</h2>
                <p className="card-subtitle">
                  Log in to save your name, phone number, and credits balance, and prepare
                  your account for posting and unlocking contacts.
                </p>
                <div className="top-space">
                  <button
                    className="btn btn-primary"
                    onClick={() => setActiveTab("home")}
                    type="button"
                  >
                    Go to Login / Sign Up
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <nav className="mobile-bottom-nav">
        <button
          className={`mobile-nav-btn ${activeTab === "home" ? "active" : ""}`}
          onClick={() => setActiveTab("home")}
          type="button"
        >
          Home
        </button>
        <button
          className={`mobile-nav-btn ${activeTab === "market" ? "active" : ""}`}
          onClick={() => setActiveTab("market")}
          type="button"
        >
          Market
        </button>

        {session && (
          <>
            <button
              className={`mobile-nav-btn ${activeTab === "listings" ? "active" : ""}`}
              onClick={() => setActiveTab("listings")}
              type="button"
            >
              Listings
            </button>
            <button
              className={`mobile-nav-btn ${activeTab === "contacts" ? "active" : ""}`}
              onClick={() => setActiveTab("contacts")}
              type="button"
            >
              Contacts
            </button>
            <button
              className={`mobile-nav-btn ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => setActiveTab("profile")}
              type="button"
            >
              Profile
            </button>
          </>
        )}
      </nav>
    </main>
  );
}
