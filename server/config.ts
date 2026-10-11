export const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.6-flash";
export const TIMEZONE = process.env.TIMEZONE ?? "America/New_York";

// Gemini's 0-1 confidence below which a "promise" is ignored. Kept low because the website
// shows every result for review, so a borderline one is better shown than silently dropped.
export const MIN_CONFIDENCE = 0.5;

// promisor when Gemini can't tell who made a promise from a pasted chat or screenshot.
export const UNKNOWN_PROMISOR = "Unknown";

// Give up on a Gemini call after this long instead of leaving the website spinning.
export const GEMINI_TIMEOUT_MS = 60_000;

export const PORT = Number(process.env.PORT ?? 3001);
// Room for a base64-encoded phone screenshot.
export const MAX_BODY_BYTES = 15 * 1024 * 1024;
