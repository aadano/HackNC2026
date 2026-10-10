export const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.6-flash";
export const TIMEZONE = process.env.BOT_TIMEZONE ?? "America/New_York";

// Gemini's 0-1 confidence below which a "promise" is ignored.
export const MIN_CONFIDENCE = 0.7;
export const REMINDER_CHECK_MS = 30_000;
