# Gemini API

Turns pasted chat text or a chat screenshot into `TrackedPromise` JSON
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
      "id": "6f1c…",
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

- `promisor` is a name from the conversation, or `"You"` for the user (right-side bubbles in screenshots).
- `deadline` is ISO 8601 or `null`. `sourceText` is `"(screenshot)"` for images.
- Vague stuff ("we should hang out sometime") and low-confidence guesses are left out, so `promises` can be `[]`.
- Errors: `400` bad input, `413` body over 15 MB, `500` Gemini failed. Body is `{ "error": "..." }`.

## Calling it from React

```ts
import type { TrackedPromise } from "./types/promise";

export async function extractPromises(input: { text?: string; image?: string }): Promise<TrackedPromise[]> {
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
```

## Files

- `index.ts` – HTTP server and request validation
- `playground.html` – dev page served at `/` for trying the endpoint
- `gemini.ts` – prompts, JSON schemas, Gemini calls (also used by the iMessage bot in `bot/`)
- `config.ts` – model, timezone, confidence threshold, port
- `testsuite/extractor_test.ts` – `npm run test:extractor`, runs Gemini on sample chats
