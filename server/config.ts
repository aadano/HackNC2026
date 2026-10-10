export const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.6-flash";
export const TIMEZONE = process.env.TIMEZONE ?? "America/New_York";

// Gemini's 0-1 confidence below which a "promise" is ignored.
export const MIN_CONFIDENCE = 0.7;

export const PORT = Number(process.env.PORT ?? 3001);
// Room for a base64-encoded phone screenshot.
export const MAX_BODY_BYTES = 15 * 1024 * 1024;
