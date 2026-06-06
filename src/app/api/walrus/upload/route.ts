/**
 * /api/walrus/upload — Server-side Walrus upload proxy
 *
 * Proxies file uploads to Walrus from the server, keeping the publisher URL
 * server-side (even though it's public, this avoids CORS issues from browsers).
 */

import { NextRequest, NextResponse } from "next/server";
import { uploadToWalrus } from "@/lib/walrus";

export async function POST(req: NextRequest) {
  try {
    const buffer = await req.arrayBuffer();
    const contentType = req.headers.get("Content-Type") || "application/octet-stream";

    const blobId = await uploadToWalrus(buffer, contentType);
    return NextResponse.json({ blobId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    console.error("[walrus/upload]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Allow large file uploads
export const maxDuration = 60;
