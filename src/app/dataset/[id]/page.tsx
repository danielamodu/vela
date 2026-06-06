"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import type { DatasetOnChain } from "@/lib/contract";
import type { DatasetCard } from "@/lib/groq";
import { ChatTerminal } from "@/components/ChatTerminal";

// ===== Sub-components =====

function QualityScoreGauge({ score }: { score: number }) {
  const radius = 54;
  const strokeWidth = 8;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = 2 * Math.PI * normalizedRadius;
  const progress = (score / 10) * circumference;

  const color =
    score >= 8 ? "#10B981" :
    score >= 6 ? "#F59E0B" :
    "#EF4444";

  const label =
    score >= 8 ? "Excellent" :
    score >= 6 ? "Good" :
    score >= 4 ? "Fair" :
    "Poor";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
      <div style={{ position: "relative", width: 120, height: 120 }}>
        <svg width="120" height="120" style={{ transform: "rotate(-90deg)" }}>
          <circle
            cx="60" cy="60" r={normalizedRadius}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx="60" cy="60" r={normalizedRadius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s ease, stroke 0.3s ease" }}
          />
        </svg>
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "2px",
        }}>
          <span style={{
            fontSize: "28px",
            fontWeight: 800,
            fontFamily: "var(--font-heading)",
            color,
          }}>
            {score}
          </span>
          <span style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.06em" }}>
            / 10
          </span>
        </div>
      </div>
      <span style={{
        fontSize: "12px",
        fontWeight: 600,
        color,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
      }}>
        {label}
      </span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <span style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {label}
      </span>
      <span style={{ fontSize: "13px", color: "var(--text-high)", fontFamily: "var(--font-body)", wordBreak: "break-all" }}>
        {value}
      </span>
    </div>
  );
}

function TagList({ tags, color = "var(--text-low)" }: { tags: string[]; color?: string }) {
  if (!tags || tags.length === 0) return <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>None reported</span>;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
      {tags.map((tag) => (
        <span key={tag} style={{
          padding: "4px 10px",
          background: "var(--elevated)",
          border: "1px solid var(--border)",
          borderRadius: "100px",
          fontSize: "12px",
          color,
        }}>
          {tag}
        </span>
      ))}
    </div>
  );
}

// ===== Main page =====

