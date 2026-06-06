import type React from "react";
import { UploadForm } from "@/components/UploadForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Upload Dataset — Vela",
  description:
    "Publish your AI training dataset to Vela. Files are stored on Walrus, analyzed by AI, and registered on the Sui blockchain.",
};

export default function UploadPage() {
  return (
    <main>
      <div className="container" style={{ maxWidth: "760px", paddingTop: "40px", paddingBottom: "80px" }}>
        {/* Page Header */}
        <div style={styles.header}>
          <div>
            <h1 className="font-display" style={styles.title}>PUBLISH A DATASET</h1>
            <p style={styles.subtitle}>
              Upload your dataset file and Vela will automatically analyze it with Groq AI,
              store it on Walrus, and register it on Sui.
            </p>
          </div>
        </div>

        {/* Pipeline Steps Info */}
        <div style={styles.pipeline} className="responsive-grid-3">
          {[
            {
              icon: "🗂",
              label: "Raw Storage",
              desc: "Your file is stored on Walrus decentralized storage",
            },
            {
              icon: "🤖",
              label: "AI Analysis",
              desc: "Llama-3 analyzes your data and generates a quality card",
            },
            {
              icon: "⛓",
              label: "On-chain",
              desc: "Metadata and blob IDs are anchored on Sui testnet",
            },
          ].map((step) => (
            <div key={step.label} style={styles.pipelineStep}>
              <span style={styles.pipelineIcon}>{step.icon}</span>
              <div>
                <div style={styles.pipelineLabel}>{step.label}</div>
                <div style={styles.pipelineDesc}>{step.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Form */}
        <div className="card" style={{ padding: "40px" }}>
          <UploadForm />
        </div>

        {/* Footer note */}
        <p style={styles.note}>
          ⓘ Published datasets are permanent. Walrus stores your data for 5 epochs (~5 days).
          Subscription payments go directly to the publisher&apos;s wallet.
        </p>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: "flex",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "40px",
  },
  title: {
    fontSize: "var(--text-heading-lg)",
    marginBottom: "16px",
  },
  subtitle: {
    color: "var(--color-graphite)",
    fontSize: "var(--text-body)",
    lineHeight: "var(--leading-body)",
  },
  pipeline: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "16px",
    marginBottom: "32px",
  },
  pipelineStep: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    padding: "24px",
    background: "var(--color-pure-white)",
    borderRadius: "var(--radius-cards)",
  },
  pipelineIcon: {
    fontSize: "32px",
  },
  pipelineLabel: {
    fontFamily: "var(--font-suisseintlmono)",
    fontSize: "var(--text-caption)",
    fontWeight: 400,
    color: "var(--color-ink-black)",
    marginBottom: "8px",
    textTransform: "uppercase",
  },
  pipelineDesc: {
    fontFamily: "var(--font-suisseintl)",
    fontSize: "var(--text-body-sm)",
    color: "var(--color-graphite)",
    lineHeight: "var(--leading-body-sm)",
  },
  note: {
    marginTop: "24px",
    textAlign: "center",
    fontSize: "var(--text-body-sm)",
    color: "var(--color-steel-gray)",
    lineHeight: "var(--leading-body-sm)",
    fontFamily: "var(--font-suisseintl)",
  },
};
