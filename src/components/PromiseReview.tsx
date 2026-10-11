import { useState } from "react";
import type { PromiseDraft } from "../types/promise";

interface Props {
  drafts: PromiseDraft[];
  busy: boolean;
  onConfirm: (selected: PromiseDraft[]) => void;
  onCancel: () => void;
}

export function PromiseReview({ drafts, busy, onConfirm, onCancel }: Props) {
  // Track which drafts are ticked by index. Everything starts selected.
  const [selected, setSelected] = useState<Set<number>>(() => new Set(drafts.map((_, i) => i)));

  function toggle(index: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  const chosen = drafts.filter((_, i) => selected.has(i));

  return (
    <div className="review">
      <h2>Review what was found</h2>
      <ul className="review-list">
        {drafts.map((draft, i) => (
          <li key={i}>
            <label>
              <input type="checkbox" checked={selected.has(i)} onChange={() => toggle(i)} />
              <span className="review-text">
                <strong>{draft.description}</strong>
                <small>
                  {draft.promisor} ·{" "}
                  {draft.deadline ? new Date(draft.deadline).toLocaleString() : "No deadline"}
                </small>
              </span>
            </label>
          </li>
        ))}
      </ul>
      <div className="review-actions">
        <button type="button" onClick={onCancel} disabled={busy}>
          Discard
        </button>
        <button type="button" onClick={() => onConfirm(chosen)} disabled={busy || chosen.length === 0}>
          {busy ? "Saving…" : `Save ${chosen.length} selected`}
        </button>
      </div>
    </div>
  );
}