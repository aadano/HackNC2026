# Gemini API

Turns pasted chat text or a chat screenshot into `PromiseDraft` JSON
(see `src/types/promise.ts`). Stateless: nothing is saved, the website decides what to keep.

## Run

```
npm run server   # API on http://localhost:3001 (needs GEMINI_API_KEY in .env)
                 # open http://localhost:3001/ to try it by hand (paste text or a screenshot)
npm run dev      # website; Vite forwards /api/* to the server
```

## `POST /api/extract`

Send `text`, `image`, or both:

```json
{ "text": "Jordan: can you send the report?\nYou: I'll send it tonight" }
{ "image": "data:image/png;base64,iVBORw0KGgo..." }
```

Response `200`:

```json
{
  "promises": [
    {
      "id": null,
      "description": "send the report",
      "promisor": "You",
      "promisorPhone": null,
      "deadline": "2026-10-10T23:59:59-04:00",
      "status": "pending",
      "sourceText": "Jordan: can you send the report?\nYou: I'll send it tonight",
      "spaceId": "web",
      "remindedAt": null,
      "createdAt": "2026-10-10T20:01:12.000Z"
    }
  ]
}
```

- `id` is always `null`: these are drafts. The website gives each one an id when the user saves it.
- `promisor` is a name from the conversation, `"You"` for the user (right-side bubbles in screenshots),
  or `"Unknown"` if Gemini can't tell who promised. The review step is a good place to let the user fill that in.
- `deadline` is ISO 8601 or `null`. `sourceText` is `"(screenshot)"` for images.
- Vague stuff ("we should hang out sometime") and low-confidence guesses are left out, so `promises` can be `[]`.
- Errors: `400` bad input, `413` body over 15 MB, `500` Gemini failed. Body is `{ "error": "..." }`.

## Calling it from React

```ts
import type { PromiseDraft, TrackedPromise } from "./types/promise";

export async function extractPromises(input: { text?: string; image?: string }): Promise<PromiseDraft[]> {
  const res = await fetch("/api/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error);
  return body.promises;
}

// <input type="file" accept="image/*"> -> data URL for `image`
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// When the user confirms a draft, number it after the highest existing id
// (not the list length, so deleting #2 can't make two promises share an id).
export function saveDraft(draft: PromiseDraft, existing: TrackedPromise[]): TrackedPromise {
  const highest = Math.max(0, ...existing.map((p) => Number(p.id) || 0));
  return { ...draft, id: String(highest + 1) };
}
```

## Files

- `index.ts` – HTTP server and request validation
- `playground.html` – dev page served at `/` for trying the endpoint
- `gemini.ts` – prompts, JSON schemas, Gemini calls (also used by the iMessage bot in `bot/`)
- `config.ts` – model, timezone, confidence threshold, port
- `testsuite/extractor_test.ts` – `npm run test:extractor`, runs Gemini on sample chats
