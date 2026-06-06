"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import type { DatasetOnChain } from "@/lib/contract";

interface DatasetCardProps {
  dataset: DatasetOnChain;
  card?: {
    summary?: string;
    quality_score?: number;
    data_type?: string;
  } | null;
  isProfilePage?: boolean;
  isListView?: boolean;
  isFeatured?: boolean;
}

function truncateAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function formatPrice(priceMist: string): string {
  const mist = BigInt(priceMist || "0");
  if (mist === BigInt(0)) return "Free";
  const sui = Number(mist) / 1_000_000_000;
  return `${sui.toFixed(2)} SUI`;
}

export function DatasetCard({ dataset, card, isProfilePage, isListView, isFeatured }: DatasetCardProps) {
  const router = useRouter();
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const qualityScore = card?.quality_score ?? 0;

  const isOwner = account?.address === dataset.owner;
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [newPrice, setNewPrice] = useState(dataset.price_mist ? (Number(dataset.price_mist) / 1_000_000_000).toString() : "0");
  const [txState, setTxState] = useState<"idle" | "awaiting_signature" | "confirming_on_chain">("idle");
  const [updateError, setUpdateError] = useState<string | null>(null);

  const handleOwnerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/profile/${dataset.owner}`);
  };

  const handleCardClick = () => {
    router.push(`/dataset/${dataset.id}`);
  };

  const handleUpdatePrice = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!account) return;
    
    setUpdateError(null);
    const parsed = parseFloat(newPrice);
    if (isNaN(parsed) || parsed < 0) {
      setUpdateError("Invalid price");
      return;
    }

    setTxState("awaiting_signature");
    try {
      const priceMist = Math.round(parsed * 1_000_000_000);
      const txRes = await fetch("/api/contract/update-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          datasetId: dataset.id,
          newPriceMist: priceMist,
          senderAddress: account.address,
        }),
      });
      if (!txRes.ok) throw new Error("Failed to build tx");
      const { txBytes } = await txRes.json() as { txBytes: string };
      
      setTxState("confirming_on_chain");
      await signAndExecute({ transaction: txBytes });
      setIsEditingPrice(false);
    } catch (err) {
      console.error(err);
      setUpdateError("Update failed");
    } finally {
      setTxState("idle");
    }
  };

  return (
    <div
      onClick={handleCardClick}
      style={isListView ? { ...styles.card, padding: "16px 24px", cursor: "pointer" } : isFeatured ? { ...styles.card, padding: "32px", minHeight: "300px", cursor: "pointer" } : { ...styles.card, cursor: "pointer" }}
      className="card"
    >
      {/* Top bar */}
      <div style={isListView ? { ...styles.topBar, marginBottom: "0", minWidth: "180px" } : styles.topBar}>
        <span style={styles.monoLabel}>
          {dataset.category || "other"}
        </span>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {isOwner && isEditingPrice ? (
            <div style={{ display: "flex", gap: "4px", alignItems: "center" }} onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
              <input 
                type="number" 
                value={newPrice} 
                onChange={e => setNewPrice(e.target.value)}
                onClick={e => e.stopPropagation()}
                style={{ width: "60px", padding: "2px 4px", fontSize: "12px", fontFamily: "var(--font-suisseintlmono)", border: updateError ? "1px solid red" : "1px solid var(--color-steel-gray)" }}
                min="0" step="0.001"
              />
              <button 
                onClick={handleUpdatePrice} 
                disabled={txState !== "idle"}
                style={{ fontSize: "12px", padding: "2px 6px", cursor: "pointer", color: "var(--color-ink-black)" }}
              >
                {txState === "awaiting_signature" ? "Signing..." : txState === "confirming_on_chain" ? "Confirming..." : "Save"}
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsEditingPrice(false); setUpdateError(null); }}
                style={{ fontSize: "12px", padding: "2px 6px", cursor: "pointer", color: "var(--color-graphite)" }}
              >
                Cancel
              </button>
              {updateError && <span style={{ fontSize: "10px", color: "red" }}>{updateError}</span>}
            </div>
          ) : (
            <span style={{...styles.monoLabel, color: "var(--color-ink-black)", display: "flex", alignItems: "center", gap: "6px"}} title="1 SUI = 1,000,000,000 MIST (Gas token for Sui network)">
              {formatPrice(dataset.price_mist)}
              {isOwner && (
                <button 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsEditingPrice(true); }}
                  style={{ background: "none", border: "none", color: "var(--color-graphite)", cursor: "pointer", textDecoration: "underline", fontSize: "10px" }}
                >
                  Edit
                </button>
              )}
            </span>
          )}
        </div>
      </div>

      {/* Name */}
      <div style={isListView ? { flex: 1, display: "flex", alignItems: "center", gap: "16px", minWidth: "0" } : {}}>
        <h3 style={isListView ? { ...styles.name, marginBottom: "0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } : isFeatured ? { ...styles.name, fontSize: "var(--text-heading)", marginBottom: "16px" } : styles.name}>
          {dataset.name || "Untitled Dataset"}
        </h3>

        {/* Summary */}
        {card?.summary && (
          <p style={isListView ? { ...styles.summary, marginBottom: "0", WebkitLineClamp: 1, flex: 1 } : isFeatured ? { ...styles.summary, fontSize: "var(--text-subheading)", marginBottom: "32px" } : styles.summary}>
            {card.summary}
          </p>
        )}
      </div>

      {/* Footer */}
      <div style={isListView ? { ...styles.footer, paddingTop: "0", borderTop: "none", marginTop: "0", minWidth: "200px" } : styles.footer}>
        <div style={styles.ownerText} onClick={handleOwnerClick} className="link-affordance" title="View Profile">
          {truncateAddress(dataset.owner)}
        </div>

        {isOwner && isProfilePage ? (
          <div style={styles.qualityScore}>
            {dataset.subscribers?.length || 0} Subscribers
          </div>
        ) : qualityScore > 0 ? (
          <div style={styles.qualityScore}>
            Score: {qualityScore}
          </div>
        ) : null}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    display: "flex",
    flexDirection: "column",
    position: "relative",
    padding: "var(--spacing-24)",
    textDecoration: "none",
    border: "none",
    height: "100%",
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "16px",
  },
  monoLabel: {
    fontFamily: "var(--font-suisseintlmono)",
    fontWeight: 400,
    fontSize: "var(--text-caption)",
    letterSpacing: "var(--tracking-caption)",
    color: "var(--color-graphite)",
    textTransform: "uppercase",
  },
  name: {
    fontFamily: "var(--font-suisseintl)",
    fontSize: "var(--text-heading-sm)",
    fontWeight: 500,
    color: "var(--color-ink-black)",
    lineHeight: "var(--leading-heading-sm)",
    letterSpacing: "var(--tracking-heading-sm)",
    marginBottom: "12px",
  },
  summary: {
    fontFamily: "var(--font-suisseintl)",
    fontSize: "var(--text-body)",
    color: "var(--color-ink-black)",
    lineHeight: "var(--leading-body)",
    letterSpacing: "var(--tracking-body)",
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    marginBottom: "24px",
    flex: 1,
  },
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "auto",
    paddingTop: "16px",
    borderTop: "1px solid var(--color-surface-mist)",
  },
  ownerText: {
    fontFamily: "var(--font-suisseintlmono)",
    fontSize: "var(--text-caption)",
    letterSpacing: "var(--tracking-caption)",
    cursor: "pointer",
  },
  qualityScore: {
    fontFamily: "var(--font-suisseintlmono)",
    fontSize: "var(--text-caption)",
    color: "var(--color-ink-black)",
    letterSpacing: "var(--tracking-caption)",
    background: "var(--color-surface-mist)",
    padding: "2px 6px",
    borderRadius: "var(--radius-tags)",
  },
};
