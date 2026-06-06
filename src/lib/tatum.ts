/**
 * tatum.ts — Tatum-powered Sui RPC helpers
 *
 * Tatum provides a managed Sui node RPC endpoint. All calls go through
 * the standard JSON-RPC 2.0 protocol with an API key in the header.
 *
 * Docs: https://docs.tatum.io/docs/rpc/sui-rpc-documentation
 */

const RPC_URL = process.env.NEXT_PUBLIC_TATUM_SUI_RPC!;
const API_KEY = process.env.TATUM_API_KEY!;

let requestId = 1;

/**
 * Base JSON-RPC 2.0 call to the Tatum Sui node.
 *
 * @param method — Sui RPC method name (e.g. "sui_getObject")
 * @param params — array of parameters for the method
 * @returns the "result" field from the JSON-RPC response
 */
export async function suiRPC<T = unknown>(method: string, params: unknown[]): Promise<T> {
  const id = requestId++;

  const response = await fetch(RPC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id,
      method,
      params,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Tatum RPC HTTP error (${response.status}): ${text}`);
  }

  const json = await response.json();

  if (json.error) {
    throw new Error(`Sui RPC error [${json.error.code}]: ${json.error.message}`);
  }

  return json.result as T;
}

/**
 * Fetch a Sui object by its ID, including its full content.
 *
 * @param objectId — hex object ID
 */
export async function getObject(objectId: string) {
  return suiRPC("sui_getObject", [
    objectId,
    {
      showContent: true,
      showOwner: true,
      showType: true,
    },
  ]);
}

/**
 * Fetch all objects owned by a given Sui address.
 *
 * @param address — owner Sui address
 */
export async function getOwnedObjects(address: string) {
  return suiRPC("suix_getOwnedObjects", [
    address,
    {
      options: {
        showContent: true,
        showType: true,
      },
    },
  ]);
}

/**
 * Execute a signed transaction block.
 *
 * @param txBytes    — base64-encoded transaction bytes
 * @param signatures — array of base64-encoded signatures
 */
export async function executeTransaction(txBytes: string, signatures: string[]) {
  return suiRPC("sui_executeTransactionBlock", [
    txBytes,
    signatures,
    {
      showEffects: true,
      showEvents: true,
      showObjectChanges: true,
    },
    "WaitForLocalExecution",
  ]);
}

/**
 * Dry-run / inspect a transaction to read return values without submitting.
 * Used by queryDataset to read blob_id from the contract.
 *
 * @param txBytes  — base64-encoded transaction bytes
 * @param sender   — sender address for simulation context
 */
export async function devInspectTransaction(txBytes: string, sender: string) {
  return suiRPC("sui_devInspectTransactionBlock", [
    sender,
    txBytes,
    null,
    null,
  ]);
}

/**
 * Mock function to return a publisher trust score.
 */
export async function getPublisherTrustScore(address: string): Promise<number> {
  const hash = address.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return (hash % 100) + 1;
}
