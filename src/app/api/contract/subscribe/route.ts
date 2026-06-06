/**
 * /api/contract/subscribe — Build a subscribe PTB for wallet signing
 */

import { NextRequest, NextResponse } from "next/server";
import { buildSubscribeTx } from "@/lib/contract";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      datasetId: string;
      priceMist: string;
      senderAddress: string;
      coinObjectId: string;
    };

    const txBytes = await buildSubscribeTx(
      body.datasetId,
      BigInt(body.priceMist),
      body.senderAddress,
      body.coinObjectId
    );

    return NextResponse.json({ txBytes });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to build subscription transaction";
    console.error("[contract/subscribe]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
