"use client";

export default function DocsPage() {

  return (
    <main style={{ minHeight: "100vh", background: "var(--color-canvas-mist)", paddingBottom: "80px" }}>
      {/* Hero */}
      <section style={{ padding: "120px 24px 60px", textAlign: "center", background: "var(--color-pure-white)", borderBottom: "1px solid var(--color-surface-mist)" }}>
        <div className="container" style={{ maxWidth: "800px" }}>
          <h1 className="font-display" style={{ fontSize: "var(--text-display)", textTransform: "uppercase", marginBottom: "16px" }}>
            Documentation
          </h1>
          <p style={{ color: "var(--color-graphite)", fontSize: "var(--text-subheading)", maxWidth: "600px", margin: "0 auto" }}>
            Everything you need to build with Vela
          </p>
        </div>
      </section>

      <div className="container" style={{ maxWidth: "800px", paddingTop: "40px" }}>

        {/* Table of Contents */}
        <div className="card" style={{ padding: "24px 40px", marginBottom: "32px" }}>
          <h2 style={{ fontSize: "12px", fontFamily: "var(--font-suisseintlmono)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "16px", color: "var(--color-graphite)" }}>Contents</h2>
          <ul style={{ display: "flex", flexWrap: "wrap", gap: "12px 24px", listStyle: "none", padding: 0, margin: 0 }}>
            {[
              ["What is Vela", "#what-is-vela"],
              ["How it Works", "#how-it-works"],
              ["Architecture", "#architecture"],
              ["Smart Contract", "#smart-contract"],
              ["Data Integrity", "#data-integrity"],
              ["Trust Score", "#trust-score"],
              ["API Reference", "#api-reference"],
              ["MCP Server", "#mcp-server"]
            ].map(([label, href]) => (
              <li key={href}>
                <a href={href} className="link-affordance" style={{ color: "var(--color-ink-black)", textDecoration: "none", fontSize: "14px", fontWeight: 500 }}>
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          
          {/* What is Vela */}
          <section id="what-is-vela" className="card" style={{ padding: "40px" }}>
            <h2 className="font-display" style={{ fontSize: "var(--text-heading)", textTransform: "uppercase", marginBottom: "16px" }}>
              What is Vela
            </h2>
            <p style={{ color: "var(--color-graphite)", lineHeight: 1.7 }}>
              Vela is a decentralized, verifiable AI dataset registry built on the Sui blockchain and Walrus decentralized storage. It solves the problem of dataset provenance, quality verification, and monetization by enforcing on-chain hashing, automated AI quality reports via Groq, and a seamless pay-per-access model for data publishers.
            </p>
          </section>

          {/* How it Works */}
          <section id="how-it-works" className="card" style={{ padding: "40px" }}>
            <h2 className="font-display" style={{ fontSize: "var(--text-heading)", textTransform: "uppercase", marginBottom: "24px" }}>
              How it Works
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {[
                "Upload: The user uploads a CSV dataset via the Vela frontend.",
                "Walrus Storage: The raw dataset is pushed directly to the Walrus decentralized storage network, returning a unique Blob ID.",
                "AI Analysis: A sample of the dataset is sent to the Groq AI API, which generates a comprehensive AI Dataset Card evaluating quality, features, and use cases.",
                "Sui Registration: The Blob ID, dataset metadata, and price are registered on the Sui blockchain via a smart contract.",
                "Pay-per-Access: Consumers browse the registry, pay the designated SUI price directly to the publisher, and gain access to the raw Blob."
              ].map((step, i) => (
                <div key={i} style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                  <div style={{ 
                    background: "var(--color-ink-black)", color: "var(--color-pure-white)", 
                    width: "28px", height: "28px", borderRadius: "14px", 
                    display: "flex", alignItems: "center", justifyContent: "center", 
                    fontFamily: "var(--font-suisseintlmono)", fontSize: "12px", flexShrink: 0 
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ paddingTop: "2px", color: "var(--color-graphite)", lineHeight: 1.6 }}>
                    <strong style={{ color: "var(--color-ink-black)", fontWeight: 500 }}>{step.split(": ")[0]}:</strong> {step.split(": ")[1]}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Architecture */}
          <section id="architecture" className="card" style={{ padding: "40px" }}>
            <h2 className="font-display" style={{ fontSize: "var(--text-heading)", textTransform: "uppercase", marginBottom: "16px" }}>
              Architecture
            </h2>
            <p style={{ color: "var(--color-graphite)", lineHeight: 1.7, marginBottom: "16px" }}>
              Vela orchestrates multiple decentralized and AI technologies to provide a seamless registry experience:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ padding: "16px", background: "var(--color-surface-mist)", borderRadius: "var(--radius-buttons)" }}>
                <strong style={{ fontFamily: "var(--font-suisseintlmono)", fontSize: "12px", textTransform: "uppercase" }}>Walrus</strong>
                <p style={{ fontSize: "14px", marginTop: "4px", color: "var(--color-graphite)" }}>Decentralized blob storage network. Stores the heavy raw datasets and the generated AI dataset cards.</p>
              </div>
              <div style={{ padding: "16px", background: "var(--color-surface-mist)", borderRadius: "var(--radius-buttons)" }}>
                <strong style={{ fontFamily: "var(--font-suisseintlmono)", fontSize: "12px", textTransform: "uppercase" }}>Tatum</strong>
                <p style={{ fontSize: "14px", marginTop: "4px", color: "var(--color-graphite)" }}>Provides high-performance Sui RPC nodes and calculates the Publisher Trust Score.</p>
              </div>
              <div style={{ padding: "16px", background: "var(--color-surface-mist)", borderRadius: "var(--radius-buttons)" }}>
                <strong style={{ fontFamily: "var(--font-suisseintlmono)", fontSize: "12px", textTransform: "uppercase" }}>Groq</strong>
                <p style={{ fontSize: "14px", marginTop: "4px", color: "var(--color-graphite)" }}>Powers the ultra-fast LLM analysis to automatically generate dataset cards and chat functionality.</p>
              </div>
              <div style={{ padding: "16px", background: "var(--color-surface-mist)", borderRadius: "var(--radius-buttons)" }}>
                <strong style={{ fontFamily: "var(--font-suisseintlmono)", fontSize: "12px", textTransform: "uppercase" }}>Move Smart Contract</strong>
                <p style={{ fontSize: "14px", marginTop: "4px", color: "var(--color-graphite)" }}>Manages the canonical registry state, access control, and peer-to-peer SUI payments.</p>
              </div>
            </div>
          </section>

          {/* Smart Contract */}
          <section id="smart-contract" className="card" style={{ padding: "40px" }}>
            <h2 className="font-display" style={{ fontSize: "var(--text-heading)", textTransform: "uppercase", marginBottom: "16px" }}>
              Smart Contract
            </h2>
            <div style={{ marginBottom: "24px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", border: "1px solid var(--color-surface-mist)", borderRadius: "var(--radius-buttons)" }}>
                <span style={{ fontFamily: "var(--font-suisseintlmono)", fontSize: "12px", color: "var(--color-graphite)" }}>Package ID</span>
                <code style={{ fontSize: "12px", wordBreak: "break-all", maxWidth: "70%", textAlign: "right" }}>0xa6340fcee42316e1a877ba57cbcf197b424b15689ae2e85bf8da901fababaef6</code>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", border: "1px solid var(--color-surface-mist)", borderRadius: "var(--radius-buttons)" }}>
                <span style={{ fontFamily: "var(--font-suisseintlmono)", fontSize: "12px", color: "var(--color-graphite)" }}>Registry ID</span>
                <code style={{ fontSize: "12px", wordBreak: "break-all", maxWidth: "70%", textAlign: "right" }}>0x1d4695e61173f8a16308c733d1b913f9a7576123bca827ab7b020117e3fe108a</code>
              </div>
            </div>
            
            <h3 style={{ fontSize: "14px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px" }}>Core Functions</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <code style={{ background: "var(--color-surface-mist)", padding: "4px 8px", borderRadius: "4px", fontSize: "13px" }}>publish_dataset</code>
                <p style={{ fontSize: "14px", color: "var(--color-graphite)", marginTop: "4px" }}>Registers a new dataset with its Walrus blob ID, metadata, and required price.</p>
              </div>
              <div>
                <code style={{ background: "var(--color-surface-mist)", padding: "4px 8px", borderRadius: "4px", fontSize: "13px" }}>subscribe</code>
                <p style={{ fontSize: "14px", color: "var(--color-graphite)", marginTop: "4px" }}>Accepts SUI payment, transfers it directly to the publisher, and adds the caller to the subscriber list.</p>
              </div>
              <div>
                <code style={{ background: "var(--color-surface-mist)", padding: "4px 8px", borderRadius: "4px", fontSize: "13px" }}>query_dataset</code>
                <p style={{ fontSize: "14px", color: "var(--color-graphite)", marginTop: "4px" }}>Read-only oracle function that returns the Walrus blob ID for a dataset, accessible only to subscribers or the owner.</p>
              </div>
              <div>
                <code style={{ background: "var(--color-surface-mist)", padding: "4px 8px", borderRadius: "4px", fontSize: "13px" }}>update_price</code>
                <p style={{ fontSize: "14px", color: "var(--color-graphite)", marginTop: "4px" }}>Allows the dataset owner to update the required SUI payment for future subscribers.</p>
              </div>
            </div>
          </section>

          {/* Data Integrity */}
          <section id="data-integrity" className="card" style={{ padding: "40px" }}>
            <h2 className="font-display" style={{ fontSize: "var(--text-heading)", textTransform: "uppercase", marginBottom: "16px" }}>
              Data Integrity
            </h2>
            <p style={{ color: "var(--color-graphite)", lineHeight: 1.7 }}>
              When a dataset is uploaded, Vela calculates its SHA-256 hash before pushing it to Walrus. This hash is permanently recorded on the Sui blockchain during registration. When any user downloads the dataset later, the Vela client recalculates the hash of the downloaded blob and verifies it against the immutable on-chain record, ensuring absolute data integrity and protection against silent corruption.
            </p>
          </section>

          {/* Trust Score */}
          <section id="trust-score" className="card" style={{ padding: "40px" }}>
            <h2 className="font-display" style={{ fontSize: "var(--text-heading)", textTransform: "uppercase", marginBottom: "16px" }}>
              Publisher Trust Score
            </h2>
            <p style={{ color: "var(--color-graphite)", lineHeight: 1.7 }}>
              To help consumers assess publisher reliability, Vela leverages Tatum&apos;s powerful RPC infrastructure to analyze a publisher&apos;s on-chain history. The Trust Score evaluates the age of the wallet, transaction frequency, and prior dataset publications to calculate a 0-100 score, deterring sybil attacks and highlighting reputable data providers.
            </p>
          </section>

          {/* API Reference */}
          <section id="api-reference" className="card" style={{ padding: "40px" }}>
            <h2 className="font-display" style={{ fontSize: "var(--text-heading)", textTransform: "uppercase", marginBottom: "16px" }}>
              API Reference
            </h2>
            <div style={{ display: "grid", gap: "8px" }}>
              <div style={{ display: "flex", gap: "16px", padding: "12px", borderBottom: "1px solid var(--color-surface-mist)" }}>
                <code style={{ minWidth: "140px", flexShrink: 0, fontSize: "13px", color: "var(--color-sui-blue)" }}>/api/walrus/upload</code>
                <span style={{ fontSize: "14px", color: "var(--color-graphite)" }}>Pushes raw files or JSON to Walrus storage</span>
              </div>
              <div style={{ display: "flex", gap: "16px", padding: "12px", borderBottom: "1px solid var(--color-surface-mist)" }}>
                <code style={{ minWidth: "140px", flexShrink: 0, fontSize: "13px", color: "var(--color-sui-blue)" }}>/api/walrus/fetch</code>
                <span style={{ fontSize: "14px", color: "var(--color-graphite)" }}>Retrieves blob content via its Walrus ID</span>
              </div>
              <div style={{ display: "flex", gap: "16px", padding: "12px", borderBottom: "1px solid var(--color-surface-mist)" }}>
                <code style={{ minWidth: "140px", flexShrink: 0, fontSize: "13px", color: "var(--color-sui-blue)" }}>/api/generate-card</code>
                <span style={{ fontSize: "14px", color: "var(--color-graphite)" }}>Triggers Groq to generate an AI Dataset Card</span>
              </div>
              <div style={{ display: "flex", gap: "16px", padding: "12px", borderBottom: "1px solid var(--color-surface-mist)" }}>
                <code style={{ minWidth: "140px", flexShrink: 0, fontSize: "13px", color: "var(--color-sui-blue)" }}>/api/chat</code>
                <span style={{ fontSize: "14px", color: "var(--color-graphite)" }}>Interactive AI Q&A over dataset samples</span>
              </div>
              <div style={{ display: "flex", gap: "16px", padding: "12px" }}>
                <code style={{ minWidth: "140px", flexShrink: 0, fontSize: "13px", color: "var(--color-sui-blue)" }}>/api/sui/*</code>
                <span style={{ fontSize: "14px", color: "var(--color-graphite)" }}>Various endpoints for building Move PTB transactions</span>
              </div>
            </div>
          </section>

          {/* MCP Server */}
          <section id="mcp-server" className="card" style={{ padding: "40px" }}>
            <h2 className="font-display" style={{ fontSize: "var(--text-heading)", textTransform: "uppercase", marginBottom: "16px" }}>
              MCP Server
            </h2>
            <p style={{ color: "var(--color-graphite)", lineHeight: 1.7, marginBottom: "16px" }}>
              Vela exposes a standard Model Context Protocol (MCP) server, allowing AI agents to programmatically interact with the decentralized registry.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", background: "var(--color-surface-mist)", borderRadius: "var(--radius-buttons)" }}>
                <span style={{ fontFamily: "var(--font-suisseintlmono)", fontSize: "12px", color: "var(--color-graphite)" }}>Endpoint URL (SSE Transport)</span>
                <code style={{ fontSize: "12px", color: "var(--color-ink-black)" }}>https://[vela-domain]/api/mcp</code>
              </div>
            </div>
            
            <h3 style={{ fontSize: "14px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px" }}>Available Tools</h3>
            <div style={{ display: "grid", gap: "8px" }}>
              {[
                ["vela_list_datasets", "Fetches all datasets from the registry"],
                ["vela_get_dataset", "Returns full dataset on-chain info"],
                ["vela_query_dataset_blob", "Oracle function to get the Walrus blob ID"],
                ["vela_get_dataset_card", "Fetches the AI-generated dataset card JSON"],
                ["vela_chat_dataset", "Ask the AI questions about a dataset"],
                ["vela_get_publisher_trust_score", "Get the Tatum-powered trust score for an address"]
              ].map(([tool, desc]) => (
                <div key={tool} style={{ display: "flex", gap: "16px", padding: "8px 0" }}>
                  <code style={{ width: "220px", fontSize: "12px", color: "var(--color-ink-black)", fontWeight: 600 }}>{tool}</code>
                  <span style={{ fontSize: "13px", color: "var(--color-graphite)" }}>{desc}</span>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </main>
  );
}
