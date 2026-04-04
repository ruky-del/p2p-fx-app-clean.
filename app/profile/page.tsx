"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type UserProfile = {
  id: string;
  full_name: string;
  phone: string;
  credits: number;
  email?: string;
};

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        setUser(user);

        if (!user) return;

        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (data) {
          setProfile(data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <main className="page">
      <div className="container">
        <div className="hero-card">
          <div className="eyebrow">Account</div>
          <h1>Profile</h1>
          <p>Manage your identity, contact details and trading credits.</p>
        </div>

        {loading ? (
          <div className="card">
            <h2 className="card-title">Loading...</h2>
            <p className="card-subtitle">Please wait while we fetch your profile.</p>
          </div>
        ) : !user ? (
          <div className="card">
            <h2 className="card-title">Not logged in</h2>
            <p className="card-subtitle">
              Log in first to see your profile details and available credits.
            </p>
          </div>
        ) : (
          <>
            <div className="card">
              <h2 className="card-title">Your details</h2>
              <div className="offer-list top-space">
                <div className="offer-item">
                  <div className="offer-main">
                    <h3>Full name</h3>
                    <p>{profile?.full_name || "Not set yet"}</p>
                  </div>
                </div>

                <div className="offer-item">
                  <div className="offer-main">
                    <h3>Phone number</h3>
                    <p>{profile?.phone || "Not set yet"}</p>
                  </div>
                </div>

                <div className="offer-item">
                  <div className="offer-main">
                    <h3>Email</h3>
                    <p>{profile?.email || user.email}</p>
                  </div>
                </div>

                <div className="offer-item">
                  <div className="offer-main">
                    <h3>Credits</h3>
                    <p>{profile?.credits || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="card-title">What credits do</h2>
              <p className="card-subtitle">
                Credits help you unlock seller or buyer contact details quickly and continue trading.
              </p>
            </div>
          </>
        )}

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
