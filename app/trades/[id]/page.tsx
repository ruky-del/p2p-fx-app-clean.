"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { FiHome, FiTrendingUp, FiUser } from "react-icons/fi";
import { supabase } from "@/lib/supabase";

export default function TradeRoomPage() {
  const params = useParams();
  const tradeId = params?.id as string;

  const [trade, setTrade] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [proofUrl, setProofUrl] = useState("");
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "warn" | "info">("info");

  const loadTrade = async () => {
    if (!tradeId) return;

    try {
      const { data, error } = await supabase
        .from("exchange_requests")
        .select("*")
        .eq("id", tradeId)
        .single();

      if (error) {
        setMessage(error.message || "Could not load trade.");
        setMessageType("warn");
        return;
      }

      setTrade(data);
    } catch (error) {
      console.error("loadTrade error:", error);
      setMessage("Something went wrong while loading this trade.");
      setMessageType("warn");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrade();
  }, [tradeId]);

  const addEvent = async (action: string) => {
    if (!tradeId) return;

    try {
      await supabase.from("exchange_request_events").insert({
        request_id: tradeId,
        action,
      });
    } catch (error) {
      console.error("event insert error:", error);
    }
  };

  const acceptTrade = async () => {
    try {
      setWorking(true);

      const { error } = await supabase
        .from("exchange_requests")
        .update({
          status: "accepted",
          payment_step: "awaiting_payment",
          accepted_at: new Date().toISOString(),
        })
        .eq("id", tradeId);

      if (error) {
        setMessage(error.message || "Could not accept trade.");
        setMessageType("warn");
        return;
      }

      await addEvent("accepted");
      setMessage("Trade accepted successfully.");
      setMessageType("success");
      await loadTrade();
    } catch (error) {
      console.error("acceptTrade error:", error);
      setMessage("Something went wrong.");
      setMessageType("warn");
    } finally {
      setWorking(false);
    }
  };

  const submitProof = async () => {
    if (!proofUrl.trim()) {
      setMessage("Please enter proof link first.");
      setMessageType("warn");
      return;
    }

    try {
      setWorking(true);

      const { error } = await supabase
        .from("exchange_requests")
        .update({
          proof_url: proofUrl.trim(),
          status: "paid",
          payment_step: "proof_submitted",
        })
        .eq("id", tradeId);

      if (error) {
        setMessage(error.message || "Could not submit proof.");
        setMessageType("warn");
        return;
      }

      await addEvent("proof_submitted");
      setMessage("Payment proof submitted successfully.");
      setMessageType("success");
      setProofUrl("");
      await loadTrade();
    } catch (error) {
      console.error("submitProof error:", error);
      setMessage("Something went wrong.");
      setMessageType("warn");
    } finally {
      setWorking(false);
    }
  };

  const confirmTrade = async () => {
    try {
      setWorking(true);

      const { error } = await supabase
        .from("exchange_requests")
        .update({
          status: "completed",
          payment_step: "completed",
        })
        .eq("id", tradeId);

      if (error) {
        setMessage(error.message || "Could not complete trade.");
        setMessageType("warn");
        return;
      }

      await addEvent("completed");
      setMessage("Trade completed successfully.");
      setMessageType("success");
      await loadTrade();
    } catch (error) {
      console.error("confirmTrade error:", error);
      setMessage("Something went wrong.");
      setMessageType("warn");
    } finally {
      setWorking(false);
    }
  };

  const statusText = useMemo(() => {
    if (!trade?.status) return "--";

    switch (trade.status) {
      case "pending":
        return "Pending Acceptance";
      case "accepted":
        return "Accepted";
      case "paid":
        return "Proof Submitted";
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      case "expired":
        return "Expired";
      default:
        return trade.status;
    }
  }, [trade]);

  if (loading) {
    return (
      <main className="page">
        <div className="container">
          <div className="card">
            <h1 className="card-title">Loading Trade...</h1>
            <p className="card-subtitle">Please wait while we load the trade room.</p>
          </div>
        </div>
      </main>
    );
  }

  if (!trade) {
    return (
      <main className="page">
        <div className="container">
          <div className="card">
            <h1 className="card-title">Trade Not Found</h1>
            <p className="card-subtitle">We could not find this exchange request.</p>
          </div>
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
          <h1 className="card-title">Trade Room</h1>
          <p className="card-subtitle">Track and complete this exchange safely.</p>

          <div className="stack top-space">
            <div className="helper-text">
              Status: <strong>{statusText}</strong>
            </div>

            <div className="helper-text">
              You send: {trade.send_amount} {trade.send_currency}
            </div>

            <div className="helper-text">
              You receive: {trade.receive_amount} {trade.receive_currency}
            </div>

            <div className="helper-text">
              Rate used: {trade.rate_used || "--"}
            </div>

            {trade.trade_label ? (
              <div className="helper-text">Trade type: {trade.trade_label}</div>
            ) : null}
          </div>
        </div>

        <div className="card top-space">
          <h2 className="card-title">Trader Details</h2>

          <div className="stack top-space">
            <div className="helper-text">Customer: {trade.full_name || "Unknown"}</div>
            <div className="helper-text">Phone: {trade.phone || "--"}</div>
            <div className="helper-text">
              Notes: {trade.notes?.trim() ? trade.notes : "No notes added."}
            </div>
          </div>
        </div>

        {trade.status === "pending" && (
          <div className="card top-space">
            <h2 className="card-title">Accept Trade</h2>
            <p className="card-subtitle">
              Accept this trade to move it to the payment stage.
            </p>

            <div className="top-space">
              <button
                className="btn btn-primary"
                type="button"
                onClick={acceptTrade}
                disabled={working}
              >
                {working ? "Please wait..." : "Accept Trade"}
              </button>
            </div>
          </div>
        )}

        {trade.status === "accepted" && (
          <div className="card top-space">
            <h2 className="card-title">Submit Payment Proof</h2>
            <p className="card-subtitle">
              After payment is sent, paste proof link or receipt link below.
            </p>

            <div className="form-stack top-space">
              <label className="input-label">
                Proof link
                <input
                  className="input"
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  placeholder="Paste proof URL or receipt link"
                />
              </label>

              <button
                className="btn btn-primary"
                type="button"
                onClick={submitProof}
                disabled={working}
              >
                {working ? "Submitting..." : "Submit Proof"}
              </button>
            </div>
          </div>
        )}

        {trade.proof_url ? (
          <div className="card top-space">
            <h2 className="card-title">Submitted Proof</h2>
            <p className="card-subtitle">Payment proof has been attached to this trade.</p>

            <div className="top-space">
              <a
                href={trade.proof_url}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline"
                style={{ textAlign: "center", display: "inline-block" }}
              >
                Open Proof
              </a>
            </div>
          </div>
        ) : null}

        {trade.status === "paid" && (
          <div className="card top-space">
            <h2 className="card-title">Confirm Completion</h2>
            <p className="card-subtitle">
              Once payment is verified and both sides are satisfied, complete the trade.
            </p>

            <div className="top-space">
              <button
                className="btn btn-primary"
                type="button"
                onClick={confirmTrade}
                disabled={working}
              >
                {working ? "Please wait..." : "Confirm & Complete"}
              </button>
            </div>
          </div>
        )}

        {trade.status === "completed" && (
          <div className="card top-space message-success">
            <h2 className="card-title">Trade Completed</h2>
            <p className="card-subtitle">
              This exchange request has been completed successfully.
            </p>
          </div>
        )}

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
      </div>
    </main>
  );
}