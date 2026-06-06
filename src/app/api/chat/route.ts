import { NextRequest, NextResponse } from "next/server";
import { chatWithDataset } from "@/lib/groq";

export async function POST(req: NextRequest) {
  try {
    const { blobId, message } = (await req.json()) as { blobId: string; message: string };

    if (!blobId || typeof blobId !== "string") {
      return NextResponse.json({ error: "Missing blobId" }, { status: 400 });
    }

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }

    // Fetch the raw data from Walrus using the local proxy endpoint
    // Using absolute URL to avoid fetch issues on the server side
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const host = req.headers.get("host");
    const fetchUrl = `${protocol}://${host}/api/walrus/fetch?blobId=${blobId}`;

    const res = await fetch(fetchUrl);
    if (!res.ok) {
      throw new Error(`Failed to fetch raw data from Walrus: ${res.status}`);
    }
    const { content } = await res.json() as { content: string };

    const reply = await chatWithDataset(content, message);
    return NextResponse.json({ reply });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    console.error("[chat]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
