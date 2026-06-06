/**
 * /api/generate-card — Server-side Groq dataset card generation
 *
 * Keeps the GROQ_API_KEY server-side, away from the browser bundle.
 */

import { NextRequest, NextResponse } from "next/server";
import { generateDatasetCard } from "@/lib/groq";

export async function POST(req: NextRequest) {
  try {
    const { sample } = (await req.json()) as { sample: string };

    if (!sample || typeof sample !== "string") {
      return NextResponse.json({ error: "Missing sample field" }, { status: 400 });
    }

    const card = await generateDatasetCard(sample);
    return NextResponse.json({ card });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    console.error("[generate-card]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
