import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const TATUM_URL = process.env.NEXT_PUBLIC_TATUM_SUI_RPC || "https://sui-testnet.gateway.tatum.io";
    const API_KEY = process.env.TATUM_API_KEY;

    if (!API_KEY) {
      console.warn("[api/sui] Missing TATUM_API_KEY");
    }

    const response = await fetch(TATUM_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(API_KEY && { "x-api-key": API_KEY }),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    console.error("[api/sui] Proxy error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
