/**
 * contract.ts — Vela Move contract interaction helpers
 *
 * Builds Programmable Transaction Blocks (PTBs) using @mysten/sui/transactions
 * and executes them via the Tatum RPC endpoint. The frontend signs transactions
 * using the connected wallet (@mysten/dapp-kit) and passes bytes back here.
 */

import { Transaction } from "@mysten/sui/transactions";
import { SuiClient } from "@mysten/sui/client";
import { getObject, suiRPC } from "./tatum";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;
const REGISTRY_ID = process.env.NEXT_PUBLIC_REGISTRY_ID!;
const RPC_URL = process.env.NEXT_PUBLIC_TATUM_SUI_RPC!;

// Server-side SuiClient used only to resolve object references when building PTBs
function getSuiClient() {
  return new SuiClient({ url: RPC_URL });
}

// ===== Types =====

export interface DatasetOnChain {
  id: string;
  blob_id: string;
  card_blob_id: string;
  file_hash: string;
  name: string;
  description: string;
  owner: string;
  price_mist: string;
  timestamp: string;
  category: string;
  subscribers: string[];
}

export interface PublishDatasetParams {
  blobId: string;
  cardBlobId: string;
  fileHash: string;
  name: string;
  description: string;
  priceMist: number;
  category: string;
}

// ===== Transaction Builders =====

/**
 * Build a PTB for publish_dataset entry function.
 * Returns serialized transaction bytes (base64) for wallet signing.
 *
 * @param params — dataset metadata including both Walrus blob IDs
 * @param senderAddress — the publisher's Sui address
 */
export async function buildPublishDatasetTx(
  params: PublishDatasetParams,
  senderAddress: string
): Promise<string> {
  const tx = new Transaction();
  tx.setSender(senderAddress);

  const timestamp = BigInt(Date.now());

  tx.moveCall({
    target: `${CONTRACT_ADDRESS}::registry::publish_dataset`,
    arguments: [
      tx.object(REGISTRY_ID),
      tx.pure.vector("u8", Array.from(new TextEncoder().encode(params.blobId))),
      tx.pure.vector("u8", Array.from(new TextEncoder().encode(params.cardBlobId))),
      tx.pure.vector("u8", Array.from(new TextEncoder().encode(params.name))),
      tx.pure.vector("u8", Array.from(new TextEncoder().encode(params.description))),
      tx.pure.u64(params.priceMist),
      tx.pure.vector("u8", Array.from(new TextEncoder().encode(params.category))),
      tx.pure.u64(timestamp),
      tx.pure.vector("u8", Array.from(new TextEncoder().encode(params.fileHash))),
    ],
  });

  // Serialize to base64
  const bytes = await tx.build({ client: getSuiClient() });
  return Buffer.from(bytes).toString("base64");
}

/**
 * Build a PTB for subscribe entry function.
 * Handles coin splitting for the subscription price.
 *
 * @param datasetId   — the Dataset object ID to subscribe to
 * @param priceMist   — subscription price in MIST
 * @param senderAddress — subscriber's Sui address
 * @param coinObjectId  — a SUI coin object the sender owns
 */
export async function buildSubscribeTx(
  datasetId: string,
  priceMist: bigint,
  senderAddress: string,
  coinObjectId: string
): Promise<string> {
  const tx = new Transaction();
  tx.setSender(senderAddress);

  // Split exact payment amount from user's coin
  const [paymentCoin] = tx.splitCoins(tx.object(coinObjectId), [
    tx.pure.u64(priceMist),
  ]);

  tx.moveCall({
    target: `${CONTRACT_ADDRESS}::registry::subscribe`,
    arguments: [
      tx.object(datasetId),
      paymentCoin,
    ],
  });

  const bytes = await tx.build({ client: getSuiClient() });
  return Buffer.from(bytes).toString("base64");
}

/**
 * Build a PTB to update the subscription price of a dataset.
 * 
 * @param datasetId   — the Dataset object ID
 * @param newPriceMist — the new subscription price in MIST
 * @param senderAddress — the owner's Sui address
 */
export async function buildUpdatePriceTx(
  datasetId: string,
  newPriceMist: number,
  senderAddress: string
): Promise<string> {
  const tx = new Transaction();
  tx.setSender(senderAddress);

  tx.moveCall({
    target: `${CONTRACT_ADDRESS}::registry::update_price`,
    arguments: [
      tx.object(datasetId),
      tx.pure.u64(newPriceMist),
    ],
  });

  const bytes = await tx.build({ client: getSuiClient() });
  return Buffer.from(bytes).toString("base64");
}

// ===== Read Functions (via Tatum RPC) =====

/**
 * Parse a raw Sui object response into a typed DatasetOnChain.
 */
function parseDatasetObject(raw: Record<string, unknown>): DatasetOnChain | null {
  try {
    const data = raw as {
      data?: {
        objectId?: string;
        content?: {
          fields?: Record<string, unknown>;
        };
      };
    };
    const fields = data?.data?.content?.fields as Record<string, unknown> | undefined;
    if (!fields) return null;

    return {
      id: data.data?.objectId ?? "",
      blob_id: (fields.blob_id as string) ?? "",
      card_blob_id: (fields.card_blob_id as string) ?? "",
      file_hash: (fields.file_hash as string) ?? "",
      name: (fields.name as string) ?? "",
      description: (fields.description as string) ?? "",
      owner: (fields.owner as string) ?? "",
      price_mist: String(fields.price_mist ?? "0"),
      timestamp: String(fields.timestamp ?? "0"),
      category: (fields.category as string) ?? "",
      subscribers: ((fields.subscribers as string[]) ?? []),
    };
  } catch {
    return null;
  }
}

/**
 * Fetch a single Dataset object from the chain by its object ID.
 *
 * @param datasetId — Sui object ID of the Dataset
 */
export async function queryDataset(datasetId: string): Promise<DatasetOnChain | null> {
  const raw = await getObject(datasetId);
  return parseDatasetObject(raw as Record<string, unknown>);
}

/**
 * Get all dataset IDs from the Registry shared object.
 *
 * @returns array of dataset object IDs
 */
export async function getAllDatasets(): Promise<string[]> {
  const raw = await getObject(REGISTRY_ID) as {
    data?: {
      content?: {
        fields?: {
          datasets?: string[];
          total?: string;
        };
      };
    };
  };

  const fields = raw?.data?.content?.fields;
  if (!fields) return [];

  return fields.datasets ?? [];
}

/**
 * Fetch multiple Dataset objects in parallel.
 * Returns only successfully parsed datasets (skips failed fetches).
 *
 * @param ids — array of dataset object IDs
 */
export async function getDatasetsBatch(ids: string[]): Promise<DatasetOnChain[]> {
  const results = await Promise.allSettled(
    ids.map((id) => queryDataset(id))
  );

  return results
    .filter(
      (r): r is PromiseFulfilledResult<DatasetOnChain> =>
        r.status === "fulfilled" && r.value !== null
    )
    .map((r) => r.value);
}

/**
 * Fetch multiple objects in a single RPC call using sui_multiGetObjects.
 * More efficient than getDatasetsBatch for large registries.
 */
export async function multiGetDatasets(ids: string[]): Promise<DatasetOnChain[]> {
  if (ids.length === 0) return [];

  const results = await suiRPC<Array<Record<string, unknown>>>("sui_multiGetObjects", [
    ids,
    { showContent: true, showOwner: true, showType: true },
  ]);

  return results
    .map((raw) => parseDatasetObject(raw))
    .filter((d): d is DatasetOnChain => d !== null);
}
