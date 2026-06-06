/**
 * /api/contract/publish — Build a publish_dataset PTB for wallet signing
 */

import { NextRequest, NextResponse } from "next/server";
import { buildPublishDatasetTx } from "@/lib/contract";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      blobId: string;
      cardBlobId: string;
      fileHash: string;
      name: string;
      description: string;
      priceMist: number;
      category: string;
      senderAddress: string;
    };

    const txBytes = await buildPublishDatasetTx(
      {
        blobId: body.blobId,
        cardBlobId: body.cardBlobId,
        fileHash: body.fileHash,
        name: body.name,
        description: body.description,
        priceMist: body.priceMist,
        category: body.category,
      },
      body.senderAddress
    );

    return NextResponse.json({ txBytes });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to build transaction";
    console.error("[contract/publish]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
