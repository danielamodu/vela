import { suiRPC } from "./tatum";

/**
 * Publisher Trust Score — A feature powered by Tatum's Sui RPC.
 *
 * Calculates a Trust Score (0-100) based on the on-chain activity
 * of the dataset publisher's wallet address.
 */
export async function calculatePublisherTrustScore(address: string): Promise<number> {
  try {
    // We use the Tatum RPC (via our suiRPC wrapper) to query historical
    // transactions for the publisher's address.
    const res = await suiRPC<{ data: unknown[] }>("suix_queryTransactionBlocks", [
      { filter: { FromAddress: address } },
      null, // cursor
      100,  // limit
      false // descending order
    ]);

    // Count how many transactions they have
    const txCount = res?.data?.length || 0;

    // Trust Score Calculation:
    // - Every address gets a base score of 40 (Benefit of the doubt)
    // - Plus 1 point for every transaction they've ever made on-chain
    // - Maxes out at 99 (100 is reserved for protocol-verified identities)
    let score = 40 + txCount;

    if (score > 99) score = 99;

    return score;
  } catch (error) {
    console.error("Failed to calculate Tatum trust score:", error);
    return 40; // Default fallback score
  }
}
