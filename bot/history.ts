// Last few messages per conversation, so Gemini can resolve replies like "I got it".
// In memory only: a restart forgets context, which is fine.
export interface ChatLine {
  sender: string;
  text: string;
}

const MAX_LINES = 15;
const bySpace = new Map<string, ChatLine[]>();

export function remember(spaceId: string, line: ChatLine): ChatLine[] {
  const lines = bySpace.get(spaceId) ?? [];
  lines.push(line);
  if (lines.length > MAX_LINES) lines.shift();
  bySpace.set(spaceId, lines);
  return lines;
}
