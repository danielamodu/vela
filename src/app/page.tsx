"use client";

import { useState, useEffect, useMemo } from "react";
import { DatasetCard } from "@/components/DatasetCard";
import type { DatasetOnChain } from "@/lib/contract";
import type { DatasetCard as DatasetCardType } from "@/lib/groq";

const CATEGORIES = ["all", "nlp", "vision", "tabular", "audio", "other"] as const;
type Category = typeof CATEGORIES[number];

interface DatasetWithCard {
  dataset: DatasetOnChain;
  card: Partial<DatasetCardType> | null;
}

function HeroSection() {
  return (
    <section style={styles.hero}>
      <div style={styles.heroContent}>
        <div style={styles.heroBadge}>
          <span style={{ color: "var(--color-ink-black)", fontSize: "10px" }}>⬡</span>
          Sui Testnet · Walrus Storage · AI
        </div>
        <h1 className="font-display" style={styles.heroTitle}>
          The <span style={{ background: "var(--color-sui-blue)", padding: "0 8px", color: "var(--color-pure-white)" }}>Verifiable</span><br />
          AI Dataset Registry
        </h1>
        <p style={styles.heroDesc}>
          Publish, discover, and subscribe to AI training datasets with on-chain provenance,
          decentralized storage, and AI-generated quality reports.
        </p>
        <div style={styles.heroStats}>
          {["Tamper-proof", "Pay-per-access", "AI-analyzed"].map((label) => (
            <div key={label} style={styles.heroStat}>
              <div style={styles.heroStatDot} />
              {label}
            </div>
          ))}
        </div>

        <div style={{
          marginTop: "48px",
          padding: "24px",
          background: "var(--color-pure-white)",
          borderRadius: "var(--radius-cards)",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          textAlign: "left",
          border: "1px solid var(--color-surface-mist)"
        }}>
          <h3 style={{ fontFamily: "var(--font-suisseintlcond)", fontSize: "20px", textTransform: "uppercase" }}>New to Vela?</h3>
          <p style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)" }}>
            Explore the datasets below. When you&apos;re ready to subscribe or publish, you&apos;ll need testnet SUI to pay for gas.
          </p>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "8px" }}>
            <a href="https://discord.com/invite/sui" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ fontSize: "12px", padding: "6px 12px" }}>
              Get Testnet SUI in Discord
            </a>
            <span style={{ fontSize: "12px", color: "var(--color-steel-gray)", alignSelf: "center" }}>
              Or use the &quot;Request Testnet SUI&quot; feature in your wallet
            </span>
          </div>
        </div>
      </div>
    </section>
  );
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

