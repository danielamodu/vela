"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";

type Step = "idle" | "walrus-upload" | "ai-analysis" | "card-upload" | "chain-registration" | "done" | "error";

const STEP_LABELS: Record<Step, string> = {
  idle: "Ready to upload",
  "walrus-upload": "Uploading to Walrus storage...",
  "ai-analysis": "Analyzing dataset with Llama-3...",
  "card-upload": "Uploading dataset card to Walrus...",
  "chain-registration": "Registering on Sui blockchain...",
  done: "Dataset published!",
  error: "Upload failed",
};

const STEP_ORDER: Step[] = [
  "walrus-upload",
  "ai-analysis",
  "card-upload",
  "chain-registration",
  "done",
];

const CATEGORIES = ["nlp", "vision", "tabular", "audio", "other"] as const;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function UploadForm() {
  const router = useRouter();
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "nlp" as typeof CATEGORIES[number],
    price: "0",
  });
  const [file, setFile] = useState<File | null>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      if (dropped.size > MAX_FILE_SIZE) {
        setError(`File is too large. Maximum size is 10MB.`);
        setFile(null);
        return;
      }
      setError("");
      setFile(dropped);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (selected.size > MAX_FILE_SIZE) {
        setError(`File is too large. Maximum size is 10MB.`);
        setFile(null);
        return;
      }
      setError("");
      setFile(selected);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !account) return;

    setError("");

    try {
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      // Step 1: Upload raw file to Walrus
      setStep("walrus-upload");
      const walrusUploadRes = await fetch("/api/walrus/upload", {
        method: "POST",
        body: file,
        headers: { "x-filename": file.name, "Content-Type": file.type || "application/octet-stream" },
        signal,
      });
      if (!walrusUploadRes.ok) {
        const errData = await walrusUploadRes.json().catch(() => ({}));
        throw new Error(errData.error ? `Walrus error: ${errData.error}` : "Failed to upload file to Walrus");
      }
      const { blobId } = await walrusUploadRes.json() as { blobId: string };

      // Step 2: Generate AI dataset card
      setStep("ai-analysis");
      const fileText = await file.text();
      const cardRes = await fetch("/api/generate-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sample: fileText }),
        signal,
      });
      if (!cardRes.ok) throw new Error("Failed to generate dataset card");
      const { card } = await cardRes.json() as { card: object };

      // Step 3: Upload card JSON to Walrus
      setStep("card-upload");
      const cardBlob = new Blob([JSON.stringify(card)], { type: "application/json" });
      const cardUploadRes = await fetch("/api/walrus/upload", {
        method: "POST",
        body: cardBlob,
        headers: { "Content-Type": "application/json" },
        signal,
      });
      if (!cardUploadRes.ok) throw new Error("Failed to upload dataset card to Walrus");
      const { blobId: cardBlobId } = await cardUploadRes.json() as { blobId: string };

      // Step 4: Register on-chain via Move contract
      setStep("chain-registration");
      const priceMist = Math.round(parseFloat(formData.price) * 1_000_000_000);

      // Calculate SHA-256 hash of the file
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const fileHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const txRes = await fetch("/api/contract/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blobId,
          cardBlobId,
          fileHash,
          name: formData.name,
          description: formData.description,
          priceMist,
          category: formData.category,
          senderAddress: account.address,
        }),
        signal,
      });

      if (!txRes.ok) throw new Error("Failed to build transaction");
      const { txBytes } = await txRes.json() as { txBytes: string };

      // Sign and execute via wallet
      // dapp-kit's useSignAndExecuteTransaction accepts a base64 string directly
      const result = await signAndExecute({ transaction: txBytes });

      // Extract created dataset object ID from effects
      const created = (result as { effects?: { created?: Array<{ reference?: { objectId?: string } }> } })
        ?.effects?.created?.[0]?.reference?.objectId ?? "";

      setStep("done");

      if (created) {
        setTimeout(() => router.push(`/dataset/${created}`), 2000);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        setStep("idle");
        setError("Upload cancelled.");
      } else {
        setError(err instanceof Error ? err.message : "Unknown error");
        setStep("error");
      }
    }
  };

  const stepIndex = STEP_ORDER.indexOf(step);
  const isRunning = step !== "idle" && step !== "done" && step !== "error";

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      {/* Drop Zone */}
      <div
        style={{
          ...styles.dropZone,
          borderColor: isDragging
            ? "var(--color-ink-black)"
            : file
            ? "var(--color-mint-pulse)"
            : "var(--color-steel-gray)",
          background: isDragging
            ? "var(--color-surface-mist)"
            : file
            ? "var(--color-canvas-mist)"
            : "var(--color-pure-white)",
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: "none" }}
          onChange={handleFileInput}
          accept=".csv,.txt,.json,.parquet,.jsonl"
        />
        <div>
          {file ? (
            <>
              <p style={{ color: "var(--color-ink-black)", fontWeight: 600, marginBottom: 4 }}>{file.name}</p>
              <p style={styles.dropSubtext}>{(file.size / 1024).toFixed(1)} KB — click to change</p>
            </>
          ) : (
            <>
              <p style={styles.dropText}>Drop your dataset here</p>
              <p style={styles.dropSubtext}>CSV, JSON, JSONL, TXT, Parquet · Click to browse</p>
            </>
          )}
        </div>
      </div>

      {/* Form Fields */}
      <div style={styles.fields}>
        <div style={styles.fieldGroup}>
          <label className="label" htmlFor="dataset-name">Dataset Name</label>
          <input
            id="dataset-name"
            className="input"
            type="text"
            placeholder="e.g. Sentiment140 Twitter Corpus"
            value={formData.name}
            onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
            required
          />
        </div>

        <div style={styles.fieldGroup}>
          <label className="label" htmlFor="dataset-description">Description</label>
          <textarea
            id="dataset-description"
            className="input"
            style={{ minHeight: "88px", resize: "vertical" }}
            placeholder="Describe your dataset — source, collection method, intended use..."
            value={formData.description}
            onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
            required
          />
        </div>

        <div style={styles.row} className="responsive-flex-col">
          <div style={{ ...styles.fieldGroup, flex: 1 }}>
            <label className="label" htmlFor="dataset-category">Category</label>
            <select
              id="dataset-category"
              className="input"
              value={formData.category}
              onChange={(e) => setFormData((f) => ({ ...f, category: e.target.value as typeof CATEGORIES[number] }))}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div style={{ ...styles.fieldGroup, flex: 1 }}>
            <label className="label" htmlFor="dataset-price">
              Price (SUI) — 0 for free
            </label>
            <input
              id="dataset-price"
              className="input"
              type="number"
              min="0"
              step="0.001"
              placeholder="0"
              value={formData.price}
              onChange={(e) => setFormData((f) => ({ ...f, price: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      {step !== "idle" && (
        <div style={styles.progressWrapper}>
          <div style={styles.progressHeader}>
            <span style={styles.progressTitle}>
              {step === "error" ? "❌ " : step === "done" ? "✅ " : "⚡ "}
              {STEP_LABELS[step]}
            </span>
          </div>
          <div style={styles.steps}>
            {STEP_ORDER.filter(s => s !== "done").map((s, i) => {
              const isDone = stepIndex > i + 1 || step === "done";
              const isCurrent = STEP_ORDER[stepIndex] === s;
              return (
                <div key={s} style={styles.stepItem}>
                  <div style={{
                    ...styles.stepDot,
                    background: isDone
                      ? "var(--color-mint-pulse)"
                      : isCurrent
                      ? "var(--color-ink-black)"
                      : "var(--color-surface-mist)",
                    border: `1px solid ${isDone ? "var(--color-mint-pulse)" : isCurrent ? "var(--color-ink-black)" : "var(--color-steel-gray)"}`,
                  }}>
                    {isCurrent && !isDone && (
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-pure-white)" }} />
                    )}
                  </div>
                  <span style={{
                    fontSize: "10px",
                    color: isDone ? "var(--color-ink-black)" : isCurrent ? "var(--color-ink-black)" : "var(--color-steel-gray)",
                    fontWeight: isCurrent ? 600 : 400,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    fontFamily: "var(--font-suisseintlmono)",
                  }}>
                    {s.replace("-", " ")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={styles.errorBox}>
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        className="btn btn-primary"
        style={{ width: "100%", justifyContent: "center", padding: "16px", fontSize: "16px" }}
        disabled={!file || !formData.name || !account || isRunning}
      >
        {isRunning ? (
          "PUBLISHING..."
        ) : step === "done" ? (
          <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                strokeDasharray: 24,
                strokeDashoffset: 24,
                animation: "drawCheck 0.4s ease-out 0.1s forwards",
              }}
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Dataset published! Redirecting...
            <style>{`
              @keyframes drawCheck {
                to { stroke-dashoffset: 0; }
              }
            `}</style>
          </span>
        ) : !account ? (
          "CONNECT WALLET TO PUBLISH"
        ) : (
          "PUBLISH TO VELA"
        )}
      </button>

      {isRunning && (
        <button
          type="button"
          onClick={() => abortControllerRef.current?.abort()}
          className="btn btn-ghost"
          style={{ width: "100%", justifyContent: "center", padding: "12px", fontSize: "14px" }}
        >
          Cancel Upload
        </button>
      )}

      {!account && (
        <p style={{ textAlign: "center", color: "var(--color-graphite)", fontSize: "12px", marginTop: "8px", fontFamily: "var(--font-suisseintl)" }}>
          Connect your Sui wallet to publish datasets
        </p>
      )}
    </form>
  );
}

const styles: Record<string, React.CSSProperties> = {
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  dropZone: {
    border: "1px dashed",
    borderRadius: "var(--radius-buttons)",
    padding: "48px 24px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    textAlign: "center",
  },
  dropText: {
    fontFamily: "var(--font-suisseintl)",
    color: "var(--color-ink-black)",
    fontSize: "var(--text-body)",
    fontWeight: 500,
    marginBottom: "4px",
  },
  dropSubtext: {
    fontFamily: "var(--font-suisseintl)",
    color: "var(--color-steel-gray)",
    fontSize: "var(--text-body-sm)",
  },
  fields: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
  },
  row: {
    display: "flex",
    gap: "16px",
  },
  progressWrapper: {
    background: "var(--color-surface-mist)",
    border: "1px solid var(--color-steel-gray)",
    borderRadius: "var(--radius-buttons)",
    padding: "16px 20px",
  },
  progressHeader: {
    marginBottom: "16px",
  },
  progressTitle: {
    fontFamily: "var(--font-suisseintl)",
    fontSize: "var(--text-body-sm)",
    fontWeight: 500,
    color: "var(--color-ink-black)",
  },
  steps: {
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
  },
  stepItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    flex: 1,
    textAlign: "center",
  },
  stepDot: {
    width: "16px",
    height: "16px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease",
  },
  errorBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    padding: "12px 16px",
    background: "#ffebee",
    border: "1px solid #ef5350",
    borderRadius: "var(--radius-buttons)",
    color: "#c62828",
    fontSize: "var(--text-body-sm)",
    fontFamily: "var(--font-suisseintlmono)",
  },
};
