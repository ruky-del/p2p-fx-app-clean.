"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { supabase } from "../lib/supabaseClient";

export default function Home() {
  const [user, setUser] = useState<any>(null);

  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");

  const [rate, setRate] = useState("");
  const [amount, setAmount] = useState("");
  const [fromCurrency, setFromCurrency] = useState("TZS");
  const [toCurrency, setToCurrency] = useState("GBP");

  const [offers, setOffers] = useState<any[]>([]);

  useEffect(() => {
    getUser();
    fetchOffers();
  }, []);

  const getUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      setUser(data.user);
      loadProfile(data.user.id);
    }
  };

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) {
      setProfileName(data.name || "");
      setProfilePhone(data.phone || "");
    }
  };

  const saveProfile = async () => {
    if (!user) return;

    await supabase.from("profiles").upsert({
      id: user.id,
      name: profileName,
      phone: profilePhone,
    });

    toast.success("Profile saved");
  };

  const fetchOffers = async () => {
    const { data } = await supabase.from("offers").select("*");
    setOffers(data || []);
  };

  const createOffer = async () => {
    if (!profileName || !profilePhone) {
      toast.error("Save profile first");
      return;
    }

    await supabase.from("offers").insert({
      name: profileName,
      phone: profilePhone,
      rate: Number(rate),
      amount: Number(amount),
      from_currency: fromCurrency,
      to_currency: toCurrency,
    });

    toast.success("Offer posted");
    fetchOffers();
  };

  const calculate = () => {
    if (!rate || !amount) return 0;

    if (fromCurrency === "TZS" && toCurrency === "GBP") {
      return Number(amount) / Number(rate);
    }

    if (fromCurrency === "GBP" && toCurrency === "TZS") {
      return Number(amount) * Number(rate);
    }

    return 0;
  };

  return (
    <div className="p-6">

      <h1 className="text-2xl font-bold mb-4">P2P FX Marketplace</h1>

      {/* PROFILE */}
      <div className="border p-4 mb-6 rounded">
        <h2 className="font-bold mb-2">Your Profile</h2>

        <input
          placeholder="Name"
          value={profileName}
          onChange={(e) => setProfileName(e.target.value)}
          className="border p-2 w-full mb-2"
        />

        <input
          placeholder="Phone"
          value={profilePhone}
          onChange={(e) => setProfilePhone(e.target.value)}
          className="border p-2 w-full mb-2"
        />

        <button onClick={saveProfile} className="bg-blue-500 text-white p-2 rounded">
          Save Profile
        </button>
      </div>

      {/* POST OFFER */}
      <div className="border p-4 mb-6 rounded">
        <h2 className="font-bold mb-2">Post Offer</h2>

        <select value={fromCurrency} onChange={(e) => setFromCurrency(e.target.value)}>
          <option>TZS</option>
          <option>GBP</option>
        </select>

        <select value={toCurrency} onChange={(e) => setToCurrency(e.target.value)}>
          <option>GBP</option>
          <option>TZS</option>
        </select>

        <input
          placeholder="Rate"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          className="border p-2 w-full mt-2"
        />

        <input
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="border p-2 w-full mt-2"
        />

        <p className="mt-2">
          Result: {calculate().toFixed(2)} {toCurrency}
        </p>

        <button onClick={createOffer} className="bg-green-500 text-white p-2 rounded mt-2">
          Post Offer
        </button>
      </div>

      {/* MARKET */}
      <div>
        <h2 className="font-bold mb-2">Marketplace</h2>

        {offers.map((o, i) => (
          <div key={i} className="border p-3 mb-2 rounded">
            <p><b>{o.name}</b></p>
            <p>{o.amount} {o.from_currency}</p>
            <p>Rate: {o.rate}</p>

            <a
              href={`https://wa.me/${o.phone}`}
              target="_blank"
              className="bg-green-600 text-white px-3 py-1 rounded inline-block mt-2"
            >
              Contact Seller
            </a>
          </div>
        ))}
      </div>

    </div>
  );
}
