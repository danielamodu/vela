/**
 * /api/walrus/fetch — Server-side Walrus blob fetch proxy
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchFromWalrus } from "@/lib/walrus";

export async function GET(req: NextRequest) {
  const blobId = req.nextUrl.searchParams.get("blobId");

  if (!blobId) {
    return NextResponse.json({ error: "Missing blobId" }, { status: 400 });
  }

  try {
    const content = await fetchFromWalrus(blobId);
    return NextResponse.json({ content });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Fetch failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