export default function DatasetDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();

  const [dataset, setDataset] = useState<DatasetOnChain | null>(null);
  const [trustScore, setTrustScore] = useState<number | null>(null);
  const [card, setCard] = useState<DatasetCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [txState, setTxState] = useState<"idle" | "awaiting_signature" | "confirming_on_chain">("idle");
  const [subscribeError, setSubscribeError] = useState<string>("");
  const [subscribeSuccess, setSubscribeSuccess] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string>("");

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        setLoading(true);
        // Fetch dataset object
        const dsRes = await fetch(`/api/datasets/${id}`);
        if (!dsRes.ok) throw new Error("Dataset not found");
        const { dataset: ds, trustScore: ts } = await dsRes.json() as { dataset: DatasetOnChain; trustScore: number };
        setDataset(ds);
        setTrustScore(ts);

        // Fetch dataset card
        if (ds?.card_blob_id) {
          const cardRes = await fetch(`/api/walrus/fetch?blobId=${ds.card_blob_id}`);
          if (cardRes.ok) {
            const { content } = await cardRes.json() as { content: string };
            setCard(JSON.parse(content) as DatasetCard);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleSubscribe = async () => {
    if (!account || !dataset) return;

    console.log("=== DOWNLOAD HANDLER DEBUG ===");
    console.log("Connected Wallet:", account.address);
    console.log("Dataset Owner:", dataset.owner);
    console.log("Price (MIST):", dataset.price_mist);
    console.log("Subscribers Array:", dataset.subscribers);

    const isFree = dataset.price_mist === "0";
    const isAlreadySubscribed =
      subscribeSuccess ||
      (account && dataset.subscribers?.includes(account.address)) ||
      dataset.owner === account.address;

    console.log("Evaluated -> isFree:", isFree, " | isAlreadySubscribed:", isAlreadySubscribed);
    console.log("==============================");

    if (isFree || isAlreadySubscribed) {
      await downloadRawBlob();
      return;
    }

    setTxState("awaiting_signature");
    setSubscribeError("");

    try {
      // Get a SUI coin from the user's wallet
      const coins = await suiClient.getCoins({ owner: account.address, coinType: "0x2::sui::SUI" });
      const coin = coins.data?.[0];
      if (!coin) throw new Error("No SUI coins found in wallet");

      // Build subscribe transaction
      const txRes = await fetch("/api/contract/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          datasetId: dataset.id,
          priceMist: dataset.price_mist,
          senderAddress: account.address,
          coinObjectId: coin.coinObjectId,
        }),
      });

      if (!txRes.ok) throw new Error("Failed to build subscription transaction");
      const { txBytes } = await txRes.json() as { txBytes: string };

      setTxState("confirming_on_chain");
      // dapp-kit accepts base64 string txBytes directly
      const txResult = await signAndExecute({ transaction: txBytes });

      // Wait for the transaction to be confirmed on-chain
      await suiClient.waitForTransaction({ digest: txResult.digest });

      setSubscribeSuccess(true);

      // Now download the raw blob
      await downloadRawBlob();
    } catch (err) {
      setSubscribeError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setTxState("idle");
    }
  };

  const downloadRawBlob = async () => {
    if (!dataset) return;
    setDownloading(true);
    setDownloadError("");
    try {
      const res = await fetch(`/api/walrus/fetch?blobId=${dataset.blob_id}`);
      if (!res.ok) throw new Error("Failed to fetch raw data");
      const { content } = await res.json() as { content: string };
      
      // Calculate SHA-256 hash of the downloaded content
      const encoder = new TextEncoder();
      const arrayBuffer = encoder.encode(content);
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const fileHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Verify against on-chain hash
      // Use fallback if file_hash is not present (for old datasets)
      if (dataset.file_hash && fileHash !== dataset.file_hash) {
         throw new Error("Data corruption detected: File hash does not match on-chain record.");
      }

      const blob = new Blob([content], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${dataset.name || "dataset"}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      setDownloadError(err instanceof Error ? err.message : "Download failed due to an unknown error.");
    } finally {
      setDownloading(false);
    }
  };

  const isFree = dataset?.price_mist === "0";
  const isSubscribed =
    subscribeSuccess ||
    (account && dataset?.subscribers?.includes(account.address)) ||
    dataset?.owner === account?.address;

  const formatPrice = (mist: string) => {
    const val = Number(mist) / 1e9;
    return val === 0 ? "Free" : `${val.toFixed(2)} SUI`;
  };

  const formatDate = (ts: string) => {
    const n = Number(ts);
    if (!n) return "Unknown";
    return new Date(n).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const truncate = (addr: string) =>
    addr ? `${addr.slice(0, 8)}…${addr.slice(-6)}` : "";

  if (loading) {
    return (
      <main>
        <div className="container" style={{ paddingTop: "40px", paddingBottom: "80px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }} className="responsive-grid-2">
            {[1, 2].map((i) => (
              <div key={i} className="card" style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "20px" }}>
                <div className="skeleton" style={{ height: "32px", width: "60%" }} />
                <div className="skeleton" style={{ height: "16px", width: "90%" }} />
                <div className="skeleton" style={{ height: "16px", width: "70%" }} />
                <div className="skeleton" style={{ height: "120px" }} />
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (!dataset) {
    return (
      <main>
        <div className="container" style={{ paddingTop: "80px", textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
          <h2 style={{ fontFamily: "var(--font-heading)", marginBottom: "12px" }}>Dataset Not Found</h2>
          <p style={{ color: "var(--text-low)", marginBottom: "24px" }}>
            This dataset ID doesn&apos;t exist or hasn&apos;t been indexed yet.
          </p>
          <button onClick={() => router.push("/")} className="btn btn-secondary">
            ← Browse All Datasets
          </button>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="container" style={{ paddingTop: "40px", paddingBottom: "80px" }}>
        {/* Back nav */}
        <button
          onClick={() => router.push("/")}
          className="btn btn-ghost"
          style={{ marginBottom: "24px", paddingLeft: 0 }}
        >
          ← Back to Browse
        </button>

        <div style={styles.layout} className="responsive-grid-2">
          {/* LEFT COLUMN: Dataset info + Subscribe CTA */}
          <div style={styles.leftCol}>
            {/* Header */}
            <div style={styles.leftHeader}>
              <div style={styles.categoryBadge}>
                {dataset.category?.toUpperCase() || "OTHER"}
              </div>
              <h1 style={styles.datasetTitle}>{dataset.name}</h1>
              <p style={styles.datasetDesc}>{dataset.description}</p>
            </div>

            {/* Key info */}
            <div className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <InfoRow label="Dataset ID" value={truncate(dataset.id)} />
              <div style={{ height: "1px", background: "var(--border)" }} />
              <InfoRow label="Owner" value={<Link href={`/profile/${dataset.owner}`} className="link-affordance" style={{ textDecoration: "none" }}>{truncate(dataset.owner)}</Link>} />
              <div style={{ height: "1px", background: "var(--border)" }} />
              <InfoRow label="Published" value={formatDate(dataset.timestamp)} />
              <div style={{ height: "1px", background: "var(--border)" }} />
              <InfoRow label="Blob ID" value={truncate(dataset.blob_id)} />
              <div style={{ height: "1px", background: "var(--border)" }} />
              <InfoRow label="Subscribers" value={String(dataset.subscribers?.length ?? 0)} />
            </div>

            {/* Subscribe CTA */}
            <div className="card" style={{ padding: "24px" }}>
              <div style={styles.pricingRow}>
                <div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Access Price
                  </div>
                  <div style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "28px",
                    fontWeight: 800,
                    color: isFree ? "#10B981" : "var(--accent)",
                  }}>
                    {formatPrice(dataset.price_mist)}
                  </div>
                </div>

                {card?.quality_score && (
                  <QualityScoreGauge score={card.quality_score} />
                )}
              </div>

              {subscribeSuccess && (
                <div style={styles.successBanner}>
                  ✅ Subscribed! Access granted.
                </div>
              )}

              {subscribeError && (
                <div style={styles.errorBanner}>
                  ⚠️ {subscribeError}
                </div>
              )}

              {downloadError && (
                <div style={styles.errorBanner}>
                  ⚠️ {downloadError}
                </div>
              )}

              {!account ? (
                <button
                  className="btn btn-secondary"
                  style={{ width: "100%", justifyContent: "center", padding: "14px" }}
                  disabled
                >
                  Connect Wallet to Download
                </button>
              ) : (
                <button
                  onClick={handleSubscribe}
                  className="btn btn-primary"
                  style={{ width: "100%", justifyContent: "center", padding: "14px" }}
                  disabled={txState !== "idle" || downloading}
                >
                  {txState === "awaiting_signature" ? (
                    <><div className="spinner" style={{ borderTopColor: "#0C0C0F" }} /> Awaiting Signature...</>
                  ) : txState === "confirming_on_chain" ? (
                    <><div className="spinner" style={{ borderTopColor: "#0C0C0F" }} /> Confirming on Chain...</>
                  ) : downloading ? (
                    <><div className="spinner" style={{ borderTopColor: "#0C0C0F" }} /> Fetching Dataset...</>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {(!isFree && !isSubscribed) ? `Pay ${formatPrice(dataset.price_mist)} & Download` : "Download Dataset"}
                    </>
                  )}
                </button>
              )}

              <p style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "center", marginTop: "12px" }}>
                Payment goes directly to the publisher&apos;s wallet on Sui testnet.
              </p>
            </div>

            {/* Chat Terminal */}
            <ChatTerminal blobId={dataset.blob_id} />
          </div>

          {/* RIGHT COLUMN: AI Dataset Card */}
          <div style={styles.rightCol}>
            <div style={styles.cardHeader}>
              <span style={styles.cardBadge}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ display: "inline", marginRight: "5px" }}>
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/>
                </svg>
                AI Dataset Card
              </span>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                {trustScore !== null && (
                  <div style={{ fontSize: "11px", fontWeight: 600, color: trustScore >= 70 ? "#10B981" : trustScore >= 40 ? "#F59E0B" : "#EF4444", display: "flex", alignItems: "center", gap: "4px" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    Trust Score {trustScore}
                  </div>
                )}
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Generated by Claude</span>
              </div>
            </div>

            {card ? (
              <div style={styles.cardSections}>
                {/* Summary */}
                <section className="card-elevated" style={styles.section}>
                  <h3 style={styles.sectionTitle}>Summary</h3>
                  <p style={styles.sectionText}>{card.summary}</p>
                </section>

                {/* Type + Row Count */}
                <section className="card-elevated responsive-grid-2" style={{ ...styles.section, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <div style={styles.metaLabel}>Data Type</div>
                    <div style={styles.metaValue}>{card.data_type?.toUpperCase()}</div>
                  </div>
                  <div>
                    <div style={styles.metaLabel}>Row Count (Est.)</div>
                    <div style={styles.metaValue}>{card.row_count_estimate?.toLocaleString()}</div>
                  </div>
                </section>

                {/* Features */}
                <section className="card-elevated" style={styles.section}>
                  <h3 style={styles.sectionTitle}>Features / Columns</h3>
                  <TagList tags={card.features ?? []} color="var(--text-high)" />
                </section>

                {/* Use Cases */}
                <section className="card-elevated" style={styles.section}>
                  <h3 style={styles.sectionTitle}>Use Cases</h3>
                  <TagList tags={card.use_cases ?? []} color="#34D399" />
                </section>

                {/* Bias Warnings */}
                <section className="card-elevated" style={styles.section}>
                  <h3 style={styles.sectionTitle}>
                    <span style={{ marginRight: "6px" }}>⚠️</span>Bias Warnings
                  </h3>
                  <TagList
                    tags={card.bias_warnings ?? []}
                    color={card.bias_warnings?.length ? "#FCA5A5" : "var(--text-muted)"}
                  />
                </section>

                {/* Recommended Models */}
                <section className="card-elevated" style={styles.section}>
                  <h3 style={styles.sectionTitle}>Recommended Models</h3>
                  <TagList tags={card.recommended_models ?? []} color="#818CF8" />
                </section>

                {/* Blob ID reference */}
                <div style={styles.blobIdRow}>
                  <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>Card Blob ID:</span>
                  <code style={{ fontSize: "11px", color: "var(--text-low)", wordBreak: "break-all" }}>
                    {dataset.card_blob_id}
                  </code>
                </div>
              </div>
            ) : (
              <div style={styles.noCard}>
                <div style={{ fontSize: "32px", marginBottom: "12px" }}>📋</div>
                <p style={{ color: "var(--text-low)", fontSize: "13px" }}>
                  Dataset card not yet available or still being generated.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  layout: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "32px",
    alignItems: "start",
  },
  leftCol: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  leftHeader: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  categoryBadge: {
    display: "inline-block",
    padding: "4px 12px",
    background: "var(--accent-dim)",
    color: "var(--accent)",
    border: "1px solid rgba(245,158,11,0.3)",
    borderRadius: "100px",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    width: "fit-content",
  },
  datasetTitle: {
    fontFamily: "var(--font-heading)",
    fontSize: "clamp(22px, 3vw, 32px)",
    fontWeight: 800,
    letterSpacing: "-0.02em",
    lineHeight: 1.2,
  },
  datasetDesc: {
    color: "var(--text-low)",
    fontSize: "14px",
    lineHeight: 1.7,
  },
  pricingRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "20px",
  },
  successBanner: {
    padding: "12px 16px",
    background: "rgba(16,185,129,0.1)",
    border: "1px solid rgba(16,185,129,0.25)",
    borderRadius: "var(--r-md)",
    color: "#6EE7B7",
    fontSize: "13px",
    marginBottom: "16px",
  },
  errorBanner: {
    padding: "12px 16px",
    background: "rgba(239,68,68,0.08)",
    border: "1px solid rgba(239,68,68,0.2)",
    borderRadius: "var(--r-md)",
    color: "#FCA5A5",
    fontSize: "13px",
    marginBottom: "16px",
  },
  rightCol: {
    position: "sticky",
    top: "80px",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "16px",
  },
  cardBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "5px 12px",
    background: "var(--accent-dim)",
    color: "var(--accent)",
    border: "1px solid rgba(245,158,11,0.25)",
    borderRadius: "100px",
    fontSize: "12px",
    fontWeight: 600,
  },
  cardSections: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  section: {
    padding: "16px 20px",
  },
  sectionTitle: {
    fontFamily: "var(--font-heading)",
    fontSize: "13px",
    fontWeight: 700,
    color: "var(--text-high)",
    marginBottom: "10px",
    letterSpacing: "0.01em",
  },
  sectionText: {
    fontSize: "13px",
    color: "var(--text-low)",
    lineHeight: 1.7,
  },
  metaLabel: {
    fontSize: "10px",
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: "6px",
    fontWeight: 600,
  },
  metaValue: {
    fontFamily: "var(--font-heading)",
    fontSize: "16px",
    fontWeight: 700,
    color: "var(--text-high)",
  },
  blobIdRow: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    padding: "12px 16px",
    background: "var(--elevated)",
    borderRadius: "var(--r-md)",
    border: "1px solid var(--border)",
  },
  noCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 24px",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--r-lg)",
    textAlign: "center",
  },
};
