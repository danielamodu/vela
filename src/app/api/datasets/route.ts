/**
 * /api/datasets — Fetch all datasets from the Registry
 */

import { NextRequest, NextResponse } from "next/server";
import { getAllDatasets, multiGetDatasets } from "@/lib/contract";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const owner = searchParams.get("owner");

    const ids = await getAllDatasets();
    let datasets = await multiGetDatasets(ids);

    if (owner) {
      datasets = datasets.filter((d) => d.owner === owner);
    }

    return NextResponse.json({ datasets });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch datasets";
    console.error("[api/datasets]", message);
    // Return empty on error so browse page degrades gracefully
    return NextResponse.json({ datasets: [], error: message });
  }
}
