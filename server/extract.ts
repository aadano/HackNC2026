import { extractFromConversation, toDrafts, type ConversationInput } from "./gemini.ts";

// Promises found here aren't saved anywhere; the website decides what to keep.
const WEB_SPACE_ID = "web";

export interface ExtractResult {
  status: number;
  body: unknown;
}

// POST /api/extract, shared by the local server (index.ts) and the Firebase function.
//   body:  { "text": "pasted chat..." }  and/or  { "image": "data:image/png;base64,..." }
//   200:   { "promises": PromiseDraft[] }  (id is null until the website saves it)
//   400:   { "error": "..." }
export async function handleExtract(body: unknown): Promise<ExtractResult> {
  const input = parseInput(body);
  if (!input) return { status: 400, body: { error: 'Send "text" and/or "image" (a base64 data URL).' } };

  const found = await extractFromConversation(input);
  const promises = toDrafts(found, WEB_SPACE_ID, input.text ?? "(screenshot)");
  return { status: 200, body: { promises } };
}

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
