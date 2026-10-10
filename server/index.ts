import { readFileSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { MAX_BODY_BYTES, PORT } from "./config.ts";
import { extractFromConversation, toTrackedPromises, type ConversationInput } from "./gemini.ts";

// Promises found by /api/extract aren't saved anywhere; the website decides what to keep.
const WEB_SPACE_ID = "web";
// Dev page at http://localhost:3001/ for trying the endpoint by hand.
const PLAYGROUND_HTML = readFileSync(new URL("./playground.html", import.meta.url));

// POST /api/extract
//   body:  { "text": "pasted chat..." }  and/or  { "image": "data:image/png;base64,..." }
//   200:   { "promises": TrackedPromise[] }
//   4xx/5xx: { "error": "..." }
createServer(async (req, res) => {
  try {
    if (req.method === "POST" && req.url === "/api/extract") {
      const input = parseInput(await readJson(req));
      if (!input) return sendJson(res, 400, { error: 'Send "text" and/or "image" (a base64 data URL).' });

      const found = await extractFromConversation(input);
      const promises = toTrackedPromises(found, WEB_SPACE_ID, input.text ?? "(screenshot)");
      return sendJson(res, 200, { promises });
    }
    if (req.method === "GET" && req.url === "/") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      return res.end(PLAYGROUND_HTML);
    }
    sendJson(res, 404, { error: "Not found" });
  } catch (err) {
    console.error("Request failed:", err);
    sendJson(res, err instanceof BodyTooLargeError ? 413 : 500, { error: (err as Error).message });
  }
}).listen(PORT, "127.0.0.1", () => {
  console.log(`Gemini API on http://localhost:${PORT}/api/extract (try it at http://localhost:${PORT}/)`);
});

function parseInput(body: unknown): ConversationInput | null {
  if (typeof body !== "object" || body === null) return null;
  const { text, image } = body as { text?: unknown; image?: unknown };

  const input: ConversationInput = {};
  if (typeof text === "string" && text.trim()) input.text = text;
  if (typeof image === "string") {
    const match = image.match(/^data:(image\/[\w.+-]+);base64,(.+)$/);
    if (!match) return null;
    input.image = { mimeType: match[1], data: Buffer.from(match[2], "base64") };
  }
  return input.text || input.image ? input : null;
}

class BodyTooLargeError extends Error {}

async function readJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new BodyTooLargeError("Request body too large");
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return null;
  }
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}
