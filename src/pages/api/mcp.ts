import { NextApiRequest, NextApiResponse } from "next";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { server } from "@/mcp/server";

// We need to keep transports around per session
const transports = new Map<string, SSEServerTransport>();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    // SSE connection establishment
    const sessionId = crypto.randomUUID();
    
    // Disable Next.js response limit for SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Tell MCP SDK where to send POST messages
    const transport = new SSEServerTransport(`/api/mcp?sessionId=${sessionId}`, res);
    transports.set(sessionId, transport);

    // Clean up on disconnect
    res.on("close", () => {
      transports.delete(sessionId);
    });

    await server.connect(transport);
    return;
  }

  if (req.method === "POST") {
    // Handle incoming JSON-RPC messages
    const sessionId = req.query.sessionId as string;
    if (!sessionId) {
      res.status(400).send("Missing sessionId");
      return;
    }

    const transport = transports.get(sessionId);
    if (!transport) {
      res.status(404).send("Session not found");
      return;
    }

    // In Next.js pages/api, the body is already parsed if it's JSON
    await transport.handlePostMessage(req, res, req.body);
    return;
  }

  res.status(405).send("Method Not Allowed");
}