export default function BrowsePage() {
  const [datasets, setDatasets] = useState<DatasetWithCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("dataset-search")?.focus();
      } else if (e.key === "/" && document.activeElement?.id !== "dataset-search") {
        e.preventDefault();
        document.getElementById("dataset-search")?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    async function loadDatasets() {
      try {
        setLoading(true);
        // Fetch all dataset IDs from registry
        const idsRes = await fetch("/api/datasets");
        if (!idsRes.ok) throw new Error("Failed to fetch datasets");
        const { datasets: raw } = await idsRes.json() as { datasets: DatasetOnChain[] };

        // Fetch card data for each in parallel
        const withCards = await Promise.all(
          (raw ?? []).map(async (dataset: DatasetOnChain) => {
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
              // Card fetch failure is non-fatal
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
  }, []);

  const filtered = useMemo(() => {
    return datasets.filter(({ dataset, card }) => {
      const matchesSearch =
        !search ||
        dataset.name?.toLowerCase().includes(search.toLowerCase()) ||
        card?.summary?.toLowerCase().includes(search.toLowerCase()) ||
        dataset.category?.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        category === "all" || dataset.category?.toLowerCase() === category;

      return matchesSearch && matchesCategory;
    });
  }, [datasets, search, category]);

  return (
    <main>
      <HeroSection />

      <div className="container" style={{ paddingBottom: "80px" }}>
        {/* Search + Filter bar */}
        <div style={styles.filterBar}>
          <div style={styles.searchWrapper}>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                className="input"
                style={styles.searchInput}
                placeholder="Search datasets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                id="dataset-search"
              />
              <div style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--color-steel-gray)", fontSize: "12px", fontFamily: "var(--font-suisseintlmono)" }}>
                ⌘K
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", flex: 1, justifyContent: "space-between" }}>
            <div style={styles.categoryPills}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`category-pill ${category === cat ? "active" : ""}`}
                >
                  {cat === "all" ? "All" : cat.toUpperCase()}
                </button>
              ))}
            </div>
            
            <div style={{ display: "flex", gap: "8px", background: "var(--color-surface-mist)", padding: "4px", borderRadius: "var(--radius-buttons)" }}>
              <button 
                onClick={() => setViewMode("grid")}
                style={{ padding: "6px 12px", borderRadius: "4px", fontSize: "12px", background: viewMode === "grid" ? "var(--color-pure-white)" : "transparent", boxShadow: viewMode === "grid" ? "0 1px 3px rgba(0,0,0,0.1)" : "none", color: viewMode === "grid" ? "var(--color-ink-black)" : "var(--color-graphite)" }}
              >
                Grid
              </button>
              <button 
                onClick={() => setViewMode("list")}
                style={{ padding: "6px 12px", borderRadius: "4px", fontSize: "12px", background: viewMode === "list" ? "var(--color-pure-white)" : "transparent", boxShadow: viewMode === "list" ? "0 1px 3px rgba(0,0,0,0.1)" : "none", color: viewMode === "list" ? "var(--color-ink-black)" : "var(--color-graphite)" }}
              >
                List
              </button>
            </div>
          </div>
        </div>

        {/* Stats row */}
        {!loading && (
          <div style={styles.statsRow}>
            <span className="font-mono-tag" style={{ color: "var(--color-graphite)" }}>
              {filtered.length} dataset{filtered.length !== 1 ? "s" : ""}
              {category !== "all" ? ` in ${category}` : ""}
              {search ? ` matching "${search}"` : ""}
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            padding: "16px",
            background: "#ffebee",
            border: "1px solid #ef5350",
            borderRadius: "var(--radius-buttons)",
            color: "#c62828",
            marginBottom: "24px",
            fontFamily: "var(--font-suisseintlmono)",
            fontSize: "12px",
          }}>
            ERROR: {error}
          </div>
        )}

        {/* Grid/List */}
        <div className={viewMode === "list" ? "list-layout" : ""} style={viewMode === "grid" ? styles.grid : {}}>
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : filtered.length === 0
            ? (
              <div style={styles.empty}>
                <h3 style={{ fontFamily: "var(--font-suisseintlcond)", fontSize: "32px", marginBottom: "8px", textTransform: "uppercase" }}>
                  No datasets found
                </h3>
                <p style={{ color: "var(--color-graphite)", fontSize: "var(--text-body)" }}>
                  {datasets.length === 0
                    ? "Be the first to publish a dataset on Vela!"
                    : "Try a different search or category filter."}
                </p>
              </div>
            )
            : filtered.map(({ dataset, card }, index) => {
                const isFeatured = viewMode === "grid" && index === 0;
                return (
                  <div key={dataset.id} style={isFeatured ? { gridColumn: "1 / -1" } : {}}>
                    <DatasetCard dataset={dataset} card={card} isListView={viewMode === "list"} isFeatured={isFeatured} />
                  </div>
                );
              })
          }
        </div>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  hero: {
    padding: "var(--spacing-96) 24px var(--spacing-80)",
    textAlign: "center",
  },
  heroContent: {
    maxWidth: "800px",
    margin: "0 auto",
  },
  heroBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 16px",
    background: "var(--color-surface-mist)",
    borderRadius: "var(--radius-tags)",
    fontFamily: "var(--font-suisseintlmono)",
    fontSize: "var(--text-caption)",
    color: "var(--color-graphite)",
    letterSpacing: "var(--tracking-caption)",
    marginBottom: "32px",
    textTransform: "uppercase",
  },
  heroTitle: {
    fontSize: "var(--text-display-xl)",
    marginBottom: "24px",
    textTransform: "uppercase",
  },
  heroDesc: {
    color: "var(--color-graphite)",
    fontSize: "var(--text-subheading)",
    lineHeight: "var(--leading-subheading)",
    maxWidth: "600px",
    margin: "0 auto 40px",
  },
  heroStats: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "32px",
    flexWrap: "wrap",
  },
  heroStat: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontFamily: "var(--font-suisseintlmono)",
    fontSize: "var(--text-caption)",
    color: "var(--color-ink-black)",
    textTransform: "uppercase",
  },
  heroStatDot: {
    width: "6px",
    height: "6px",
    background: "var(--color-ink-black)",
  },
  filterBar: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "24px",
    flexWrap: "wrap",
  },
  searchWrapper: {
    flex: 1,
    minWidth: "240px",
  },
  searchInput: {
    width: "100%",
  },
  categoryPills: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  statsRow: {
    marginBottom: "24px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "24px",
  },
  empty: {
    gridColumn: "1 / -1",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "80px 24px",
    textAlign: "center",
    background: "var(--color-pure-white)",
    borderRadius: "var(--radius-cards)",
  },
};
