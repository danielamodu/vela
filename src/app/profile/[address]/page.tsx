"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { DatasetCard } from "@/components/DatasetCard";
import type { DatasetOnChain } from "@/lib/contract";
import type { DatasetCard as DatasetCardType } from "@/lib/groq";

interface DatasetWithCard {
  dataset: DatasetOnChain;
  card: Partial<DatasetCardType> | null;
}

function SkeletonCard() {
  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: "16px", height: "240px" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div className="skeleton" style={{ height: "16px", width: "40px", borderRadius: "4px" }} />
        <div className="skeleton" style={{ height: "16px", width: "60px", borderRadius: "4px" }} />
      </div>
      <div className="skeleton" style={{ height: "24px", width: "80%" }} />
      <div className="skeleton" style={{ height: "16px", width: "100%", flex: 1 }} />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "auto" }}>
        <div className="skeleton" style={{ height: "14px", width: "80px", borderRadius: "4px" }} />
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const params = useParams();
  const address = params?.address as string;
  const router = useRouter();
  const account = useCurrentAccount();

  const [datasets, setDatasets] = useState<DatasetWithCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isOwner = account?.address === address;

  useEffect(() => {
    if (!address) return;
    
    async function loadDatasets() {
      try {
        setLoading(true);
        // Fetch datasets for this owner
        const idsRes = await fetch(`/api/datasets?owner=${address}`);
        if (!idsRes.ok) throw new Error("Failed to fetch datasets");
        const { datasets: raw } = await idsRes.json() as { datasets: DatasetOnChain[] };

        const userDatasets = raw ?? [];

        // Fetch card data for each in parallel
        const withCards = await Promise.all(
          userDatasets.map(async (dataset: DatasetOnChain) => {
            let card: Partial<DatasetCardType> | null = null;
            try {
              if (dataset.card_blob_id) {
                const cardRes = await fetch(`/api/walrus/fetch?blobId=${dataset.card_blob_id}`);
                if (cardRes.ok) {
                  const { content } = await cardRes.json() as { content: string };
                  card = JSON.parse(content) as Partial<DatasetCardType>;
                }
              }
            } catch {
              // Ignore card fetch error
            }
            return { dataset, card };
          })
        );

        setDatasets(withCards);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load datasets");
      } finally {
        setLoading(false);
      }
    }

    loadDatasets();
  }, [address]);

  // Calculate publisher stats
  const totalDatasets = datasets.length;
  
  let earliestDate = "N/A";
  let totalEarningsSui = 0;

  if (totalDatasets > 0) {
    const sorted = [...datasets].sort((a, b) => Number(a.dataset.timestamp) - Number(b.dataset.timestamp));
    earliestDate = new Date(Number(sorted[0].dataset.timestamp)).toLocaleDateString();

    totalEarningsSui = datasets.reduce((sum, d) => {
      const priceSui = Number(d.dataset.price_mist || "0") / 1_000_000_000;
      const subCount = d.dataset.subscribers?.length || 0;
      return sum + (priceSui * subCount);
    }, 0);
  }

  return (
    <main style={{ minHeight: "100vh", background: "var(--color-canvas-mist)", paddingBottom: "80px" }}>
      <div style={{ maxWidth: "760px", margin: "0 auto", paddingTop: "100px", paddingLeft: "24px", paddingRight: "24px" }}>
        
        <button
          onClick={() => router.back()}
          className="btn btn-ghost"
          style={{ marginBottom: "24px", paddingLeft: 0 }}
        >
          ← Back
        </button>

        {/* Top section: Publisher Info */}
        <section style={{
          background: "var(--color-pure-white)",
          borderRadius: "32px",
          padding: "24px",
          marginBottom: "32px",
          border: "1px solid var(--border)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
            <div>
              <div style={{ fontSize: "10px", color: "var(--color-graphite)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px", fontFamily: "var(--font-suisseintlmono)" }}>
                Publisher Profile
              </div>
              <h1 style={{ fontFamily: "var(--font-suisseintlmono)", fontSize: "12px", color: "#444444", wordBreak: "break-all" }}>
                {address}
              </h1>
            </div>
            {isOwner && (
              <span style={{
                background: "var(--color-sui-blue)",
                color: "var(--color-ink-black)",
                padding: "4px 10px",
                borderRadius: "100px",
                fontSize: "10px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.06em"
              }}>
                This is your profile
              </span>
            )}
          </div>

          <div style={{ display: "flex", gap: "32px", borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
            <div>
              <div style={{ fontSize: "10px", color: "var(--color-graphite)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>
                Total Datasets
              </div>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: "24px", fontWeight: 700 }}>
                {loading ? "-" : totalDatasets}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "10px", color: "var(--color-graphite)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>
                Member Since
              </div>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: "24px", fontWeight: 700 }}>
                {loading ? "-" : earliestDate}
              </div>
            </div>

            {isOwner && (
              <div>
                <div style={{ fontSize: "10px", color: "var(--color-graphite)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>
                  Total Earnings
                </div>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: "24px", fontWeight: 700, color: "var(--color-sui-blue)" }}>
                  {loading ? "-" : `${totalEarningsSui.toFixed(2)} SUI`}
                </div>
              </div>
            )}

          </div>
        </section>

        {/* Bottom section: Published Datasets */}
        <section>
          <h2 style={{
            fontFamily: "var(--font-suisseintlmono)",
            fontSize: "12px",
            color: "#444444",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: "16px",
          }}>
            PUBLISHED DATASETS
          </h2>

          {error && (
            <div style={{ padding: "16px", background: "#ffebee", border: "1px solid #ef5350", color: "#c62828", fontSize: "12px", borderRadius: "8px" }}>
              ERROR: {error}
            </div>
          )}

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "24px"
          }}>
            {loading ? (
              Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)
            ) : datasets.length === 0 ? (
              <div style={{ gridColumn: "1 / -1", padding: "40px", textAlign: "center", background: "var(--color-pure-white)", borderRadius: "16px", border: "1px solid var(--border)" }}>
                <p style={{ color: "var(--color-graphite)", fontSize: "14px" }}>No datasets published yet</p>
              </div>
            ) : (
              datasets.map(({ dataset, card }) => (
                <div key={dataset.id}>
                  <DatasetCard dataset={dataset} card={card} isProfilePage={true} />
                </div>
              ))
            )}
          </div>
        </section>

      </div>
    </main>
  );
}
