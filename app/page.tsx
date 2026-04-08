"use client";

import Link from "next/link";
import Image from "next/image";
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

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const syncUser = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const currentUser = session?.user ?? null;
    setUser(currentUser);

    if (currentUser) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .maybeSingle();

      setProfile(data);
    }
  };

  useEffect(() => {
    syncUser();
  }, []);

  return (
    <main className="page">
      <div className="container">

        {/* HERO */}
        <div className="hero-card">
          <div className="eyebrow eyebrow-visible">
            Tanzania ↔ UK Exchange Network
          </div>

          {/* LOGO */}
          <div style={{ marginBottom: "10px" }}>
            <Image
              src="/logo.png"
              alt="Rafiki Exchange"
              width={160}
              height={50}
              priority
            />
          </div>

          <h1>Rafiki Exchange</h1>
          <p className="hero-slogan">Exchange with Rafiki</p>

          <div className="hero-copy-box">
            <p>
              A trusted peer-to-peer platform connecting people who need to
              exchange money between Tanzania and the UK — without bank limits,
              delays, or unnecessary restrictions.
            </p>

            <p>
              Built to solve real problems: sending large amounts, avoiding
              banking issues, and finding reliable exchange partners in one
              secure place.
            </p>

            <p className="hero-small">
              Always verify before exchanging. Users remain responsible for
              transactions.
            </p>
          </div>

          {/* STATS */}
          <div className="stats-grid">
            <Link href="/market" className="stat-box">
              <span>Live Offers</span>
              <strong>4</strong>
            </Link>

            <Link href="/market" className="stat-box">
              <span>My Listings</span>
              <strong>{user ? 3 : 0}</strong>
            </Link>

            <Link href="/profile" className="stat-box">
              <span>Unlocked Contacts</span>
              <strong>{profile?.credits ? 1 : 0}</strong>
            </Link>

            <Link href="/profile" className="stat-box">
              <span>Credits</span>
              <strong>{profile?.credits || 0}</strong>
            </Link>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="card">
          <h2 className="card-title">Choose exchange type</h2>
          <p className="card-subtitle">
            Choose how you want to exchange money with Rafiki.
          </p>

          <div className="stack top-space">
            <Link href="/market" className="btn btn-outline">
              Find Traders (P2P)
            </Link>

            <Link href="/express" className="btn btn-success">
              ⚡ Express Exchange
            </Link>
          </div>
        </div>

        {/* HOW IT WORKS */}
        <div className="card">
          <h2 className="card-title">How it works</h2>

          <div className="section-grid">
            <div className="info-card">
              <h3>1. Browse offers</h3>
              <p>Compare rates and find traders instantly.</p>
            </div>

            <div className="info-card">
              <h3>2. Unlock contacts</h3>
              <p>Use credits to reveal trader details.</p>
            </div>

            <div className="info-card">
              <h3>3. Exchange safely</h3>
              <p>Agree directly and complete securely.</p>
            </div>
          </div>
        </div>

        {/* NAV */}
        <div className="nav">
          <Link href="/" className="active">
            <FiHome />
            <span>Home</span>
          </Link>

          <Link href="/market">
            <FiTrendingUp />
            <span>Market</span>
          </Link>

          <Link href="/profile">
            <FiUser />
            <span>Profile</span>
          </Link>
        </div>

      </div>
    </main>
  );
}