/**
 * /api/contract/update-price — Build an update_price PTB for wallet signing
 */

import { NextRequest, NextResponse } from "next/server";
import { buildUpdatePriceTx } from "@/lib/contract";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      datasetId: string;
      newPriceMist: number;
      senderAddress: string;
    };

    if (!body.datasetId || body.newPriceMist === undefined || !body.senderAddress) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const txBytes = await buildUpdatePriceTx(
      body.datasetId,
      body.newPriceMist,
      body.senderAddress
    );

    return NextResponse.json({ txBytes });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to build transaction";
    console.error("[contract/update-price]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
