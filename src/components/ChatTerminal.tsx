import { useState } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function ChatTerminal({ blobId }: { blobId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      // 1. Fetch the raw blob
      const res = await fetch(`/api/walrus/fetch?blobId=${blobId}`);
      if (!res.ok) throw new Error("Failed to fetch dataset for context");
      const { content: rawCsv } = await res.json() as { content: string };

      // 2. Send to chat API
      const chatRes = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sample: rawCsv, question: userMessage }),
      });
      if (!chatRes.ok) throw new Error("Failed to get AI response");

      const { answer } = await chatRes.json() as { answer: string };
      setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I couldn't process that request. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px", marginTop: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ fontFamily: "var(--font-suisseintlcond)", fontSize: "16px", fontWeight: 700, textTransform: "uppercase" }}>
          Chat with this Dataset
        </h3>
        {messages.length > 0 && (
          <button 
            onClick={() => setMessages([])} 
            className="btn btn-ghost" 
            style={{ padding: "4px 8px", fontSize: "12px", height: "auto" }}
          >
            Clear
          </button>
        )}
      </div>
      
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        maxHeight: "300px",
        overflowY: "auto",
        padding: "16px",
        background: "var(--color-pure-white)",
        borderRadius: "var(--radius-buttons)",
        border: "1px solid var(--color-steel-gray)",
        minHeight: "150px"
      }}>
        {messages.length === 0 ? (
          <div style={{ color: "var(--color-graphite)", fontSize: "13px", textAlign: "center", margin: "auto" }}>
            Ask Groq a question about the first 50 rows of this dataset!
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} style={{
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              background: msg.role === "user" ? "var(--color-surface-mist)" : "var(--color-pure-white)",
              color: "var(--color-ink-black)",
              border: msg.role === "assistant" ? "1px solid var(--color-steel-gray)" : "none",
              padding: "10px 14px",
              borderRadius: "16px",
              maxWidth: "85%",
              fontSize: "13px",
              lineHeight: 1.5,
              whiteSpace: "pre-wrap"
            }}>
              {msg.content}
            </div>
          ))
        )}
        {isLoading && (
          <div style={{ alignSelf: "flex-start", fontSize: "13px", color: "var(--color-graphite)", padding: "10px 14px" }}>
            <div className="spinner" style={{ width: "14px", height: "14px", borderWidth: "2px", display: "inline-block", marginRight: "8px" }} />
            Analyzing...
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="e.g., What is the average age in this dataset?"
          style={{
            flex: 1,
            padding: "12px 16px",
            background: "var(--color-pure-white)",
            border: "1px solid var(--color-steel-gray)",
            borderRadius: "20px",
            color: "var(--color-ink-black)",
            fontSize: "14px",
            outline: "none"
          }}
          disabled={isLoading}
        />
        <button 
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          style={{
            background: input.trim() && !isLoading ? "var(--color-ink-black)" : "var(--color-canvas-mist)",
            color: input.trim() && !isLoading ? "var(--color-pure-white)" : "var(--color-graphite)",
            border: "none",
            borderRadius: "20px",
            padding: "0 20px",
            fontWeight: 600,
            cursor: input.trim() && !isLoading ? "pointer" : "not-allowed",
            transition: "all 0.2s"
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
