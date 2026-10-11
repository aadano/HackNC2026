import { useRef, useState, type FormEvent } from "react";
import { extractPromises } from "../services/promiseExtraction";
import { PromiseReview } from "./PromiseReview";
import type { PromiseDraft } from "../types/promise";
import "./Pasteconversation.css";

interface Props {
  // Called with only the drafts the user chose to keep. Pass `addPromises` from useUserPromises.
  onSave: (drafts: PromiseDraft[]) => Promise<void>;
}

export function PasteConversation({ onSave }: Props) {
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [drafts, setDrafts] = useState<PromiseDraft[] | null>(null); // null = not reviewing
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // Step 1: send the text/screenshot to Gemini via the server.
  async function handleAnalyze(event: FormEvent) {
    event.preventDefault();
    if (busy || (!text.trim() && !image)) return;

    setBusy(true);
    setMessage(null);
    try {
      const found = await extractPromises(text, image);
      if (found.length === 0) setMessage("No promises found in that conversation.");
      else setDrafts(found);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  // Step 2: save the ones the user kept.
  async function handleConfirm(selected: PromiseDraft[]) {
    setBusy(true);
    setMessage(null);
    try {
      await onSave(selected);
      setMessage(`Saved ${selected.length} promise${selected.length === 1 ? "" : "s"}.`);
      setText("");
      setImage(null);
      setDrafts(null);
    } catch (err) {
      console.error(err);
      setMessage("Couldn't save. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (drafts) {
    return (
      <section className="paste">
        <PromiseReview
          drafts={drafts}
          busy={busy}
          onConfirm={handleConfirm}
          onCancel={() => {
            setDrafts(null);
            setImage(null); // the file input remounts empty, so clear the state to match
          }}
        />
        {message && <p className="paste-message">{message}</p>}
      </section>
    );
  }

  return (
    <section className="paste">
      <h2>Add promises</h2>
      <form onSubmit={handleAnalyze}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste a conversation here, or upload a screenshot…"
          rows={5}
        />
        <div className="paste-actions">
          <input
            ref={fileInput}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => setImage(e.target.files?.[0] ?? null)}
          />
          <button type="submit" disabled={busy || (!text.trim() && !image)}>
            {busy ? "Analyzing…" : "Find promises"}
          </button>
        </div>
      </form>
      {message && <p className="paste-message">{message}</p>}
    </section>
  );
}