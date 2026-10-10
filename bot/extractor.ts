import { GoogleGenAI } from "@google/genai";
import type { TrackedPromise } from "../src/types/promise.ts";
import { GEMINI_MODEL, TIMEZONE } from "./config.ts";
import type { ChatLine } from "./history.ts";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

const INSTRUCTIONS = `You track promises in a group chat.
You get the recent chat history, the promises already being tracked, and the current time.
Only look for NEW commitments in the LAST message. Earlier messages are context only.

A promise is a concrete commitment by someone to do something:
  yes: "I'll send it tonight", "I got it" (replying to a request), "I can drive Saturday", "let me handle that"
  no:  "we should hang out sometime", "maybe I'll come", questions, things already done, sarcasm, jokes

For each new promise:
  - promisorPhone: the sender's phone if they promised themselves ("I'll..."); null if they named someone else.
  - promisorName: a short name. Use the phone number if no name is known.
  - description: short imperative phrase, e.g. "send the slides".
  - deadline: ISO 8601 with timezone offset, resolved from the current time. null if none was given.
  - confidence: 0 to 1.

Also list ids of tracked promises the LAST message says are done (e.g. "sent the slides!").`;

const SCHEMA = {
  type: "object",
  properties: {
    newPromises: {
      type: "array",
      items: {
        type: "object",
        properties: {
          promisorPhone: { type: ["string", "null"] },
          promisorName: { type: "string" },
          description: { type: "string" },
          deadline: { type: ["string", "null"] },
          confidence: { type: "number" },
        },
        required: ["promisorPhone", "promisorName", "description", "deadline", "confidence"],
      },
    },
    completedPromiseIds: { type: "array", items: { type: "string" } },
  },
  required: ["newPromises", "completedPromiseIds"],
};

export async function extract(history: ChatLine[], tracked: TrackedPromise[]): Promise<Extraction> {
  const input = {
    now: new Date().toLocaleString("en-US", { timeZone: TIMEZONE, timeZoneName: "short" }),
    timezone: TIMEZONE,
    trackedPromises: tracked.map(({ id, promisor, description, deadline }) => ({ id, promisor, description, deadline })),
    history: history.map(({ sender, text }) => ({ sender, text })),
  };

  const res = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: JSON.stringify(input),
    config: {
      systemInstruction: INSTRUCTIONS,
      responseMimeType: "application/json",
      responseJsonSchema: SCHEMA,
    },
  });

  return JSON.parse(res.text ?? '{"newPromises":[],"completedPromiseIds":[]}');
}
