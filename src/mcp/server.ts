import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getAllDatasets, multiGetDatasets, queryDataset } from "../lib/contract";
import { getPublisherTrustScore } from "../lib/tatum";
import { chatWithDataset } from "../lib/groq";

// Initialize the MCP Server
export const server = new McpServer({
  name: "vela-mcp",
  version: "1.0.0",
});

// Tool: vela_list_datasets
server.tool(
  "vela_list_datasets",
  "Fetches all datasets from the registry via Tatum RPC",
  {},
  async () => {
    try {
      const ids = await getAllDatasets();
      const datasets = await multiGetDatasets(ids);
      return {
        content: [{ type: "text", text: JSON.stringify(datasets, null, 2) }],
      };
    } catch (e) {
      return {
        content: [{ type: "text", text: `Error: ${e}` }],
        isError: true,
      };
    }
  }
);

// Tool: vela_get_dataset
server.tool(
  "vela_get_dataset",
  "Returns full dataset info including blob_id, card_blob_id, price, owner, subscribers count",
  { dataset_id: z.string() },
  async ({ dataset_id }) => {
    try {
      const dataset = await queryDataset(dataset_id);
      if (!dataset) throw new Error("Dataset not found");
      return {
        content: [{ type: "text", text: JSON.stringify(dataset, null, 2) }],
      };
    } catch (e) {
      return {
        content: [{ type: "text", text: `Error: ${e}` }],
        isError: true,
      };
    }
  }
);

// Tool: vela_query_dataset_blob
server.tool(
  "vela_query_dataset_blob",
  "Oracle function to get the Walrus blob ID for a dataset",
  { dataset_id: z.string() },
  async ({ dataset_id }) => {
    try {
      const dataset = await queryDataset(dataset_id);
      if (!dataset) throw new Error("Dataset not found");
      return {
        content: [{ type: "text", text: dataset.blob_id }],
      };
    } catch (e) {
      return {
        content: [{ type: "text", text: `Error: ${e}` }],
        isError: true,
      };
    }
  }
);

// Tool: vela_get_dataset_card
server.tool(
  "vela_get_dataset_card",
  "Fetches and returns the AI-generated dataset card JSON from Walrus",
  { dataset_id: z.string() },
  async ({ dataset_id }) => {
    try {
      const dataset = await queryDataset(dataset_id);
      if (!dataset || !dataset.card_blob_id) throw new Error("Dataset or card not found");
      
      const WALRUS_AGGREGATOR = process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR_URL || "https://aggregator.walrus-testnet.walrus.space";
      const res = await fetch(`${WALRUS_AGGREGATOR}/v1/${dataset.card_blob_id}`);
      if (!res.ok) throw new Error(`Walrus fetch failed: ${res.status}`);
      const text = await res.text();
      
      return {
        content: [{ type: "text", text }],
      };
    } catch (e) {
      return {
        content: [{ type: "text", text: `Error: ${e}` }],
        isError: true,
      };
    }
  }
);

// Tool: vela_get_publisher_trust_score
server.tool(
  "vela_get_publisher_trust_score",
  "Returns the Tatum-powered trust score for an address",
  { address: z.string() },
  async ({ address }) => {
    try {
      const score = await getPublisherTrustScore(address);
      return {
        content: [{ type: "text", text: String(score) }],
      };
    } catch (e) {
      return {
        content: [{ type: "text", text: `Error: ${e}` }],
        isError: true,
      };
    }
  }
);

// Tool: vela_chat_dataset
server.tool(
  "vela_chat_dataset",
  "Fetches sample from Walrus, sends to Groq, returns AI answer",
  { dataset_id: z.string(), question: z.string() },
  async ({ dataset_id, question }) => {
    try {
      const dataset = await queryDataset(dataset_id);
      if (!dataset) throw new Error("Dataset not found");
      
      const WALRUS_AGGREGATOR = process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR_URL || "https://aggregator.walrus-testnet.walrus.space";
      const res = await fetch(`${WALRUS_AGGREGATOR}/v1/${dataset.blob_id}`);
      if (!res.ok) throw new Error(`Walrus fetch failed: ${res.status}`);
      const rawData = await res.text();
      
      const answer = await chatWithDataset(rawData, question);
      
      return {
        content: [{ type: "text", text: answer }],
      };
    } catch (e) {
      return {
        content: [{ type: "text", text: `Error: ${e}` }],
        isError: true,
      };
    }
  }
);
