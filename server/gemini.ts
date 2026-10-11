import { randomUUID } from "node:crypto";
import { GoogleGenAI, type Part } from "@google/genai";
import type { PromiseDraft, TrackedPromise } from "../src/types/promise.ts";
import { isValidDate } from "../src/utils/dateUtils.ts";
import { GEMINI_MODEL, GEMINI_TIMEOUT_MS, MIN_CONFIDENCE, TIMEZONE, UNKNOWN_PROMISOR } from "./config.ts";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { timeout: GEMINI_TIMEOUT_MS },
});

export interface ChatLine {
  sender: string;
  text: string;
}

export interface NewPromise {
  promisorPhone: string | null;
  promisorName: string;
  description: string;
  deadline: string | null;
  confidence: number;
}

export interface Extraction {
  newPromises: NewPromise[];
  completedPromiseIds: string[];
}

export interface ConversationInput {
  text?: string;
  image?: { mimeType: string; data: Buffer };
}

const PROMISE_RULES = `A promise is a concrete commitment by someone to do something:
  yes: "I'll send it tonight", "I got it" (replying to a request), "I can drive Saturday", "let me handle that"
  no:  "we should hang out sometime", "maybe I'll come", questions, things already done, sarcasm, jokes

For each promise:
  - promisorName: a short name. Use the phone number if no name is known.
  - description: short imperative phrase, e.g. "send the slides".
  - deadline: ISO 8601 with timezone offset, resolved from the current time. null if none was given.
  - confidence: 0 to 1.`;

const CHAT_INSTRUCTIONS = `You track promises in a group chat.
You get the recent chat history, the promises already being tracked, and the current time.
Only look for NEW commitments in the LAST message. Earlier messages are context only.

${PROMISE_RULES}
  - promisorPhone: the sender's phone if they promised themselves ("I'll..."); null if they named someone else.

Also list ids of tracked promises the LAST message says are done (e.g. "sent the slides!").`;

const CONVERSATION_INSTRUCTIONS = `You find promises in a conversation someone pasted as text or shared as a screenshot (from any chat app).
Look at the WHOLE conversation and list every promise in it.
In screenshots, messages on the right are from the user: call them "You". The other person's name is usually at the top.
If messages show their own dates or times, resolve deadlines from those; otherwise from the current time.

${PROMISE_RULES}
  - promisorPhone: always null.
  - promisorName here: the user (right-side bubbles, or lines labeled "Me"/"I"/"You") is "You".
    Otherwise use a name shown in the conversation. If you can't tell who made the promise,
    use exactly "${UNKNOWN_PROMISOR}". Never invent names or labels like "Them", "Other" or "Speaker 1".`;

const PROMISE_ITEM = {
  type: "object",
  properties: {
    promisorPhone: { type: ["string", "null"] },
    promisorName: { type: "string" },
    description: { type: "string" },
    deadline: { type: ["string", "null"] },
    confidence: { type: "number" },
  },
  required: ["promisorPhone", "promisorName", "description", "deadline", "confidence"],
};

const CHAT_SCHEMA = {
  type: "object",
  properties: {
    newPromises: { type: "array", items: PROMISE_ITEM },
    completedPromiseIds: { type: "array", items: { type: "string" } },
  },
  required: ["newPromises", "completedPromiseIds"],
};

const CONVERSATION_SCHEMA = {
  type: "object",
  properties: { promises: { type: "array", items: PROMISE_ITEM } },
  required: ["promises"],
};

function now() {
  return {
    now: new Date().toLocaleString("en-US", { timeZone: TIMEZONE, timeZoneName: "short" }),
    timezone: TIMEZONE,
  };
}

async function generate<T>(systemInstruction: string, contents: Part[], schema: object): Promise<T> {
  const res = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents,
    config: { systemInstruction, responseMimeType: "application/json", responseJsonSchema: schema },
  });
  if (!res.text) throw new Error("Gemini returned an empty response");
  return JSON.parse(res.text);
}

// Live chat: new promises in the latest message, plus tracked promises it completes.
export function extract(history: ChatLine[], tracked: TrackedPromise[]): Promise<Extraction> {
  const input = {
    ...now(),
    trackedPromises: tracked.map(({ id, promisor, description, deadline }) => ({ id, promisor, description, deadline })),
    history: history.map(({ sender, text }) => ({ sender, text })),
  };
  return generate(CHAT_INSTRUCTIONS, [{ text: JSON.stringify(input) }], CHAT_SCHEMA);
}

// Pasted text or a screenshot: every promise in the whole conversation.
export async function extractFromConversation(input: ConversationInput): Promise<NewPromise[]> {
  const parts: Part[] = [{ text: JSON.stringify({ ...now(), conversation: input.text ?? null }) }];
  if (input.image) {
    parts.push({ inlineData: { mimeType: input.image.mimeType, data: input.image.data.toString("base64") } });
  }
  const result = await generate<{ promises: NewPromise[] }>(CONVERSATION_INSTRUCTIONS, parts, CONVERSATION_SCHEMA);
  return result.promises;
}

// Drops low-confidence results and turns the rest into drafts with no id yet.
export function toDrafts(found: NewPromise[], spaceId: string, sourceText: string): PromiseDraft[] {
  return found
    .filter((np) => np.confidence >= MIN_CONFIDENCE)
    .map((np) => ({
      id: null,
      description: np.description,
      promisor: np.promisorName,
      promisorPhone: np.promisorPhone,
      deadline: isValidDate(np.deadline) ? np.deadline : null,
      status: "pending",
      sourceText,
      spaceId,
      remindedAt: null,
      createdAt: new Date().toISOString(),
    }));
}

// The bot saves straight away, so it gives each draft a unique id.
export function toTrackedPromises(found: NewPromise[], spaceId: string, sourceText: string): TrackedPromise[] {
  return toDrafts(found, spaceId, sourceText).map((draft) => ({ ...draft, id: randomUUID() }));
}
