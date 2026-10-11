import { readFileSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { MAX_BODY_BYTES, PORT } from "./config.ts";
import { handleExtract } from "./extract.ts";

// Local dev server. When deployed, Firebase runs functions/src/index.ts instead.

// Dev page at http://localhost:3001/ for trying the endpoint by hand.
const PLAYGROUND_HTML = readFileSync(new URL("./playground.html", import.meta.url));

if (!process.env.GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY is missing. Add it to .env in the repo root (next to package.json), then restart.");
  process.exit(1);
}

createServer(async (req, res) => {
  try {
    if (req.method === "POST" && req.url === "/api/extract") {
      const started = Date.now();
      console.log("→ POST /api/extract");
      const result = await handleExtract(await readJson(req));
      console.log(`← ${result.status} in ${((Date.now() - started) / 1000).toFixed(1)}s`);
      return sendJson(res, result.status, result.body);
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
