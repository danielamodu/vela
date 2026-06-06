/**
 * /api/datasets/[id] — Fetch a single dataset by object ID
 */

import { NextRequest, NextResponse } from "next/server";
import { queryDataset } from "@/lib/contract";
import { calculatePublisherTrustScore } from "@/lib/trust";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Missing dataset ID" }, { status: 400 });
  }

  try {
    const dataset = await queryDataset(id);
    if (!dataset) {
      return NextResponse.json({ error: "Dataset not found" }, { status: 404 });
    }
    const trustScore = await calculatePublisherTrustScore(dataset.owner);
    
    return NextResponse.json({ dataset, trustScore });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch dataset";
    console.error("[api/datasets/[id]]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
