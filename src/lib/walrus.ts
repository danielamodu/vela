/**
 * walrus.ts — Walrus decentralized storage helpers
 *
 * Walrus stores arbitrary blobs and returns a blobId that can be used
 * to retrieve the data from any aggregator node. We use the public
 * Walrus testnet endpoints configured via environment variables.
 */

const PUBLISHER_URL = process.env.WALRUS_PUBLISHER_URL!;
const AGGREGATOR_URL = process.env.WALRUS_AGGREGATOR_URL!;

/**
 * Upload data to Walrus and return the blobId.
 *
 * The PUT endpoint accepts raw bytes. Walrus responds with either:
 *   { newlyCreated: { blobObject: { blobId: string } } }
 * or
 *   { alreadyCertified: { blobId: string } }
 *
 * We store data for 5 epochs (roughly 5 days on testnet).
 *
 * @param data — raw file Blob or text string to upload
 * @returns blobId — the content-addressed identifier for the stored blob
 */
export async function uploadToWalrus(data: ArrayBuffer | string, contentType?: string): Promise<string> {
  const body = data;

  const response = await fetch(`${PUBLISHER_URL}/v1/blobs?epochs=5`, {
    method: "PUT",
    body,
    headers: {
      "Content-Type": contentType || "application/octet-stream",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Walrus upload failed (${response.status}): ${text}`);
  }

  const result = await response.json();

  // Parse either response shape
  if (result.newlyCreated?.blobObject?.blobId) {
    return result.newlyCreated.blobObject.blobId as string;
  }
  if (result.alreadyCertified?.blobId) {
    return result.alreadyCertified.blobId as string;
  }

  throw new Error(`Unexpected Walrus response: ${JSON.stringify(result)}`);
}

/**
 * Fetch a blob from Walrus by blobId and return it as a string.
 *
 * Uses the aggregator endpoint which proxies from the Walrus network.
 * Suitable for text files, JSON, and small binary data encoded as text.
 *
 * @param blobId — the Walrus blob identifier
 * @returns text content of the blob
 */
export async function fetchFromWalrus(blobId: string): Promise<string> {
  const response = await fetch(`${AGGREGATOR_URL}/v1/blobs/${blobId}`);

  if (!response.ok) {
    throw new Error(`Walrus fetch failed (${response.status}) for blobId: ${blobId}`);
  }

  return response.text();
}
